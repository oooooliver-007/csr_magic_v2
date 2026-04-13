package com.csr.participation.dto;

import jakarta.validation.constraints.NotNull;

public record SignupRequest(
    @NotNull(message = "活动 ID 不能为空")
    Long activityId,
    String formData
) {}
