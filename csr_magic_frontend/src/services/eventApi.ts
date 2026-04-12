import apiClient from './apiClient';
import type { Event, CreateEventRequest, UpdateEventRequest, EventListParams } from '../types/event';
import type { ApiResponse, PageResponse } from '../types/common';

const BASE = '/api/v2/events';

export const eventApi = {
  list: (params: EventListParams = {}) =>
    apiClient.get<ApiResponse<PageResponse<Event>>>(BASE, { params }),

  getById: (id: number) =>
    apiClient.get<ApiResponse<Event>>(`${BASE}/${id}`),

  create: (data: CreateEventRequest) =>
    apiClient.post<ApiResponse<Event>>(BASE, data),

  update: (id: number, data: UpdateEventRequest) =>
    apiClient.put<ApiResponse<Event>>(`${BASE}/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiResponse<void>>(`${BASE}/${id}`),
};
