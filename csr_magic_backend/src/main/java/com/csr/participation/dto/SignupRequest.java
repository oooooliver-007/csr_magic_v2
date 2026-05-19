package com.csr.participation.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record SignupRequest(
    @NotNull(message = "活动 ID 不能为空")
    Long activityId,
    String formData,
    @Valid
    List<FamilyMemberDto> familyMembers
) {
    public SignupRequest(Long activityId, String formData) {
        this(activityId, formData, null);
    }
}
