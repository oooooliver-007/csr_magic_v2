import axios from 'axios';
import apiClient from './apiClient';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import type { ApiResponse } from '../types/common';

const BASE = '/api/v2/auth';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 独立 axios 实例用于 refresh，避免响应拦截器循环
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(`${BASE}/login`, data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(`${BASE}/register`, data),

  refresh: (refreshToken: string) =>
    refreshClient.post<ApiResponse<{ accessToken: string }>>(`${BASE}/refresh`, null, {
      headers: { 'X-Refresh-Token': refreshToken },
    }),

  logout: (token: string) =>
    refreshClient.post<ApiResponse<{ message: string }>>(`${BASE}/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
