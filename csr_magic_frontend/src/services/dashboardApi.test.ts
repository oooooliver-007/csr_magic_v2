import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dashboardApi } from './dashboardApi';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('dashboardApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getStats 调用 GET /api/v2/dashboard/stats', async () => {
    const mockResponse = { data: { code: 200, data: { totalActivities: 10 } } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await dashboardApi.getStats();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/dashboard/stats');
    expect(result).toEqual(mockResponse);
  });

  it('getTrends 调用 GET /api/v2/dashboard/trends', async () => {
    const mockResponse = { data: { code: 200, data: [{ month: '2026-04', count: 30 }] } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await dashboardApi.getTrends();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/dashboard/trends');
    expect(result).toEqual(mockResponse);
  });

  it('getDistribution 调用 GET /api/v2/dashboard/distribution', async () => {
    const mockResponse = { data: { code: 200, data: [{ templateType: 'VOLUNTEER', count: 6 }] } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await dashboardApi.getDistribution();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/dashboard/distribution');
    expect(result).toEqual(mockResponse);
  });

  it('getTopParticipants 调用 GET /api/v2/dashboard/top-participants', async () => {
    const mockResponse = { data: { code: 200, data: [{ userId: 1, displayName: '张三', count: 15 }] } };
    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const result = await dashboardApi.getTopParticipants();

    expect(apiClient.get).toHaveBeenCalledWith('/api/v2/dashboard/top-participants');
    expect(result).toEqual(mockResponse);
  });
});
