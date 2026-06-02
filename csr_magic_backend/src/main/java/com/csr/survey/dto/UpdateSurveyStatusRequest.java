package com.csr.survey.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSurveyStatusRequest(
    @NotBlank String status
) {}
