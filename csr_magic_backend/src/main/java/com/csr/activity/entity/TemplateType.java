package com.csr.activity.entity;

/**
 * 活动模板类型枚举
 * 定义 5 种活动模板，每种模板对应不同的员工报名表单字段
 */
public enum TemplateType {
    /** 基础活动：可选文字说明 */
    BASIC,
    /** 捐赠活动：金额（必填）+ 留言（选填） */
    DONATION,
    /** 志愿者活动：服务时长（必填）+ 照片上传（最多5张） */
    VOLUNTEER,
    /** 签到活动：自动记录签到时间 + 照片上传（可选） */
    CHECKIN,
    /** 自定义活动：管理员配置字段 */
    CUSTOM
}
