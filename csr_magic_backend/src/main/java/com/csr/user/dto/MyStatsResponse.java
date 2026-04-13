package com.csr.user.dto;

/**
 * 我的贡献统计响应
 */
public record MyStatsResponse(
    long activityCount,
    double volunteerHours,
    double totalDonation
) {
}
