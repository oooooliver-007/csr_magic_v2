import apiClient from './apiClient';
import type { Participation, SignupRequest, MyParticipation } from '../types/participation';
import type { ApiResponse, PageResponse } from '../types/common';

const BASE = '/api/v2/participations';

export const participationApi = {
  signup: (data: SignupRequest) =>
    apiClient.post<ApiResponse<Participation>>(`${BASE}/signup`, data),

  withdraw: (id: number) =>
    apiClient.post<ApiResponse<void>>(`${BASE}/${id}/withdraw`),

  getMyParticipations: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<MyParticipation>>>(`${BASE}/my`, { params }),
};
