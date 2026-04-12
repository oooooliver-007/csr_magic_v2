import apiClient from './apiClient';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
import type { ApiResponse } from '../types/common';

const BASE = '/api/v2/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(`${BASE}/login`, data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<AuthResponse>>(`${BASE}/register`, data),
};
