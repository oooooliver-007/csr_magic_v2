package com.csr.chat.dto;

import java.util.List;
import java.util.Map;

/**
 * 对话响应 DTO — Agent 回复 + 已收集字段 + 会话状态
 */
public record ChatResponse(
    String sessionId,
    Long activityId,
    String reply,
    String status,
    Map<String, Object> collectedFields,
    boolean complete,
    List<ChatMessage> messages,
    Long participationId
) {

    public static ChatResponse of(String sessionId, Long activityId, String reply, String status,
                                  Map<String, Object> collectedFields, boolean complete,
                                  List<ChatMessage> messages) {
        return new ChatResponse(sessionId, activityId, reply, status, collectedFields, complete, messages, null);
    }

    public ChatResponse withParticipationId(Long participationId) {
        return new ChatResponse(sessionId, activityId, reply, status, collectedFields, complete, messages, participationId);
    }
}
