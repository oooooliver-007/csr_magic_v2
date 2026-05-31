import { describe, it, expect, vi, beforeEach } from 'vitest';
import { notificationApi } from './notificationApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('notificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyNotifications 调用 GET /api/v2/notifications/my 并传递分页参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0, totalPages: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await notificationApi.getMyNotifications({ page: 0, size: 5 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/notifications/my', {
      params: { page: 0, size: 5 },
    });
    expect(result).toEqual(mockResponse);
  });

  it('getUnreadCount 调用 GET /api/v2/notifications/unread-count', async () => {
    const mockResponse = { data: { code: 200, data: { count: 3 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await notificationApi.getUnreadCount();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/notifications/unread-count');
    expect(result).toEqual(mockResponse);
  });

  it('markAsRead 调用 PATCH /api/v2/notifications/:id/read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { code: 200 } });

    await notificationApi.markAsRead(8);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v2/notifications/8/read');
  });

  it('markAllAsRead 调用 PATCH /api/v2/notifications/read-all', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { code: 200 } });

    await notificationApi.markAllAsRead();

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v2/notifications/read-all');
  });

  it('getAdminNotifications 调用 GET /api/v2/notifications/admin 并传递分页参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0, totalPages: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await notificationApi.getAdminNotifications({ page: 0, size: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/notifications/admin', {
      params: { page: 0, size: 10 },
    });
    expect(result).toEqual(mockResponse);
  });

  it('getAdminUnreadCount 调用 GET /api/v2/notifications/admin/unread-count', async () => {
    const mockResponse = { data: { code: 200, data: { count: 9 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await notificationApi.getAdminUnreadCount();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/notifications/admin/unread-count');
    expect(result).toEqual(mockResponse);
  });

  it('markAdminAsRead 调用 PATCH /api/v2/notifications/admin/:id/read', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { code: 200 } });

    await notificationApi.markAdminAsRead(10);

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v2/notifications/admin/10/read');
  });

  it('markAllAdminAsRead 调用 PATCH /api/v2/notifications/admin/read-all', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { code: 200 } });

    await notificationApi.markAllAdminAsRead();

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v2/notifications/admin/read-all');
  });
});
