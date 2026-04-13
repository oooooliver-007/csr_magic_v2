package com.csr.participation.dto;

import com.csr.participation.entity.UserActivity;

public record ParticipationResponse(
    Long id,
    Long userId,
    Long activityId,
    String state,
    String formData,
    String rejectReason,
    String createdAt,
    String updatedAt
) {
    public static ParticipationResponse from(UserActivity entity) {
        return new ParticipationResponse(
            entity.getId(),
            entity.getUser().getId(),
            entity.getActivity().getId(),
            entity.getState().name(),
            entity.getFormData(),
            entity.getRejectReason(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null
        );
    }
}
