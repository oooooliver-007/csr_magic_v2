package com.csr.participation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 审核请求 DTO（管理端）
 */
public record ReviewRequest(
    @NotNull(message = "审核操作不能为空")
    Action action,
    String rejectReason
) {
    public enum Action {
        APPROVE,
        REJECT
    }
}
