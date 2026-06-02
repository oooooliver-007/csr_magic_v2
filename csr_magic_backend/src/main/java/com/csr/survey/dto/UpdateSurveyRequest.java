package com.csr.survey.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateSurveyRequest(
    @NotBlank @Size(max = 200) String title,
    String description,
    @NotEmpty @Valid List<QuestionItem> questions
) {
    public record QuestionItem(
        @NotBlank String questionText,
        @NotBlank String questionType,
        List<String> options,
        Boolean required,
        Integer sortOrder
    ) {}
}
