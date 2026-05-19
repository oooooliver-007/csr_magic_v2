package com.csr.participation.dto;

import com.csr.participation.entity.UserActivity;

import java.util.List;

/**
 * 我的参与记录响应（包含活动信息）
 */
public record MyParticipationResponse(
    Long id,
    Long activityId,
    String activityName,
    String templateType,
    String state,
    String rejectReason,
    String createdAt,
    String updatedAt,
    List<FamilyMemberDto> familyMembers
) {
    public static MyParticipationResponse from(UserActivity entity) {
        return new MyParticipationResponse(
            entity.getId(),
            entity.getActivity().getId(),
            entity.getActivity().getName(),
            entity.getActivity().getTemplateType().name(),
            entity.getState().name(),
            entity.getRejectReason(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
            FamilyMemberJson.parse(entity.getFamilyMembers())
        );
    }
}
