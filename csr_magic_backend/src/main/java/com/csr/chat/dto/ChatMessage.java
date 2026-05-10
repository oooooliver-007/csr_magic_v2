package com.csr.chat.dto;

/**
 * 对话消息（用户 / 助手）
 */
public record ChatMessage(
    String role,
    String content
) {}
