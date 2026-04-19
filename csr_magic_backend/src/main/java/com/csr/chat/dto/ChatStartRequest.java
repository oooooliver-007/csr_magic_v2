package com.csr.chat.dto;

import jakarta.validation.constraints.NotNull;

/**
 * 创建对话会话请求
 */
public record ChatStartRequest(
    @NotNull(message = "活动 ID 不能为空")
    Long activityId
) {}
