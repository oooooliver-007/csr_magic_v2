import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import type { User } from '../types/auth';

// mock authApi
vi.mock('../services/authApi', () => ({
  authApi: {
    logout: vi.fn((_token: string) => Promise.resolve({ data: { code: 200 } })),
  },
}));

const mockUser: User = {
  id: 1,
  username: 'testuser',
  displayName: '测试用户',
  realName: null,
  gender: null,
  region: null,
  role: 'USER',
  createdAt: '2026-01-01T00:00:00Z',
};

// mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
};

describe('authStore', () => {
  let mockStorage: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    mockStorage = createLocalStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
    // 重置 store 状态
    useAuthStore.setState({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it('setAuth 设置 Token 和用户信息到 state 和 localStorage', () => {
    const { setAuth } = useAuthStore.getState();
    setAuth('at-123', 'rt-456', mockUser);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('at-123');
    expect(state.refreshToken).toBe('rt-456');
    expect(state.user?.username).toBe('testuser');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe('at-123');
    expect(localStorage.getItem('refreshToken')).toBe('rt-456');
  });

  it('logout 清除 state 和 localStorage', () => {
    const { setAuth, logout } = useAuthStore.getState();
    setAuth('at-123', 'rt-456', mockUser);

    logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('loadFromStorage 从 localStorage 恢复状态', () => {
    localStorage.setItem('accessToken', 'at-saved');
    localStorage.setItem('refreshToken', 'rt-saved');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { loadFromStorage } = useAuthStore.getState();
    loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('at-saved');
    expect(state.refreshToken).toBe('rt-saved');
    expect(state.user?.username).toBe('testuser');
    expect(state.isAuthenticated).toBe(true);
  });

  it('loadFromStorage localStorage 为空时不更新状态', () => {
    const { loadFromStorage } = useAuthStore.getState();
    loadFromStorage();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });

  it('loadFromStorage localStorage 中 user JSON 损坏时清除数据', () => {
    localStorage.setItem('accessToken', 'at-saved');
    localStorage.setItem('user', 'invalid-json');

    const { loadFromStorage } = useAuthStore.getState();
    loadFromStorage();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
