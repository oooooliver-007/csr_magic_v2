import { create } from 'zustand';
import type { User } from '../types/auth';
import { authApi } from '../services/authApi';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

function loadInitialAuth(): Pick<AuthState, 'accessToken' | 'refreshToken' | 'user' | 'isAuthenticated'> {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');
    if (accessToken && userStr) {
      const user = JSON.parse(userStr) as User;
      return { accessToken, refreshToken, user, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { accessToken: null, refreshToken: null, user: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitialAuth(),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  logout: () => {
    // 先取 token，再清 localStorage，最后通知后端使 Token 失效
    const token = localStorage.getItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
    if (token) {
      authApi.logout(token).catch(() => {
        // 登出 API 失败不阻塞前端登出流程
      });
    }
  },

  loadFromStorage: () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ accessToken, refreshToken, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }
  },
}));
