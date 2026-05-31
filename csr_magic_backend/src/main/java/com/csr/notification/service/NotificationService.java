package com.csr.notification.service;

import com.csr.auth.entity.User;
import com.csr.notification.dto.NotificationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    Page<NotificationResponse> getMyNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);

    void createNotification(Long userId, String type, String title, String content);

    void send(User targetUser, String type, String title, String content);

    Page<NotificationResponse> getAdminNotifications(Pageable pageable);

    long getAdminUnreadCount();

    void markAdminNotificationAsRead(Long notificationId);

    void markAllAdminNotificationsAsRead();
}
