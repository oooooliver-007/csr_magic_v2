package com.csr.activity.dto;

import com.csr.activity.entity.TemplateType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateActivityRequest(
    @NotNull(message = "所属事件不能为空")
    Long eventId,

    @NotBlank(message = "活动名称不能为空")
    @Size(max = 200, message = "活动名称不能超过200字")
    String name,

    @NotNull(message = "活动模板类型不能为空")
    TemplateType templateType,

    String description,
    String startTime,
    String endTime,
    Integer maxParticipants,
    String coverImage,
    String status,
    String formSchema,
    Boolean allowFamily,
    Integer maxFamilyPerUser
) {
    public CreateActivityRequest(Long eventId,
                                 String name,
                                 TemplateType templateType,
                                 String description,
                                 String startTime,
                                 String endTime,
                                 Integer maxParticipants,
                                 String coverImage,
                                 String status,
                                 String formSchema) {
        this(eventId, name, templateType, description, startTime, endTime, maxParticipants, coverImage, status, formSchema, null, null);
    }
}
