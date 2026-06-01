package com.csr.survey.dto;

public record SurveyStatsResponse(
    Long surveyId,
    String title,
    Integer responseCount,
    Double averageSentiment,
    Integer totalQuestions
) {}
