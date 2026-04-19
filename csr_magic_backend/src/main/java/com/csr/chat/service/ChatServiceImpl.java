package com.csr.chat.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.chat.dto.ChatMessage;
import com.csr.chat.dto.ChatResponse;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.repository.UserActivityRepository;
import com.csr.participation.service.ParticipationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * ChatService 实现：维护内存会话索引（sessionId → userId / activityId），
 * 并把 AI 对话 / 字段收集的职责下沉给 csr_ai_service。
 */
@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final ActivityRepository activityRepository;
    private final UserActivityRepository userActivityRepository;
    private final ParticipationService participationService;
    private final ObjectMapper objectMapper;
    private RestTemplate restTemplate;

    @Value("${ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    /** sessionId → 会话所有者（用户）与目标活动绑定 */
    private final Map<String, SessionOwner> sessionIndex = new ConcurrentHashMap<>();

    public ChatServiceImpl(
        ActivityRepository activityRepository,
        UserActivityRepository userActivityRepository,
        ParticipationService participationService,
        ObjectMapper objectMapper
    ) {
        this.activityRepository = activityRepository;
        this.userActivityRepository = userActivityRepository;
        this.participationService = participationService;
        this.objectMapper = objectMapper;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ChatResponse start(Long activityId, Long userId) {
        Activity activity = activityRepository.findById(activityId)
            .orElseThrow(() -> new ActivityNotFoundException(activityId));

        if ("ENDED".equalsIgnoreCase(activity.getStatus())) {
            throw new BusinessException(400, "活动已结束，无法发起对话报名");
        }
        if (userActivityRepository.existsByUserIdAndActivityId(userId, activityId)) {
            throw new BusinessException(400, "您已报名此活动，请勿重复报名");
        }

        String sessionId = UUID.randomUUID().toString().replace("-", "");
        sessionIndex.put(sessionId, new SessionOwner(userId, activityId));

        Map<String, Object> body = new HashMap<>();
        body.put("session_id", sessionId);
        body.put("activity_id", activityId);
        body.put("activity_name", activity.getName());
        body.put("template_type", activity.getTemplateType() != null
            ? activity.getTemplateType().name() : "BASIC");
        body.put("form_schema", activity.getFormSchema());

        Map<String, Object> aiData = postToAi("/chat/start", body);
        log.info("创建对话会话: sessionId={}, activityId={}, userId={}", sessionId, activityId, userId);
        return toResponse(sessionId, activityId, aiData);
    }

    @Override
    public ChatResponse sendMessage(String sessionId, String content, Long userId) {
        SessionOwner owner = requireOwner(sessionId, userId);

        Map<String, Object> body = new HashMap<>();
        body.put("session_id", sessionId);
        body.put("content", content);

        Map<String, Object> aiData = postToAi("/chat/message", body);
        return toResponse(sessionId, owner.activityId(), aiData);
    }

    @Override
    @Transactional
    public ChatResponse confirm(String sessionId, Long userId) {
        SessionOwner owner = requireOwner(sessionId, userId);

        // 1. 查询最新会话状态
        Map<String, Object> aiData = getFromAi("/chat/" + sessionId);
        if (aiData == null) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        String status = Objects.toString(aiData.get("status"), "");
        Boolean complete = aiData.get("is_complete") instanceof Boolean b ? b : Boolean.FALSE;
        @SuppressWarnings("unchecked")
        Map<String, Object> collected = (Map<String, Object>) aiData.getOrDefault(
            "collected_fields", Map.of());

        if (!"CONFIRMING".equalsIgnoreCase(status) && !Boolean.TRUE.equals(complete)) {
            throw new BusinessException(400, "字段尚未收集完毕，无法确认提交");
        }

        // 2. 写入 participation
        String formData;
        try {
            formData = objectMapper.writeValueAsString(collected);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "字段序列化失败: " + e.getMessage());
        }
        SignupRequest signupRequest = new SignupRequest(owner.activityId(), formData);
        ParticipationResponse participation = participationService.signup(userId, signupRequest);

        // 3. 通知 AI 服务标记完成（失败不阻塞主流程）
        Map<String, Object> completeData = postToAi("/chat/" + sessionId + "/complete", Map.of());
        ChatResponse base = toResponse(sessionId, owner.activityId(),
            completeData != null ? completeData : aiData);

        // 4. 清理会话索引（避免重复提交）
        sessionIndex.remove(sessionId);

        return base.withParticipationId(participation.id());
    }

    @Override
    public ChatResponse get(String sessionId, Long userId) {
        SessionOwner owner = requireOwner(sessionId, userId);
        Map<String, Object> aiData = getFromAi("/chat/" + sessionId);
        if (aiData == null) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        return toResponse(sessionId, owner.activityId(), aiData);
    }

    // ========== 内部辅助 ==========

    private SessionOwner requireOwner(String sessionId, Long userId) {
        SessionOwner owner = sessionIndex.get(sessionId);
        if (owner == null) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        if (!Objects.equals(owner.userId(), userId)) {
            throw new BusinessException(403, "无权访问该会话");
        }
        return owner;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> postToAi(String path, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<Map> resp = restTemplate.postForEntity(
                aiServiceBaseUrl + path, entity, Map.class);
            return extractData(resp.getBody());
        } catch (RestClientException e) {
            log.error("调用 AI 服务失败: path={}, error={}", path, e.getMessage());
            throw new BusinessException(502, "AI 服务暂时不可用");
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> getFromAi(String path) {
        try {
            ResponseEntity<Map> resp = restTemplate.exchange(
                aiServiceBaseUrl + path, HttpMethod.GET, null, Map.class);
            return extractData(resp.getBody());
        } catch (RestClientException e) {
            log.error("查询 AI 服务失败: path={}, error={}", path, e.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractData(Map<?, ?> body) {
        if (body == null) {
            return null;
        }
        Object data = body.get("data");
        if (data instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private ChatResponse toResponse(String sessionId, Long activityId, Map<String, Object> aiData) {
        if (aiData == null) {
            return ChatResponse.of(sessionId, activityId, "", "COLLECTING", Map.of(), false, List.of());
        }
        String reply = Objects.toString(aiData.getOrDefault("reply", ""), "");
        String status = Objects.toString(aiData.getOrDefault("status", "COLLECTING"), "COLLECTING");
        boolean complete = aiData.get("is_complete") instanceof Boolean b && b;
        Map<String, Object> collected = aiData.get("collected_fields") instanceof Map<?, ?> c
            ? (Map<String, Object>) c : Map.of();

        List<ChatMessage> messages = new ArrayList<>();
        Object rawMessages = aiData.get("messages");
        if (rawMessages instanceof List<?> list) {
            for (Object item : list) {
                if (item instanceof Map<?, ?> m) {
                    messages.add(new ChatMessage(
                        Objects.toString(m.get("role"), ""),
                        Objects.toString(m.get("content"), "")
                    ));
                }
            }
        }
        return ChatResponse.of(sessionId, activityId, reply, status, collected, complete, messages);
    }

    private record SessionOwner(Long userId, Long activityId) {}
}
