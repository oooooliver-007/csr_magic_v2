import apiClient from './apiClient';
import type { Activity, CreateActivityRequest, UpdateActivityRequest, ActivityListParams } from '../types/activity';
import type { ApiResponse, PageResponse } from '../types/common';

const BASE = '/api/v2/activities';

export const activityApi = {
  list: (params: ActivityListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<Activity>>>(BASE, { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Activity>>(`${BASE}/${id}`),

  create: (data: CreateActivityRequest) =>
    apiClient.post<ApiResponse<Activity>>(BASE, data),

  update: (id: number, data: UpdateActivityRequest) =>
    apiClient.put<ApiResponse<Activity>>(`${BASE}/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`),
};
