import { create } from 'zustand';
import type { User } from '../types/auth';
import { authApi } from '../services/authApi';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

function loadInitialAuth(): Pick<AuthState, 'accessToken' | 'user' | 'isAuthenticated'> {
  try {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    if (accessToken && userStr) {
      const user = JSON.parse(userStr) as User;
      return { accessToken, user, isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { accessToken: null, user: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadInitialAuth(),

  // refreshToken 由 httpOnly Cookie 承载，不再存入 localStorage
  setAuth: (accessToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, user, isAuthenticated: true });
  },

  logout: () => {
    const token = localStorage.getItem('accessToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ accessToken: null, user: null, isAuthenticated: false });
    if (token) {
      authApi.logout(token).catch(() => {
        // 登出 API 失败不阻塞前端登出流程
      });
    }
  },

  loadFromStorage: () => {
    const accessToken = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (accessToken && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ accessToken, user, isAuthenticated: true });
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      }
    }
  },
}));
