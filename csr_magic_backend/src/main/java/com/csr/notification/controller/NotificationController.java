package com.csr.notification.controller;

import com.csr.common.ApiResponse;
import com.csr.notification.dto.NotificationResponse;
import com.csr.notification.dto.UnreadCountResponse;
import com.csr.notification.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/my")
    public ApiResponse<Page<NotificationResponse>> getMyNotifications(Pageable pageable) {
        return ApiResponse.success(notificationService.getMyNotifications(getCurrentUserId(), pageable));
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> getUnreadCount() {
        return ApiResponse.success(new UnreadCountResponse(notificationService.getUnreadCount(getCurrentUserId())));
    }

    @PatchMapping("/{id}/read")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(getCurrentUserId(), id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/read-all")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUserId());
        return ApiResponse.success(null);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Page<NotificationResponse>> getAdminNotifications(Pageable pageable) {
        return ApiResponse.success(notificationService.getAdminNotifications(pageable));
    }

    @GetMapping("/admin/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UnreadCountResponse> getAdminUnreadCount() {
        return ApiResponse.success(new UnreadCountResponse(notificationService.getAdminUnreadCount()));
    }

    @PatchMapping("/admin/{id}/read")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> markAdminAsRead(@PathVariable Long id) {
        notificationService.markAdminNotificationAsRead(id);
        return ApiResponse.success(null);
    }

    @PatchMapping("/admin/read-all")
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> markAllAdminAsRead() {
        notificationService.markAllAdminNotificationsAsRead();
        return ApiResponse.success(null);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return (Long) authentication.getPrincipal();
    }
}
