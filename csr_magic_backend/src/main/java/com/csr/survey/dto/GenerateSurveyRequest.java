package com.csr.survey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GenerateSurveyRequest(
    @NotNull Long activityId
) {}
