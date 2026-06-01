package com.csr.survey.dto;

import com.csr.survey.entity.SurveyResponse;
import java.util.List;

public record SurveyResultResponse(
    Long id,
    Long surveyId,
    Long userId,
    String username,
    String displayName,
    Double sentimentScore,
    List<AnswerResult> answers,
    String createdAt
) {
    public record AnswerResult(
        Long questionId,
        String questionText,
        String questionType,
        String answerValue
    ) {}

    public static SurveyResultResponse from(
            SurveyResponse response,
            String username,
            String displayName,
            List<AnswerResult> answers) {
        return new SurveyResultResponse(
            response.getId(),
            response.getSurveyId(),
            response.getUserId(),
            username,
            displayName,
            response.getSentimentScore(),
            answers,
            response.getCreatedAt().toString()
        );
    }
}
