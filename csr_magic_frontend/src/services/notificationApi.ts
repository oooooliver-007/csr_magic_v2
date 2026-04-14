import apiClient from './apiClient';
import type { ApiResponse, PageResponse } from '../types/common';
import type { NotificationItem, NotificationListParams, UnreadCount } from '../types/notification';

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
};
