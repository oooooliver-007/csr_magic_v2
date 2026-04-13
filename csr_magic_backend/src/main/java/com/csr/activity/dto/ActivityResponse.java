package com.csr.activity.dto;

import com.csr.activity.entity.Activity;

public record ActivityResponse(
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
    String updatedAt
) {
    public static ActivityResponse from(Activity entity, Long currentParticipants) {
        return new ActivityResponse(
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
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null
        );
    }

    public static ActivityResponse from(Activity entity) {
        return from(entity, 0L);
    }
}
