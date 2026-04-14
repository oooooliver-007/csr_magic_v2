package com.csr.notification.service;

import com.csr.auth.entity.User;
import com.csr.notification.entity.Notification;
import com.csr.notification.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 通知服务（最小化实现 — 供 participation 审核集成使用）
 * 完整的通知模块将在 notification 功能中扩展
 */
@Service
@Transactional(readOnly = true)
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    /**
     * 发送站内通知
     */
    @Transactional
    public void send(User targetUser, String type, String title, String content) {
        Notification notification = new Notification();
        notification.setUser(targetUser);
        notification.setType(type);
        notification.setTitle(title);
        notification.setContent(content);
        notificationRepository.save(notification);
        log.info("发送通知给用户 {}：[{}] {}", targetUser.getId(), type, title);
    }
}
