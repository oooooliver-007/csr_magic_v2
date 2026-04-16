import apiClient from './apiClient';
import type {
  GeneratePosterRequest,
  GenerateTaskResponse,
  PosterStatusResponse,
  PosterRecord,
} from '../types/poster';
import type { ApiResponse, PageResponse } from '../types/common';

const BASE = '/api/v2/posters';

export const posterApi = {
  /** 提交海报生成任务 */
  generate: (data: GeneratePosterRequest) =>
    apiClient.post<ApiResponse<GenerateTaskResponse>>(`${BASE}/generate`, data),

  /** 查询生成状态 */
  getStatus: (taskId: string) =>
    apiClient.get<ApiResponse<PosterStatusResponse>>(`${BASE}/${taskId}/status`),

  /** 我的海报列表 */
  getMyPosters: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<PosterRecord>>>(`${BASE}/my`, { params }),
};
