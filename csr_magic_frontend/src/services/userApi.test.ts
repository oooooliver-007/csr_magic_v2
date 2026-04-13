import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userApi } from './userApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('userApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list 调用 GET /api/v2/users 并传递分页和筛选参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await userApi.list({ page: 0, size: 20, keyword: '张三', region: '北京' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/users', {
      params: { page: 0, size: 20, keyword: '张三', region: '北京' },
    });
    expect(result).toEqual(mockResponse);
  });

  it('list 无参数时使用默认值', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    await userApi.list();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/users', { params: {} });
  });

  it('getById 调用 GET /api/v2/users/:id', async () => {
    const mockResponse = { data: { code: 200, data: { id: 1, username: 'testuser' } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await userApi.getById(1);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/users/1');
    expect(result).toEqual(mockResponse);
  });

  it('update 调用 PUT /api/v2/users/:id 并传递请求体', async () => {
    const body = { displayName: '新昵称' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { code: 200 } });

    await userApi.update(1, body);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v2/users/1', body);
  });

  it('delete 调用 DELETE /api/v2/users/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { code: 200 } });

    await userApi.delete(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v2/users/1');
  });

  it('resetPassword 调用 PUT /api/v2/users/:id/reset-password', async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ data: { code: 200 } });

    await userApi.resetPassword(1, { newPassword: 'newpass123' });

    expect(apiClient.put).toHaveBeenCalledWith('/api/v2/users/1/reset-password', {
      newPassword: 'newpass123',
    });
  });

  it('getMyStats 调用 GET /api/v2/users/me/stats', async () => {
    const mockResponse = { data: { code: 200, data: { activityCount: 5, volunteerHours: 24.5, totalDonation: 350 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await userApi.getMyStats();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/users/me/stats');
    expect(result).toEqual(mockResponse);
  });
});
