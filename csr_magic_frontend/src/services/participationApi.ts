import apiClient from './apiClient';
import type {
  Participation,
  SignupRequest,
  ResubmitRequest,
  MyParticipation,
  ReviewRequest,
  ParticipationListParams,
} from '../types/participation';
import type { ApiResponse, PageResponse } from '../types/common';

const BASE = '/api/v2/participations';

export const participationApi = {
  signup: (data: SignupRequest) =>
    apiClient.post<ApiResponse<Participation>>(`${BASE}/signup`, data),

  withdraw: (id: number) =>
    apiClient.post<ApiResponse<void>>(`${BASE}/${id}/withdraw`),

  /** 驳回后重新提交报名（REJECTED → RE_SUBMITTED） */
  resubmit: (id: number, data: ResubmitRequest) =>
    apiClient.patch<ApiResponse<Participation>>(`${BASE}/${id}/resubmit`, data),

  getMyParticipations: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<MyParticipation>>>(`${BASE}/my`, { params }),

  /** 管理端参与列表（分页+筛选） */
  list: (params: ParticipationListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<Participation>>>(BASE, { params }),

  /** 管理端审核待办（PENDING + RE_SUBMITTED 状态的分页列表） */
  getReviewTodos: (params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<Participation>>>(`${BASE}/review-todos`, { params }),

  /** 审核参与记录（通过/驳回） */
  review: (id: number, data: ReviewRequest) =>
    apiClient.patch<ApiResponse<Participation>>(`${BASE}/${id}/review`, data),
};
