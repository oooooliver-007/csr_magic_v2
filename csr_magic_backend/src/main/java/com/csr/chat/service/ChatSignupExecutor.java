package com.csr.chat.service;

import com.csr.chat.entity.ChatSession;
import com.csr.chat.repository.ChatSessionRepository;
import com.csr.common.BusinessException;
import com.csr.participation.dto.ParticipationResponse;
import com.csr.participation.dto.SignupRequest;
import com.csr.participation.service.ParticipationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * 独立组件：在独立事务中完成「写 participation + 清理 chat_session」。
 *
 * 通过拆出独立 bean，避免 ChatServiceImpl 内部的自调用导致 @Transactional 注解失效；
 * 也让 ChatServiceImpl.confirm() 能在事务外安全地调用 AI service 的 /complete 回调。
 */
@Component
public class ChatSignupExecutor {

    private final ChatSessionRepository chatSessionRepository;
    private final ParticipationService participationService;
    private final ObjectMapper objectMapper;

    public ChatSignupExecutor(
        ChatSessionRepository chatSessionRepository,
        ParticipationService participationService,
        ObjectMapper objectMapper
    ) {
        this.chatSessionRepository = chatSessionRepository;
        this.participationService = participationService;
        this.objectMapper = objectMapper;
    }

    /**
     * 事务内：写入 participation 并删除会话记录。抛出异常时事务回滚，不影响外部 AI service 调用。
     */
    @Transactional
    public ParticipationResponse signupAndCleanup(ChatSession session, Long userId,
                                                  Map<String, Object> collectedFields) {
        String formData;
        try {
            formData = objectMapper.writeValueAsString(collectedFields);
        } catch (JsonProcessingException e) {
            throw new BusinessException(500, "字段序列化失败: " + e.getMessage());
        }
        SignupRequest signupRequest = new SignupRequest(session.getActivityId(), formData);
        ParticipationResponse participation = participationService.signup(userId, signupRequest);

        chatSessionRepository.delete(session);
        return participation;
    }

    /** 事务内：刷新会话状态 + updatedAt。 */
    @Transactional
    public void touch(ChatSession session, String nextStatus) {
        if (nextStatus != null && !nextStatus.isEmpty()) {
            session.setStatus(nextStatus);
        }
        session.setUpdatedAt(Instant.now());
        chatSessionRepository.save(session);
    }
}
