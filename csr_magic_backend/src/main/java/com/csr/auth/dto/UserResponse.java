package com.csr.auth.dto;

import com.csr.auth.entity.User;

public record UserResponse(
    Long id,
    String username,
    String displayName,
    String realName,
    String gender,
    String region,
    String role,
    String createdAt
) {
    public static UserResponse from(User entity) {
        return new UserResponse(
            entity.getId(),
            entity.getUsername(),
            entity.getDisplayName(),
            entity.getRealName(),
            entity.getGender(),
            entity.getRegion(),
            entity.getRole(),
            entity.getCreatedAt().toString()
        );
    }
}
