package com.csr.activity.dto;

import jakarta.validation.constraints.Size;

public record UpdateActivityRequest(
    Long eventId,

    @Size(max = 200, message = "活动名称不能超过200字")
    String name,

    String templateType,
    String description,
    String startTime,
    String endTime,
    Integer maxParticipants,
    String coverImage,
    String status
) {}
