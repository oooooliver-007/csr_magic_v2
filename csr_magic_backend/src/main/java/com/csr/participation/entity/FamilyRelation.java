package com.csr.participation.entity;

/**
 * 家属与员工的亲属关系枚举
 * 用于活动报名时携带家属信息
 */
public enum FamilyRelation {
    /** 配偶 */
    SPOUSE,
    /** 子女 */
    CHILD,
    /** 父母 */
    PARENT,
    /** 其他亲属 */
    OTHER
}
