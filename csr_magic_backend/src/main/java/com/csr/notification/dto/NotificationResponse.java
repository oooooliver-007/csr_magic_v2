package com.csr.notification.dto;

import com.csr.notification.entity.Notification;

public record NotificationResponse(
    Long id,
    String type,
    String title,
    String content,
    Boolean isRead,
    String createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
            notification.getId(),
            notification.getType(),
            notification.getTitle(),
            notification.getContent(),
            notification.getIsRead(),
            notification.getCreatedAt().toString()
        );
    }
}
