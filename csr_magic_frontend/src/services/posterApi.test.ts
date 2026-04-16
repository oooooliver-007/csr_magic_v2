import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from './apiClient';
import { posterApi } from './posterApi';

vi.mock('./apiClient');

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

describe('posterApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generate 发送 POST 请求并返回 taskId', async () => {
    mockPost.mockResolvedValue({
      data: { code: 200, message: 'success', data: { taskId: 'task123' } },
    });

    const res = await posterApi.generate({
      activityId: 1,
      style: 'cartoon',
      userPrompt: '阳光植树',
    });

    expect(mockPost).toHaveBeenCalledWith('/api/v2/posters/generate', {
      activityId: 1,
      style: 'cartoon',
      userPrompt: '阳光植树',
    });
    expect(res.data.data.taskId).toBe('task123');
  });

  it('getStatus 发送 GET 请求并返回状态', async () => {
    mockGet.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: { taskId: 'task123', status: 'COMPLETED', posterUrl: '/img.png', errorMessage: null },
      },
    });

    const res = await posterApi.getStatus('task123');

    expect(mockGet).toHaveBeenCalledWith('/api/v2/posters/task123/status');
    expect(res.data.data.status).toBe('COMPLETED');
  });

  it('getMyPosters 发送分页 GET 请求', async () => {
    mockGet.mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 },
      },
    });

    const res = await posterApi.getMyPosters({ page: 0, size: 10 });

    expect(mockGet).toHaveBeenCalledWith('/api/v2/posters/my', { params: { page: 0, size: 10 } });
    expect(res.data.data.content).toEqual([]);
  });
});
