package com.csr.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 发送消息请求
 */
public record ChatMessageRequest(
    @NotBlank(message = "会话 ID 不能为空")
    String sessionId,
    @NotNull(message = "消息内容不能为空")
    String content
) {}
