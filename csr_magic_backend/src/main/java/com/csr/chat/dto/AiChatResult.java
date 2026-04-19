package com.csr.chat.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

/**
 * csr_ai_service `data` 部分的强类型映射，避免散落 `Map<String, Object>` + 抑制未检查警告。
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiChatResult(
    @JsonProperty("session_id") String sessionId,
    String reply,
    String status,
    @JsonProperty("collected_fields") Map<String, Object> collectedFields,
    @JsonProperty("is_complete") Boolean isComplete,
    List<AiChatMessage> messages
) {
    public Map<String, Object> safeCollectedFields() {
        return collectedFields == null ? Map.of() : collectedFields;
    }

    public boolean safeIsComplete() {
        return Boolean.TRUE.equals(isComplete);
    }

    public List<AiChatMessage> safeMessages() {
        return messages == null ? List.of() : messages;
    }

    public String safeReply() {
        return reply == null ? "" : reply;
    }

    public String safeStatus() {
        return status == null ? "COLLECTING" : status;
    }

    public record AiChatMessage(String role, String content) {}
}
