package com.csr.survey.dto;

import java.util.List;

public record AiGeneratedSurveyResponse(
    String title,
    String description,
    List<AiQuestion> questions
) {
    public record AiQuestion(
        String questionText,
        String questionType,
        List<String> options,
        Boolean required
    ) {}
}
