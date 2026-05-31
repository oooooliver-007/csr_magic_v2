package com.csr.notification.dto;

import com.csr.notification.entity.Notification;

public record NotificationResponse(
    Long id,
    Long userId,
    String username,
    String displayName,
    String type,
    String title,
    String content,
    Boolean isRead,
    String createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getUser().getId(),
            notification.getUser().getUsername(),
            notification.getUser().getDisplayName(),
            notification.getType(),
            notification.getTitle(),
            notification.getContent(),
            notification.getIsRead(),
            notification.getCreatedAt().toString()
        );
    }
}
