package com.csr.participation.entity;

/**
 * 参与状态枚举
 */
public enum ParticipationState {
    /** 待审核 */
    PENDING,
    /** 已通过 */
    APPROVED,
    /** 已驳回 */
    REJECTED,
    /** 修改后重新提交 */
    RE_SUBMITTED
}
