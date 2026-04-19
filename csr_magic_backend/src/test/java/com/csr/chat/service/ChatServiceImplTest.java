package com.csr.chat.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.chat.dto.ChatResponse;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.participation.service.ParticipationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private ParticipationService participationService;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ChatServiceImpl chatService;

    private Activity testActivity;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(chatService, "aiServiceBaseUrl", "http://ai");
        ReflectionTestUtils.setField(chatService, "restTemplate", restTemplate);
        ReflectionTestUtils.setField(chatService, "objectMapper", new ObjectMapper());

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setName("春季捐赠");
        testActivity.setTemplateType(TemplateType.DONATION);
        testActivity.setStatus("ONGOING");
    }

    private static Map<String, Object> aiOkBody(Map<String, Object> data) {
        return Map.of("code", 200, "message", "success", "data", data);
    }

    @Test
    @DisplayName("start: 正常创建会话并返回开场白")
    void start_success() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);

        Map<String, Object> aiData = new HashMap<>();
        aiData.put("reply", "你好！我来帮你完成「春季捐赠」的捐赠报名");
        aiData.put("status", "COLLECTING");
        aiData.put("is_complete", false);
        aiData.put("collected_fields", Map.of());
        aiData.put("messages", List.of(Map.of("role", "assistant", "content", "你好！")));
        when(restTemplate.postForEntity(eq("http://ai/chat/start"), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(aiData)));

        ChatResponse response = chatService.start(1L, 42L);

        assertNotNull(response.sessionId());
        assertFalse(response.sessionId().isEmpty());
        assertEquals(1L, response.activityId());
        assertEquals("COLLECTING", response.status());
        assertFalse(response.complete());
        assertTrue(response.reply().contains("春季捐赠"));
    }

    @Test
    @DisplayName("start: 活动不存在时抛出 404")
    void start_activityNotFound() {
        when(activityRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ActivityNotFoundException.class, () -> chatService.start(99L, 42L));
    }

    @Test
    @DisplayName("start: 活动已结束抛出 400")
    void start_activityEnded() {
        testActivity.setStatus("ENDED");
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));

        BusinessException ex = assertThrows(BusinessException.class, () -> chatService.start(1L, 42L));
        assertEquals(400, ex.getCode());
    }

    @Test
    @DisplayName("start: 已报名用户抛出 400")
    void start_alreadySignedUp() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(true);

        BusinessException ex = assertThrows(BusinessException.class, () -> chatService.start(1L, 42L));
        assertEquals(400, ex.getCode());
    }

    @Test
    @DisplayName("sendMessage: 非会话所有者返回 403")
    void sendMessage_forbidden() {
        // 先正常创建一个会话（userId=42）
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(restTemplate.postForEntity(eq("http://ai/chat/start"), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(Map.of(
                "reply", "hi", "status", "COLLECTING", "is_complete", false,
                "collected_fields", Map.of(), "messages", List.of()))));
        ChatResponse started = chatService.start(1L, 42L);

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.sendMessage(started.sessionId(), "100", 99L));
        assertEquals(403, ex.getCode());
    }

    @Test
    @DisplayName("sendMessage: 未知会话返回 404")
    void sendMessage_unknownSession() {
        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.sendMessage("nope", "hi", 1L));
        assertEquals(404, ex.getCode());
    }

    @Test
    @DisplayName("confirm: 字段齐全 → 调用 participationService.signup 并返回 participationId")
    void confirm_success() {
        // start
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(restTemplate.postForEntity(eq("http://ai/chat/start"), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(Map.of(
                "reply", "hi", "status", "COLLECTING", "is_complete", false,
                "collected_fields", Map.of(), "messages", List.of()))));
        ChatResponse started = chatService.start(1L, 42L);

        // GET /chat/{sessionId} → CONFIRMING + collected_fields
        Map<String, Object> confirming = new HashMap<>();
        confirming.put("reply", "确认提交？");
        confirming.put("status", "CONFIRMING");
        confirming.put("is_complete", true);
        confirming.put("collected_fields", Map.of("amount", 200, "note", "加油"));
        confirming.put("messages", List.of());
        when(restTemplate.exchange(
                contains("/chat/" + started.sessionId()),
                eq(HttpMethod.GET), eq(null), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(confirming)));

        // mark complete
        Map<String, Object> completed = new HashMap<>();
        completed.put("reply", "报名已提交成功");
        completed.put("status", "COMPLETED");
        completed.put("is_complete", true);
        completed.put("collected_fields", Map.of("amount", 200, "note", "加油"));
        completed.put("messages", List.of());
        when(restTemplate.postForEntity(
                contains("/chat/" + started.sessionId() + "/complete"),
                any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(completed)));

        // signup stub
        ParticipationResponse participation = new ParticipationResponse(
            7L, 42L, "u", "User", 1L, "春季捐赠", "PENDING", "{\"amount\":200}",
            null, null, null, null, "2026-04-19T10:00:00Z", null);
        when(participationService.signup(eq(42L), any(SignupRequest.class))).thenReturn(participation);

        ChatResponse result = chatService.confirm(started.sessionId(), 42L);

        assertEquals(7L, result.participationId());
        assertEquals("COMPLETED", result.status());

        ArgumentCaptor<SignupRequest> captor = ArgumentCaptor.forClass(SignupRequest.class);
        verify(participationService).signup(eq(42L), captor.capture());
        assertEquals(1L, captor.getValue().activityId());
        assertTrue(captor.getValue().formData().contains("amount"));
    }

    @Test
    @DisplayName("confirm: 字段未收集完毕抛出 400")
    void confirm_notReady() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(restTemplate.postForEntity(eq("http://ai/chat/start"), any(HttpEntity.class), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(Map.of(
                "reply", "hi", "status", "COLLECTING", "is_complete", false,
                "collected_fields", Map.of(), "messages", List.of()))));
        ChatResponse started = chatService.start(1L, 42L);

        Map<String, Object> collecting = new HashMap<>();
        collecting.put("reply", "请继续输入");
        collecting.put("status", "COLLECTING");
        collecting.put("is_complete", false);
        collecting.put("collected_fields", Map.of());
        collecting.put("messages", List.of());
        when(restTemplate.exchange(anyString(), eq(HttpMethod.GET), eq(null), eq(Map.class)))
            .thenReturn(ResponseEntity.ok(aiOkBody(collecting)));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.confirm(started.sessionId(), 42L));
        assertEquals(400, ex.getCode());
    }

    @Test
    @DisplayName("AI 服务异常时 postToAi 抛出 502")
    void aiServiceUnavailable_throws502() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(restTemplate.postForEntity(anyString(), any(HttpEntity.class), eq(Map.class)))
            .thenThrow(new RestClientException("connection refused"));

        BusinessException ex = assertThrows(BusinessException.class, () -> chatService.start(1L, 42L));
        assertEquals(502, ex.getCode());
    }
}
