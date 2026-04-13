package com.csr.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateUserRequest(
    @Size(max = 100) String displayName,
    @Size(max = 100) String realName,
    @Size(max = 10) String gender,
    @Size(max = 100) String region,
    String role
) {}
