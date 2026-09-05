package com.csr.participation.dto;

import jakarta.validation.Valid;

import java.util.List;

/**
 * 驳回后重新提交报名请求体：仅包含报名内容（表单数据 + 家属），
 * 活动与记录 ID 通过路径参数指定。
 */
public record ResubmitRequest(
    String formData,
    @Valid
    List<FamilyMemberDto> familyMembers
) {}