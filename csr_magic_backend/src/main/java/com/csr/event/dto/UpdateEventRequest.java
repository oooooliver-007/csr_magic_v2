package com.csr.event.dto;

import jakarta.validation.constraints.Size;

public record UpdateEventRequest(
    @Size(max = 200, message = "事件名称不能超过200字")
    String name,
    String description,
    String type,
    String startDate,
    String endDate,
    String coverImage,
    Boolean visible
) {}
