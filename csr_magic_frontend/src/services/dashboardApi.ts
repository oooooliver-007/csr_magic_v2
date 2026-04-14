import apiClient from './apiClient';
import type { DashboardStats, TrendItem, DistributionItem, TopParticipantItem } from '../types/dashboard';
import type { ApiResponse } from '../types/common';

const BASE = '/api/v2/dashboard';

export const dashboardApi = {
  /** 总览统计 */
  getStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>(`${BASE}/stats`),

  /** 参与趋势（近12个月） */
  getTrends: () =>
    apiClient.get<ApiResponse<TrendItem[]>>(`${BASE}/trends`),

  /** 活动类型分布 */
  getDistribution: () =>
    apiClient.get<ApiResponse<DistributionItem[]>>(`${BASE}/distribution`),

  /** 最活跃员工 Top 10 */
  getTopParticipants: () =>
    apiClient.get<ApiResponse<TopParticipantItem[]>>(`${BASE}/top-participants`),
};
