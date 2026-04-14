/** 总览统计 */
export interface DashboardStats {
  totalActivities: number;
  totalParticipations: number;
  totalDonation: number;
  monthlyNew: number;
}

/** 月度参与趋势 */
export interface TrendItem {
  month: string;
  count: number;
}

/** 活动类型分布 */
export interface DistributionItem {
  templateType: string;
  count: number;
  percentage: number;
}

/** 最活跃员工 Top N */
export interface TopParticipantItem {
  userId: number;
  displayName: string;
  count: number;
}
