package com.csr.notification.controller;

import com.csr.auth.repository.TokenBlacklistRepository;
import com.csr.common.GlobalExceptionHandler;
import com.csr.common.JwtAuthFilter;
import com.csr.common.JwtUtil;
import com.csr.notification.dto.NotificationResponse;
import com.csr.notification.service.NotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NotificationService notificationService;

    @MockitoBean
    private JwtUtil jwtUtil;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private TokenBlacklistRepository tokenBlacklistRepository;

    private UsernamePasswordAuthenticationToken userAuthentication() {
        return new UsernamePasswordAuthenticationToken(
            1L,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /notifications/my 返回当前用户通知分页")
    void getMyNotifications_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        NotificationResponse notification = new NotificationResponse(
            10L,
            1L,
            "testuser",
            "测试用户",
            "SIGNUP_SUCCESS",
            "报名提交成功",
            "您已成功提交报名申请",
            false,
            "2026-04-14T12:00:00Z"
        );
        Page<NotificationResponse> page = new PageImpl<>(List.of(notification));
        when(notificationService.getMyNotifications(eq(1L), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/notifications/my")
                .param("page", "0")
                .param("size", "5"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.content[0].title").value("报名提交成功"));
    }

    @Test
    @DisplayName("GET /notifications/unread-count 返回未读数")
    void getUnreadCount_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        when(notificationService.getUnreadCount(1L)).thenReturn(7L);

        mockMvc.perform(get("/api/v2/notifications/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.count").value(7));
    }

    @Test
    @DisplayName("PATCH /notifications/{id}/read 标记已读成功")
    void markAsRead_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        doNothing().when(notificationService).markAsRead(1L, 10L);

        mockMvc.perform(patch("/api/v2/notifications/10/read"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(notificationService).markAsRead(1L, 10L);
    }

    @Test
    @DisplayName("PATCH /notifications/read-all 全部标记已读成功")
    void markAllAsRead_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(userAuthentication());
        doNothing().when(notificationService).markAllAsRead(1L);

        mockMvc.perform(patch("/api/v2/notifications/read-all"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(notificationService).markAllAsRead(1L);
    }

    private UsernamePasswordAuthenticationToken adminAuthentication() {
        return new UsernamePasswordAuthenticationToken(
            1L,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
    }

    @Test
    @DisplayName("GET /notifications/admin 返回全局通知分页")
    void getAdminNotifications_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        NotificationResponse notification = new NotificationResponse(
            10L, 2L, "lisi", "李四", "SIGNUP_SUCCESS", "报名提交成功",
            "您已成功提交报名申请", false, "2026-04-14T12:00:00Z"
        );
        Page<NotificationResponse> page = new PageImpl<>(List.of(notification));
        when(notificationService.getAdminNotifications(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v2/notifications/admin")
                .param("page", "0").param("size", "10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200))
            .andExpect(jsonPath("$.data.content[0].userId").value(2))
            .andExpect(jsonPath("$.data.content[0].username").value("lisi"));
    }

    @Test
    @DisplayName("GET /notifications/admin/unread-count 返回全局未读数")
    void getAdminUnreadCount_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        when(notificationService.getAdminUnreadCount()).thenReturn(5L);

        mockMvc.perform(get("/api/v2/notifications/admin/unread-count"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.data.count").value(5));
    }

    @Test
    @DisplayName("PATCH /notifications/admin/{id}/read 标记员工通知已读")
    void markAdminAsRead_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        doNothing().when(notificationService).markAdminNotificationAsRead(10L);

        mockMvc.perform(patch("/api/v2/notifications/admin/10/read"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(notificationService).markAdminNotificationAsRead(10L);
    }

    @Test
    @DisplayName("PATCH /notifications/admin/read-all 全部员工通知标记已读")
    void markAllAdminAsRead_success() throws Exception {
        SecurityContextHolder.getContext().setAuthentication(adminAuthentication());
        doNothing().when(notificationService).markAllAdminNotificationsAsRead();

        mockMvc.perform(patch("/api/v2/notifications/admin/read-all"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(200));

        verify(notificationService).markAllAdminNotificationsAsRead();
    }
}
