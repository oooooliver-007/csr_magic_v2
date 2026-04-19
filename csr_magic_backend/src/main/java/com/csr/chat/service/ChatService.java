package com.csr.chat.service;

import com.csr.chat.dto.ChatResponse;

/**
 * AI 对话报名服务 — 前端与 AI service 的网关层
 */
public interface ChatService {

    /**
     * 创建会话：校验活动可报名、生成 sessionId、调用 AI 服务获取开场白。
     */
    ChatResponse start(Long activityId, Long userId);

    /**
     * 转发用户消息到 AI 服务，返回 Agent 回复与字段状态。
     */
    ChatResponse sendMessage(String sessionId, String content, Long userId);

    /**
     * 确认提交：使用会话内收集的字段调用 participationService.signup，
     * 并通知 AI 服务将会话标记为 COMPLETED。
     */
    ChatResponse confirm(String sessionId, Long userId);

    /**
     * 查询会话状态（对话历史）。
     */
    ChatResponse get(String sessionId, Long userId);
}
