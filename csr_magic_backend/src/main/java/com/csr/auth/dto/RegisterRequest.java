package com.csr.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "用户名不能为空") @Size(max = 50, message = "用户名最长50字符") String username,
    @NotBlank(message = "密码不能为空") @Size(min = 6, message = "密码至少6位") String password,
    @NotBlank(message = "姓名不能为空") String displayName,
    String region,
    String gender
) {}
