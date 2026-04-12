import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventApi } from './eventApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('eventApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('list 调用 GET /api/v2/events 并传递分页参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await eventApi.list({ page: 0, size: 20, keyword: '春季' });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/events', {
      params: { page: 0, size: 20, keyword: '春季' },
    });
    expect(result).toEqual(mockResponse);
  });

  it('list 无参数时使用默认值', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    await eventApi.list();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/events', { params: {} });
  });

  it('getById 调用 GET /api/v2/events/:id', async () => {
    const mockResponse = { data: { code: 200, data: { id: 1, name: '测试事件' } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await eventApi.getById(1);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/events/1');
    expect(result).toEqual(mockResponse);
  });

  it('create 调用 POST /api/v2/events 并传递请求体', async () => {
    const body = { name: '新事件', type: 'OFFLINE' as const };
    vi.mocked(apiClient.post).mockResolvedValue({ data: { code: 200 } });

    await eventApi.create(body);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/events', body);
  });

  it('update 调用 PUT /api/v2/events/:id 并传递请求体', async () => {
    const body = { name: '更新后' };
    vi.mocked(apiClient.put).mockResolvedValue({ data: { code: 200 } });

    await eventApi.update(1, body);

    expect(apiClient.put).toHaveBeenCalledWith('/api/v2/events/1', body);
  });

  it('delete 调用 DELETE /api/v2/events/:id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: { code: 200 } });

    await eventApi.delete(1);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v2/events/1');
  });
});
