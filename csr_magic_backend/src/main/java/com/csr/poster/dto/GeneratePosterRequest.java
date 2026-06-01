package com.csr.poster.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GeneratePosterRequest(
    @NotNull Long activityId,
    @NotBlank String style,
    @Size(max = 500, message = "自定义提示词最长 500 字符")
    String userPrompt
) {
    @JsonCreator
    public GeneratePosterRequest {}
}