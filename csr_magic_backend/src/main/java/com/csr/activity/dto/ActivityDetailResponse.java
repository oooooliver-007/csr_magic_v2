package com.csr.activity.dto;

import com.csr.activity.entity.Activity;
import com.csr.participation.dto.ParticipationResponse;

/**
 * 活动详情响应 DTO：扩展 ActivityResponse，增加当前用户参与状态
 */
public record ActivityDetailResponse(
    Long id,
    Long eventId,
    String eventName,
    String name,
    String description,
    String templateType,
    String startTime,
    String endTime,
    Integer maxParticipants,
    String coverImage,
    String status,
    String formSchema,
    Long currentParticipants,
    String createdAt,
    String updatedAt,
    ParticipationResponse currentUserParticipation
) {
    public static ActivityDetailResponse from(Activity entity, Long currentParticipants, ParticipationResponse participation) {
        return new ActivityDetailResponse(
            entity.getId(),
            entity.getEvent().getId(),
            entity.getEvent().getName(),
            entity.getName(),
            entity.getDescription(),
            entity.getTemplateType().name(),
            entity.getStartTime() != null ? entity.getStartTime().toString() : null,
            entity.getEndTime() != null ? entity.getEndTime().toString() : null,
            entity.getMaxParticipants(),
            entity.getCoverImage(),
            entity.getStatus(),
            entity.getFormSchema(),
            currentParticipants,
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null,
            participation
        );
    }
}
