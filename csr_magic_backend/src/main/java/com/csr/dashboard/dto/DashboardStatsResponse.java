package com.csr.dashboard.dto;

/**
 * 看板总览统计响应
 */
public record DashboardStatsResponse(
    long totalActivities,
    long totalParticipations,
    double totalDonation,
    long monthlyNew
) {}
