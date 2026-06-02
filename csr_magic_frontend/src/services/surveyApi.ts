import apiClient from './apiClient';
import type { ApiResponse, PageResponse } from '../types/common';
import type {
  Survey, AiGeneratedSurvey, GenerateSurveyRequest, CreateSurveyRequest,
  UpdateSurveyRequest, SubmitSurveyRequest, SurveyResult, SurveyStats, SurveyListParams, QuestionStats,
} from '../types/survey';

const BASE = '/api/v2/surveys';

export const surveyApi = {
  generateWithAi: (data: GenerateSurveyRequest) =>
    apiClient.post<ApiResponse<AiGeneratedSurvey>>(`${BASE}/generate`, data),

  create: (data: CreateSurveyRequest) =>
    apiClient.post<ApiResponse<Survey>>(BASE, data),

  update: (id: number, data: UpdateSurveyRequest) =>
    apiClient.put<ApiResponse<Survey>>(`${BASE}/${id}`, data),

  updateStatus: (id: number, status: string) =>
    apiClient.patch<ApiResponse<Survey>>(`${BASE}/${id}/status`, { status }),

  list: (params: SurveyListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<Survey>>>(BASE, { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Survey>>(`${BASE}/${id}`),

  getByActivityId: (activityId: number) =>
    apiClient.get<ApiResponse<Survey>>(`${BASE}/by-activity/${activityId}`),

  getQuestionStats: (surveyId: number) =>
    apiClient.get<ApiResponse<QuestionStats[]>>(`${BASE}/${surveyId}/question-stats`),

  publish: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/${id}/publish`),

  close: (id: number) =>
    apiClient.patch<ApiResponse<void>>(`${BASE}/${id}/close`),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`),

  submit: (data: SubmitSurveyRequest) =>
    apiClient.post<ApiResponse<void>>(`${BASE}/submit`, data),

  hasUserSubmitted: (surveyId: number) =>
    apiClient.get<ApiResponse<boolean>>(`${BASE}/${surveyId}/submitted`),

  getResults: (surveyId: number, params: { page?: number; size?: number } = {}) =>
    apiClient.get<ApiResponse<PageResponse<SurveyResult>>>(`${BASE}/${surveyId}/results`, { params }),

  getStats: (surveyId: number) =>
    apiClient.get<ApiResponse<SurveyStats>>(`${BASE}/${surveyId}/stats`),
};
