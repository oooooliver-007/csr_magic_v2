package com.csr.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
    @NotBlank(message = "当前密码不能为空") String currentPassword,
    @NotBlank(message = "新密码不能为空") @Size(min = 6, message = "新密码长度不能少于6位") String newPassword
) {}
