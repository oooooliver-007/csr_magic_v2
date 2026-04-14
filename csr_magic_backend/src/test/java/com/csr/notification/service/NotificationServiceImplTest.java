package com.csr.notification.service;

import com.csr.auth.entity.User;
import com.csr.auth.repository.UserRepository;
import com.csr.common.BusinessException;
import com.csr.notification.dto.NotificationResponse;
import com.csr.notification.entity.Notification;
import com.csr.notification.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setDisplayName("测试用户");

        testNotification = new Notification();
        testNotification.setId(10L);
        testNotification.setUser(testUser);
        testNotification.setType("SIGNUP_SUCCESS");
        testNotification.setTitle("报名提交成功");
        testNotification.setContent("您已成功提交报名申请");
        testNotification.setIsRead(false);
        ReflectionTestUtils.setField(testNotification, "createdAt", Instant.parse("2026-04-14T12:00:00Z"));
    }

    @Test
    @DisplayName("获取我的通知：按分页返回通知响应")
    void getMyNotifications_success() {
        Pageable pageable = PageRequest.of(0, 5);
        Page<Notification> page = new PageImpl<>(List.of(testNotification), pageable, 1);
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(page);

        Page<NotificationResponse> result = notificationService.getMyNotifications(1L, pageable);

        assertEquals(1, result.getTotalElements());
        assertEquals("报名提交成功", result.getContent().get(0).title());
        assertEquals("2026-04-14T12:00:00Z", result.getContent().get(0).createdAt());
    }

    @Test
    @DisplayName("获取未读数：返回仓储统计结果")
    void getUnreadCount_success() {
        when(notificationRepository.countByUserIdAndIsReadFalse(1L)).thenReturn(3L);

        long result = notificationService.getUnreadCount(1L);

        assertEquals(3L, result);
    }

    @Test
    @DisplayName("标记已读：成功更新未读通知")
    void markAsRead_success() {
        when(notificationRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testNotification));

        notificationService.markAsRead(1L, 10L);

        assertTrue(testNotification.getIsRead());
        verify(notificationRepository).save(testNotification);
    }

    @Test
    @DisplayName("标记已读：已读通知不重复保存")
    void markAsRead_alreadyRead() {
        testNotification.setIsRead(true);
        when(notificationRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(testNotification));

        notificationService.markAsRead(1L, 10L);

        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    @DisplayName("标记已读：通知不存在时抛出 404")
    void markAsRead_notFound() {
        when(notificationRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> notificationService.markAsRead(1L, 999L));

        assertEquals(404, ex.getCode());
        assertEquals("通知不存在", ex.getMessage());
    }

    @Test
    @DisplayName("全部标记已读：调用仓储批量更新")
    void markAllAsRead_success() {
        notificationService.markAllAsRead(1L);

        verify(notificationRepository).markAllAsReadByUserId(1L);
    }

    @Test
    @DisplayName("创建通知：根据 userId 创建并保存通知")
    void createNotification_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        notificationService.createNotification(1L, "REVIEW_APPROVED", "报名审核通过", "审核已通过");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        Notification saved = captor.getValue();
        assertEquals(testUser, saved.getUser());
        assertEquals("REVIEW_APPROVED", saved.getType());
        assertEquals("报名审核通过", saved.getTitle());
        assertEquals("审核已通过", saved.getContent());
    }

    @Test
    @DisplayName("创建通知：用户不存在时抛出 404")
    void createNotification_userNotFound() {
        when(userRepository.findById(eq(999L))).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
            () -> notificationService.createNotification(999L, "SIGNUP_SUCCESS", "标题", "内容"));

        assertEquals(404, ex.getCode());
        assertEquals("用户不存在", ex.getMessage());
    }
}
