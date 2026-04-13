package com.csr.activity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest(
    @NotNull(message = "所属事件不能为空")
    Long eventId,

    @NotBlank(message = "活动名称不能为空")
    @Size(max = 200, message = "活动名称不能超过200字")
    String name,

    @NotBlank(message = "活动模板类型不能为空")
    String templateType,

    String description,
    String startTime,
    String endTime,
    Integer maxParticipants,
    String coverImage,
    String status
) {}
