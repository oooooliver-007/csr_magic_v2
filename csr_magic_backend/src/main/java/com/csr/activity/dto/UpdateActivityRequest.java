package com.csr.activity.dto;

import com.csr.activity.entity.TemplateType;
import jakarta.validation.constraints.Size;

public record UpdateActivityRequest(
    Long eventId,

    @Size(max = 200, message = "活动名称不能超过200字")
    String name,

    TemplateType templateType,
    String description,
    String startTime,
    String endTime,
    Integer maxParticipants,
    String coverImage,
    String status,
    String formSchema
) {}
