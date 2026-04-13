package com.csr.user.dto;

import com.csr.auth.entity.User;

import java.util.List;

public record UserDetailResponse(
    Long id,
    String username,
    String displayName,
    String realName,
    String gender,
    String region,
    String role,
    String createdAt,
    String updatedAt,
    long participationCount,
    List<RecentParticipation> recentParticipations
) {
    public record RecentParticipation(
        Long id,
        String activityName,
        String state,
        String createdAt
    ) {}

    public static UserDetailResponse from(User entity, long participationCount, List<RecentParticipation> recentParticipations) {
        return new UserDetailResponse(
            entity.getId(),
            entity.getUsername(),
            entity.getDisplayName(),
            entity.getRealName(),
            entity.getGender(),
            entity.getRegion(),
            entity.getRole(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
            participationCount,
            recentParticipations
        );
    }
}
