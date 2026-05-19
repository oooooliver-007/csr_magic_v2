package com.csr.participation.dto;

import com.csr.participation.entity.FamilyRelation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 家属信息 DTO：用于报名时携带家属和审核详情回显
 */
public record FamilyMemberDto(
    @NotBlank(message = "家属姓名不能为空")
    @Size(max = 100, message = "家属姓名不能超过100字")
    String name,

    @NotNull(message = "家属关系不能为空")
    FamilyRelation relation
) {}
