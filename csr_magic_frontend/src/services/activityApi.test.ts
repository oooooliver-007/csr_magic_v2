import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityApi } from './activityApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('activityApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list 调用 GET /api/v2/activities 并传递筛选参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await activityApi.list({ page: 0, size: 20, eventId: 1, status: 'UPCOMING', keyword: '植树' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/activities', {
      params: { page: 0, size: 20, eventId: 1, status: 'UPCOMING', keyword: '植树' },
    });
    expect(result).toEqual(mockResponse);
  });

  it('list 无参数时使用默认值', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    await activityApi.list();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/activities', { params: {} });
  });

  it('getById 调用 GET /api/v2/activities/:id', async () => {
    const mockResponse = { data: { code: 200, data: { id: 1, name: '植树活动' } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await activityApi.getById(1);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/activities/1');
    expect(result).toEqual(mockResponse);
  });

  it('create 调用 POST /api/v2/activities 并传递请求体', async () => {
    const body = { eventId: 1, name: '新活动', templateType: 'VOLUNTEER' as const };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { code: 200 } });

    await activityApi.create(body);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/activities', body);
  });

  it('update 调用 PUT /api/v2/activities/:id 并传递请求体', async () => {
    const body = { name: '更新后的活动', status: 'ONGOING' as const };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { code: 200 } });

    await activityApi.update(1, body);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v2/activities/1', body);
  });

  it('delete 调用 DELETE /api/v2/activities/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { code: 200 } });

    await activityApi.delete(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v2/activities/1');
  });
});
