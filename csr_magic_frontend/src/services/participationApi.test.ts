import { describe, it, expect, vi, beforeEach } from 'vitest';
import { participationApi } from './participationApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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
});
