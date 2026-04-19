package com.csr.chat.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 确认提交请求
 */
public record ChatConfirmRequest(
    @NotBlank(message = "会话 ID 不能为空")
    String sessionId
) {}
