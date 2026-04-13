import apiClient from './apiClient';
import type { Participation, SignupRequest } from '../types/participation';
import type { ApiResponse } from '../types/common';

const BASE = '/api/v2/participations';

export const participationApi = {
  signup: (data: SignupRequest) =>
    apiClient.post<ApiResponse<Participation>>(`${BASE}/signup`, data),

  withdraw: (id: number) =>
    apiClient.post<ApiResponse<void>>(`${BASE}/${id}/withdraw`),
};
