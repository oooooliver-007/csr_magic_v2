package com.csr.survey.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitSurveyRequest(
    @NotNull Long surveyId,
    @NotEmpty @Valid List<AnswerItem> answers
) {
    public record AnswerItem(
        @NotNull Long questionId,
        String answerValue
    ) {}
}
