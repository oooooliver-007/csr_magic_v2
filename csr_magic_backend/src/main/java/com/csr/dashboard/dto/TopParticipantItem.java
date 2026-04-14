package com.csr.dashboard.dto;

/**
 * 最活跃员工 Top N 数据项
 */
public record TopParticipantItem(
    Long userId,
    String displayName,
    long count
) {}
