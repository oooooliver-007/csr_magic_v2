import apiClient from './apiClient';
import type { UserInfo, UserDetail, UpdateUserRequest, ResetPasswordRequest, UserListParams, UpdateMeRequest, ChangePasswordRequest, MyStatsResponse } from '../types/user';
import type { PageResponse, ApiResponse } from '../types/common';

const BASE = '/api/v2/users';

export const userApi = {
  // ===== /me 端点（当前登录用户） =====

  getMe: () =>
    apiClient.get<ApiResponse<UserInfo>>(`${BASE}/me`),

  updateMe: (data: UpdateMeRequest) =>
    apiClient.put<ApiResponse<UserInfo>>(`${BASE}/me`, data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.put<ApiResponse<void>>(`${BASE}/me/password`, data),

  getMyStats: () =>
    apiClient.get<ApiResponse<MyStatsResponse>>(`${BASE}/me/stats`),

  // ===== 管理端端点 =====

  list: (params: UserListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<UserInfo>>>(BASE, { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<UserDetail>>(`${BASE}/${id}`),

  update: (id: number, data: UpdateUserRequest) =>
    apiClient.put<ApiResponse<UserInfo>>(`${BASE}/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`),

  resetPassword: (id: number, data: ResetPasswordRequest) =>
    apiClient.put<ApiResponse<void>>(`${BASE}/${id}/reset-password`, data),
};
