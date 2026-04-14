import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participationApi } from './participationApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('participationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signup 调用 POST /api/v2/participations/signup', async () => {
    const mockResponse = { data: { code: 200, data: { id: 1 } } };
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    const result = await participationApi.signup({ activityId: 1, formData: '{}' });

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/participations/signup', {
      activityId: 1,
      formData: '{}',
    });
    expect(result).toEqual(mockResponse);
  });

  it('withdraw 调用 POST /api/v2/participations/:id/withdraw', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({ data: { code: 200 } });

    await participationApi.withdraw(5);

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/participations/5/withdraw');
  });

  it('getMyParticipations 调用 GET /api/v2/participations/my 并传递分页参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0, totalPages: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await participationApi.getMyParticipations({ page: 0, size: 10 });

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/participations/my', {
      params: { page: 0, size: 10 },
    });
    expect(result).toEqual(mockResponse);
  });

  it('getMyParticipations 无参数时使用默认值', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: {} });

    await participationApi.getMyParticipations();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/participations/my', {
      params: {},
    });
  });

  it('list 调用 GET /api/v2/participations 并传递筛选参数', async () => {
    const mockResponse = { data: { code: 200, data: { content: [], totalElements: 0, totalPages: 0 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const params = {
      page: 1,
      size: 20,
      eventId: 2,
      activityId: 3,
      userId: 4,
      state: 'PENDING' as const,
      keyword: '张三',
      createdFrom: '2026-01-01T00:00:00Z',
      createdTo: '2026-01-31T23:59:59.999Z',
    };

    const result = await participationApi.list(params);

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/participations', {
      params,
    });
    expect(result).toEqual(mockResponse);
  });

  it('review 调用 PATCH /api/v2/participations/:id/review', async () => {
    const mockResponse = { data: { code: 200, data: { id: 8, state: 'APPROVED' } } };
    vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

    const result = await participationApi.review(8, { action: 'APPROVE' });

    expect(apiClient.patch).toHaveBeenCalledWith('/api/v2/participations/8/review', {
      action: 'APPROVE',
    });
    expect(result).toEqual(mockResponse);
  });
});
