package com.csr.poster.dto;

import com.csr.poster.entity.AiPoster;

public record PosterResponse(
    Long id,
    Long activityId,
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
        return new PosterResponse(
            entity.getId(),
            entity.getActivityId(),
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
