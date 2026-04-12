package com.csr.event.dto;

import com.csr.event.entity.Event;

public record EventResponse(
    Long id,
    String name,
    String description,
    String type,
    String startDate,
    String endDate,
    String coverImage,
    Boolean visible,
    String createdAt,
    String updatedAt
) {
    public static EventResponse from(Event entity) {
        return new EventResponse(
            entity.getId(),
            entity.getName(),
            entity.getDescription(),
            entity.getType(),
            entity.getStartDate() != null ? entity.getStartDate().toString() : null,
            entity.getEndDate() != null ? entity.getEndDate().toString() : null,
            entity.getCoverImage(),
            entity.getVisible(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null
        );
    }
}
