package com.csr.chat.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.entity.TemplateType;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.chat.dto.AiChatResult;
import com.csr.chat.dto.AiEnvelope;
import com.csr.chat.dto.ChatResponse;
import com.csr.chat.entity.ChatSession;
import com.csr.chat.repository.ChatSessionRepository;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.repository.UserActivityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

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
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatSignupExecutor signupExecutor;

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ChatServiceImpl chatService;

    private Activity testActivity;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(chatService, "aiServiceBaseUrl", "http://ai");

        testActivity = new Activity();
        testActivity.setId(1L);
        testActivity.setName("春季捐赠");
        testActivity.setTemplateType(TemplateType.DONATION);
        testActivity.setStatus("ONGOING");
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static ParameterizedTypeReference<AiEnvelope<AiChatResult>> envType() {
        return any(ParameterizedTypeReference.class);
    }

    private static AiEnvelope<AiChatResult> ok(AiChatResult data) {
        return new AiEnvelope<>(200, "success", data);
    }

    private static AiChatResult collecting(String reply) {
        return new AiChatResult(null, reply, "COLLECTING", Map.of(), false, List.of());
    }

    private static AiChatResult confirming(Map<String, Object> collected) {
        return new AiChatResult(null, "确认提交？", "CONFIRMING", collected, true,
            List.of(new AiChatResult.AiChatMessage("assistant", "确认提交？")));
    }

    private static AiChatResult completed() {
        return new AiChatResult(null, "已提交", "COMPLETED", Map.of(), true, List.of());
    }

    private static ChatSession existingSession(String sid, Long userId, Long activityId) {
        ChatSession s = new ChatSession(sid, userId, activityId, "COLLECTING");
        return s;
    }

    private void stubStartHappyPath(Long activityId, Long userId) {
        when(activityRepository.findById(activityId)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(userId, activityId)).thenReturn(false);
        when(chatSessionRepository.saveAndFlush(any(ChatSession.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        when(restTemplate.exchange(eq("http://ai/chat/start"), eq(HttpMethod.POST),
                any(HttpEntity.class), envType()))
            .thenReturn(ResponseEntity.ok(ok(collecting("你好！春季捐赠"))));
    }

    @Test
    @DisplayName("start: 正常创建会话并返回开场白")
    void start_success() {
        stubStartHappyPath(1L, 42L);

        ChatResponse response = chatService.start(1L, 42L);

        assertNotNull(response.sessionId());
        assertFalse(response.sessionId().isEmpty());
        assertEquals(1L, response.activityId());
        assertEquals("COLLECTING", response.status());
        assertFalse(response.complete());
        assertTrue(response.reply().contains("春季捐赠"));

        ArgumentCaptor<ChatSession> captor = ArgumentCaptor.forClass(ChatSession.class);
        verify(chatSessionRepository).saveAndFlush(captor.capture());
        assertEquals(42L, captor.getValue().getUserId());
        assertEquals(1L, captor.getValue().getActivityId());
    }

    @Test
    @DisplayName("start: 活动不存在时抛出 404")
    void start_activityNotFound() {
        when(activityRepository.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ActivityNotFoundException.class, () -> chatService.start(99L, 42L));
        verify(chatSessionRepository, never()).saveAndFlush(any());
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
    @DisplayName("start: sessionId 冲突抛出 409")
    void start_sessionConflict() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(chatSessionRepository.saveAndFlush(any(ChatSession.class)))
            .thenThrow(new DataIntegrityViolationException("duplicate key"));

        BusinessException ex = assertThrows(BusinessException.class, () -> chatService.start(1L, 42L));
        assertEquals(409, ex.getCode());
    }

    @Test
    @DisplayName("sendMessage: 非会话所有者返回 403")
    void sendMessage_forbidden() {
        when(chatSessionRepository.findById("sess-1"))
            .thenReturn(Optional.of(existingSession("sess-1", 42L, 1L)));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.sendMessage("sess-1", "100", 99L));
        assertEquals(403, ex.getCode());
    }

    @Test
    @DisplayName("sendMessage: 未知会话返回 404")
    void sendMessage_unknownSession() {
        when(chatSessionRepository.findById("nope")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.sendMessage("nope", "hi", 1L));
        assertEquals(404, ex.getCode());
    }

    @Test
    @DisplayName("confirm: 字段齐全 → 调用 ChatSignupExecutor 并返回 participationId；AI /complete 失败不影响主流程")
    void confirm_success_completeFailsSilently() {
        ChatSession session = existingSession("sess-1", 42L, 1L);
        when(chatSessionRepository.findById("sess-1")).thenReturn(Optional.of(session));

        // GET /chat/sess-1 → CONFIRMING
        when(restTemplate.exchange(eq("http://ai/chat/sess-1"), eq(HttpMethod.GET),
                isNull(), envType()))
            .thenReturn(ResponseEntity.ok(ok(confirming(Map.of("amount", 200, "note", "加油")))));

        // POST /chat/sess-1/complete → 抛连接错误，验证不影响主流程
        when(restTemplate.exchange(contains("/chat/sess-1/complete"), eq(HttpMethod.POST),
                any(HttpEntity.class), envType()))
            .thenThrow(new RestClientException("connection refused"));

        ParticipationResponse participation = new ParticipationResponse(
            7L, 42L, "u", "User", 1L, "春季捐赠", "PENDING", "{\"amount\":200}",
            null, null, null, null, "2026-04-19T10:00:00Z", null);
        when(signupExecutor.signupAndCleanup(eq(session), eq(42L), any()))
            .thenReturn(participation);

        ChatResponse result = chatService.confirm("sess-1", 42L);

        assertEquals(7L, result.participationId());
        assertEquals("CONFIRMING", result.status()); // AI complete 失败时回落到 confirming 的 status

        ArgumentCaptor<Map<String, Object>> collectedCaptor = ArgumentCaptor.forClass(Map.class);
        verify(signupExecutor).signupAndCleanup(eq(session), eq(42L), collectedCaptor.capture());
        assertEquals(200, collectedCaptor.getValue().get("amount"));
    }

    @Test
    @DisplayName("confirm: 字段未收集完毕抛出 400 且不触发 signup")
    void confirm_notReady() {
        when(chatSessionRepository.findById("sess-1"))
            .thenReturn(Optional.of(existingSession("sess-1", 42L, 1L)));
        when(restTemplate.exchange(eq("http://ai/chat/sess-1"), eq(HttpMethod.GET),
                isNull(), envType()))
            .thenReturn(ResponseEntity.ok(ok(collecting("请继续输入"))));

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.confirm("sess-1", 42L));
        assertEquals(400, ex.getCode());
        verify(signupExecutor, never()).signupAndCleanup(any(), any(), any());
    }

    @Test
    @DisplayName("confirm: 未知会话抛出 404 且不触发 HTTP 调用 AI 服务")
    void confirm_unknownSession() {
        when(chatSessionRepository.findById("nope")).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> chatService.confirm("nope", 42L));
        assertEquals(404, ex.getCode());
        verify(restTemplate, never()).exchange(anyString(), any(HttpMethod.class),
            any(HttpEntity.class), envType());
    }

    @Test
    @DisplayName("AI 服务异常（超时/连接失败）时 start 返回 502")
    void aiServiceUnavailable_throws502() {
        when(activityRepository.findById(1L)).thenReturn(Optional.of(testActivity));
        when(userActivityRepository.existsByUserIdAndActivityId(42L, 1L)).thenReturn(false);
        when(chatSessionRepository.saveAndFlush(any(ChatSession.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), envType()))
            .thenThrow(new RestClientException("connection refused"));

        BusinessException ex = assertThrows(BusinessException.class, () -> chatService.start(1L, 42L));
        assertEquals(502, ex.getCode());
    }

    @Test
    @DisplayName("get: 返回当前会话状态")
    void get_success() {
        ChatSession session = existingSession("sess-1", 42L, 1L);
        when(chatSessionRepository.findById("sess-1")).thenReturn(Optional.of(session));
        when(restTemplate.exchange(eq("http://ai/chat/sess-1"), eq(HttpMethod.GET),
                isNull(), envType()))
            .thenReturn(ResponseEntity.ok(ok(completed())));

        ChatResponse response = chatService.get("sess-1", 42L);
        assertEquals("COMPLETED", response.status());
    }
}
