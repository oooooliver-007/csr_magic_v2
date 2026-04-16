package com.csr.poster.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record GeneratePosterRequest(
    @NotNull Long activityId,
    @NotBlank String style,
    String userPrompt
) {}
