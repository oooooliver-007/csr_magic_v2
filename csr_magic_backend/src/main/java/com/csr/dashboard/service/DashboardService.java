package com.csr.dashboard.service;

import com.csr.dashboard.dto.DashboardStatsResponse;
import com.csr.dashboard.dto.DistributionItem;
import com.csr.dashboard.dto.TopParticipantItem;
import com.csr.dashboard.dto.TrendItem;

import java.util.List;

/**
 * 数据看板 Service 接口
 */
public interface DashboardService {

    /** 总览统计 */
    DashboardStatsResponse getStats();

    /** 近 12 个月参与趋势 */
    List<TrendItem> getTrends();

    /** 活动类型分布 */
    List<DistributionItem> getDistribution();

    /** 最活跃员工 Top 10 */
    List<TopParticipantItem> getTopParticipants();
}
