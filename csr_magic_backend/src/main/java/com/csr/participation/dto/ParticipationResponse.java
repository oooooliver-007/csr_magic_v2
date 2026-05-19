package com.csr.participation.dto;

import com.csr.participation.entity.UserActivity;

import java.util.List;

/**
 * 参与记录响应 DTO（含用户和活动信息，供管理端列表使用）
 */
public record ParticipationResponse(
    Long id,
    Long userId,
    String userName,
    String userDisplayName,
    Long activityId,
    String activityName,
    String state,
    String formData,
    String rejectReason,
    Long reviewedById,
    String reviewedByName,
    String reviewedAt,
    String createdAt,
    String updatedAt,
    List<FamilyMemberDto> familyMembers
) {
    public static ParticipationResponse from(UserActivity entity) {
        return new ParticipationResponse(
            entity.getId(),
            entity.getUser().getId(),
            entity.getUser().getUsername(),
            entity.getUser().getDisplayName(),
            entity.getActivity().getId(),
            entity.getActivity().getName(),
            entity.getState().name(),
            entity.getFormData(),
            entity.getRejectReason(),
            entity.getReviewedBy() != null ? entity.getReviewedBy().getId() : null,
            entity.getReviewedBy() != null ? entity.getReviewedBy().getDisplayName() : null,
            entity.getReviewedAt() != null ? entity.getReviewedAt().toString() : null,
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
            FamilyMemberJson.parse(entity.getFamilyMembers())
        );
    }
}
