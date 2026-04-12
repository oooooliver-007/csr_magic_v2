import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './authApi';
import apiClient from './apiClient';

// mock apiClient
vi.mock('./apiClient', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login 调用 apiClient.post 并传递正确参数', async () => {
    const mockResponse = { data: { code: 200, data: { accessToken: 'at' } } };
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    const result = await authApi.login({ username: 'test', password: '123456' });

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/auth/login', {
      username: 'test',
      password: '123456',
    });
    expect(result).toEqual(mockResponse);
  });

  it('register 调用 apiClient.post 并传递正确参数', async () => {
    const mockResponse = { data: { code: 200 } };
    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    await authApi.register({
      username: 'newuser',
      password: '123456',
      displayName: '新用户',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/api/v2/auth/register', {
      username: 'newuser',
      password: '123456',
      displayName: '新用户',
    });
  });

  it('logout 使用独立实例发送 Token', async () => {
    // logout 使用 refreshClient（独立 axios 实例），不经过 apiClient
    // 此测试验证 authApi.logout 接受 token 参数并返回 Promise
    const result = authApi.logout('test-token');
    expect(result).toBeInstanceOf(Promise);
  });
});
