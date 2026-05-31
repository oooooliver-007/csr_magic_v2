import apiClient from './apiClient';
import type { ApiResponse, PageResponse } from '../types/common';
import type { AdminNotificationItem, NotificationItem, NotificationListParams, UnreadCount } from '../types/notification';

const BASE = '/api/v2/notifications';

export const notificationApi = {
  getMyNotifications: (params: NotificationListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<NotificationItem>>>(`${BASE}/my`, { params }),

  getUnreadCount: () =>
    apiClient.get<ApiResponse<UnreadCount>>(`${BASE}/unread-count`),

  markAsRead: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/${id}/read`),

  markAllAsRead: () =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/read-all`),

  getAdminNotifications: (params: NotificationListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<AdminNotificationItem>>>(`${BASE}/admin`, { params }),

  getAdminUnreadCount: () =>
    apiClient.get<ApiResponse<UnreadCount>>(`${BASE}/admin/unread-count`),

  markAdminAsRead: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/admin/${id}/read`),

  markAllAdminAsRead: () =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/admin/read-all`),
};
