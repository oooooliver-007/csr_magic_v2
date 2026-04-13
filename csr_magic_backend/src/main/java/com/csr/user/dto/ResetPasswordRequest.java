package com.csr.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank(message = "新密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度需在 6-100 位之间")
    String newPassword
) {}
