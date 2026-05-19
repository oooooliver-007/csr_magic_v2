package com.csr.participation.dto;

import com.csr.common.BusinessException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

public final class FamilyMemberJson {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<FamilyMemberDto>> TYPE = new TypeReference<>() {};

    private FamilyMemberJson() {
    }

    public static List<FamilyMemberDto> parse(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return MAPPER.readValue(json, TYPE);
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    public static String stringify(List<FamilyMemberDto> familyMembers) {
        if (familyMembers == null || familyMembers.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(familyMembers);
        } catch (JsonProcessingException e) {
            throw new BusinessException(400, "家属信息格式错误");
        }
    }
}
