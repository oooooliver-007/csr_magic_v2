package com.csr.dashboard.dto;

/**
 * 月度参与趋势数据项
 */
public record TrendItem(
    String month,
    long count
) {}
