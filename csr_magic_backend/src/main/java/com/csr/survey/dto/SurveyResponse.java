package com.csr.survey.dto;

import com.csr.survey.entity.Survey;
import java.util.List;

public record SurveyResponse(
    Long id,
    Long activityId,
    String title,
    String description,
    String status,
    List<QuestionResponse> questions,
    Integer responseCount,
    String createdAt,
    String updatedAt
) {
    public record QuestionResponse(
        Long id,
        String questionText,
        String questionType,
        List<String> options,
        Boolean required,
        Integer sortOrder
    ) {}

    public static SurveyResponse from(Survey survey, List<QuestionResponse> questions, Integer responseCount) {
        return new SurveyResponse(
            survey.getId(),
            survey.getActivityId(),
            survey.getTitle(),
            survey.getDescription(),
            survey.getStatus(),
            questions,
            responseCount,
            survey.getCreatedAt().toString(),
            survey.getUpdatedAt() != null ? survey.getUpdatedAt().toString() : null
        );
    }
}
