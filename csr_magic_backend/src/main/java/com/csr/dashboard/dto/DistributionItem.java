package com.csr.dashboard.dto;

/**
 * 活动类型分布数据项
 */
public record DistributionItem(
    String templateType,
    long count,
    double percentage
) {}
