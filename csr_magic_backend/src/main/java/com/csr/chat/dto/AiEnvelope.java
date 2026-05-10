package com.csr.chat.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * csr_ai_service 统一响应体：{ code, message, data }。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiEnvelope<T>(int code, String message, T data) {}
