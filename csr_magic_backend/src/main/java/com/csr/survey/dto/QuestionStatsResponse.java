package com.csr.survey.dto;

import java.util.List;

public record QuestionStatsResponse(
        Long questionId,
        String questionText,
        String questionType,
        Double averageRating,
        List<OptionRatio> optionRatios,
        List<String> textAnswers,
        Integer answerCount
) {
    public record OptionRatio(String option, Long count, Double ratio) {}
}
