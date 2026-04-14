# 通知模块（notification）

## 概述
站内通知系统，自动向员工发送报名确认、审核结果、活动提醒等通知。支持未读角标和全部已读。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 站内通知 | spec-notification-system.md | design-notification-system.md | 已实现 | auth |

## 模块间依赖
- **依赖**：auth（认证）
- **被依赖**：participation 触发通知（报名成功、审核结果）

## 推荐实现顺序
1. notification-system（仅一个功能，直接实现）

## 涉及的服务
- **前端**：通知铃铛组件（Header 中）、通知列表页
- **后端**：`csr_magic_backend/src/main/java/com/csr/notification/`
- **AI 服务**：不涉及
