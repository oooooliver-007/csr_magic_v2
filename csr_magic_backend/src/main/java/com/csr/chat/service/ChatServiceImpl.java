package com.csr.chat.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.chat.dto.AiChatResult;
import com.csr.chat.dto.AiEnvelope;
import com.csr.chat.dto.ChatMessage;
import com.csr.chat.dto.ChatResponse;
import com.csr.chat.entity.ChatSession;
import com.csr.chat.repository.ChatSessionRepository;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.repository.UserActivityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/**
 * ChatService 实现。
 *
 * 关键设计：
 * - 会话所有权持久化到 chat_session 表（sessionId → userId / activityId / status），
 *   重启后仍能维持与 AI service 的绑定关系；{@link ChatSessionCleanupJob} 定时清理陈旧会话。
 * - confirm() 只在事务内（通过 {@link ChatSignupExecutor}）持久化 participation；
 *   对 AI service 的 `/complete` 回调在事务外调用，AI 服务失败不会回滚已落地的报名。
 * - 所有对 AI service 的 HTTP 调用走带超时的 `chatAiRestTemplate`，避免拖垮线程池。
 */
@Service
@Transactional(readOnly = true)
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);
    private static final ParameterizedTypeReference<AiEnvelope<AiChatResult>> AI_RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {};

    private final ActivityRepository activityRepository;
    private final UserActivityRepository userActivityRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatSignupExecutor signupExecutor;
    private final RestTemplate restTemplate;

    @Value("${ai-service.base-url:http://localhost:8000}")
    private String aiServiceBaseUrl;

    public ChatServiceImpl(
        ActivityRepository activityRepository,
        UserActivityRepository userActivityRepository,
        ChatSessionRepository chatSessionRepository,
        ChatSignupExecutor signupExecutor,
        @Qualifier("chatAiRestTemplate") RestTemplate restTemplate
    ) {
        this.activityRepository = activityRepository;
        this.userActivityRepository = userActivityRepository;
        this.chatSessionRepository = chatSessionRepository;
        this.signupExecutor = signupExecutor;
        this.restTemplate = restTemplate;
    }

    @Override
    @Transactional
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
        ChatSession session = new ChatSession(sessionId, userId, activityId, "COLLECTING");
        try {
            chatSessionRepository.saveAndFlush(session);
        } catch (DataIntegrityViolationException e) {
            // 极低概率 UUID 冲突：不覆盖已存在的活跃会话
            log.error("sessionId 冲突: sessionId={}", sessionId, e);
            throw new BusinessException(409, "会话创建冲突，请重试");
        }

        Map<String, Object> body = Map.of(
            "session_id", sessionId,
            "activity_id", activityId,
            "activity_name", activity.getName(),
            "template_type", activity.getTemplateType() != null
                ? activity.getTemplateType().name() : "BASIC",
            "form_schema", activity.getFormSchema() != null ? activity.getFormSchema() : ""
        );

        AiChatResult aiData = postToAi("/chat/start", body);
        log.info("创建对话会话: sessionId={}, activityId={}, userId={}", sessionId, activityId, userId);
        return toResponse(sessionId, activityId, aiData);
    }

    @Override
    public ChatResponse sendMessage(String sessionId, String content, Long userId) {
        ChatSession session = requireOwnedSession(sessionId, userId);

        Map<String, Object> body = Map.of(
            "session_id", sessionId,
            "content", content
        );
        AiChatResult aiData = postToAi("/chat/message", body);
        if (aiData != null) {
            signupExecutor.touch(session, aiData.safeStatus());
        }
        return toResponse(sessionId, session.getActivityId(), aiData);
    }

    @Override
    public ChatResponse confirm(String sessionId, Long userId) {
        // 1. 校验所有权（事务外只读）
        ChatSession session = requireOwnedSession(sessionId, userId);

        // 2. 查询最新会话状态（不需要事务）
        AiChatResult aiData = getFromAi("/chat/" + sessionId);
        if (aiData == null) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        if (!"CONFIRMING".equalsIgnoreCase(aiData.safeStatus()) && !aiData.safeIsComplete()) {
            throw new BusinessException(400, "字段尚未收集完毕，无法确认提交");
        }

        // 3. 事务内：写入 participation + 删除会话记录（独立 bean 保证 @Transactional 生效）
        ParticipationResponse participation = signupExecutor.signupAndCleanup(
            session, userId, aiData.safeCollectedFields());

        // 4. 事务外：通知 AI service 标记 completed，失败不阻塞主流程
        AiChatResult completed = tryMarkAiCompleted(sessionId);
        AiChatResult effective = completed != null ? completed : aiData;

        return toResponse(sessionId, participation.activityId(), effective)
            .withParticipationId(participation.id());
    }

    @Override
    public ChatResponse get(String sessionId, Long userId) {
        ChatSession session = requireOwnedSession(sessionId, userId);
        AiChatResult aiData = getFromAi("/chat/" + sessionId);
        if (aiData == null) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        return toResponse(sessionId, session.getActivityId(), aiData);
    }

    // ========== 内部辅助 ==========

    private ChatSession requireOwnedSession(String sessionId, Long userId) {
        Optional<ChatSession> found = chatSessionRepository.findById(sessionId);
        if (found.isEmpty()) {
            throw new BusinessException(404, "会话不存在或已过期");
        }
        ChatSession session = found.get();
        if (!Objects.equals(session.getUserId(), userId)) {
            throw new BusinessException(403, "无权访问该会话");
        }
        return session;
    }

    private AiChatResult tryMarkAiCompleted(String sessionId) {
        try {
            return postToAi("/chat/" + sessionId + "/complete", Map.of());
        } catch (BusinessException e) {
            // 失败不阻塞主流程（报名已在事务内落地）
            log.warn("标记 AI 会话 completed 失败，不影响报名结果: sessionId={}, reason={}",
                sessionId, e.getMessage());
            return null;
        }
    }

    private AiChatResult postToAi(String path, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        try {
            ResponseEntity<AiEnvelope<AiChatResult>> resp = restTemplate.exchange(
                aiServiceBaseUrl + path, HttpMethod.POST, entity, AI_RESPONSE_TYPE);
            return resp.getBody() != null ? resp.getBody().data() : null;
        } catch (RestClientException e) {
            log.error("调用 AI 服务失败: path={}, error={}", path, e.getMessage());
            throw new BusinessException(502, "AI 服务暂时不可用");
        }
    }

    private AiChatResult getFromAi(String path) {
        try {
            ResponseEntity<AiEnvelope<AiChatResult>> resp = restTemplate.exchange(
                aiServiceBaseUrl + path, HttpMethod.GET, null, AI_RESPONSE_TYPE);
            return resp.getBody() != null ? resp.getBody().data() : null;
        } catch (RestClientException e) {
            log.error("查询 AI 服务失败: path={}, error={}", path, e.getMessage());
            return null;
        }
    }

    private ChatResponse toResponse(String sessionId, Long activityId, AiChatResult aiData) {
        if (aiData == null) {
            return ChatResponse.of(sessionId, activityId, "", "COLLECTING", Map.of(), false, List.of());
        }
        List<ChatMessage> messages = aiData.safeMessages().stream()
            .map(m -> new ChatMessage(
                m.role() == null ? "" : m.role(),
                m.content() == null ? "" : m.content()))
            .toList();
        return ChatResponse.of(
            sessionId,
            activityId,
            aiData.safeReply(),
            aiData.safeStatus(),
            aiData.safeCollectedFields(),
            aiData.safeIsComplete(),
            messages
        );
    }
}
