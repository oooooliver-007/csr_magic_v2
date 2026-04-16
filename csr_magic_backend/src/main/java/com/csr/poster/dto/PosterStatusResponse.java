package com.csr.poster.dto;

public record PosterStatusResponse(
    String taskId,
    String status,
    String posterUrl,
    String errorMessage
) {}
