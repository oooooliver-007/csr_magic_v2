package com.csr.poster.dto;

import com.csr.poster.entity.AiPoster;

public record PosterResponse(
    Long id,
    Long activityId,
    String activityName,
    String taskId,
    String style,
    String userPrompt,
    String status,
    String posterUrl,
    String errorMessage,
    String createdAt,
    String updatedAt
) {
    public static PosterResponse from(AiPoster entity) {
        return from(entity, null);
    }

    public static PosterResponse from(AiPoster entity, String activityName) {
        return new PosterResponse(
            entity.getId(),
            entity.getActivityId(),
            activityName,
            entity.getTaskId(),
            entity.getStyle(),
            entity.getUserPrompt(),
            entity.getStatus(),
            entity.getPosterUrl(),
            entity.getErrorMessage(),
            entity.getCreatedAt().toString(),
            entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null
        );
    }
}
