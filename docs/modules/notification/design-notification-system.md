---
module: notification
feature: notification-system
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/auth/design-jwt-auth.md
---

# 站内通知 — 技术设计

## 概述
实现站内通知系统的前后端全链路，包括通知铃铛组件（未读角标）、通知下拉列表、通知列表页和后端通知触发机制。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/notifications/my` | 我的通知列表 | query: page, size | `PageResponse<NotificationResponse>` |
| GET | `/api/v2/notifications/unread-count` | 未读通知数 | - | `{ count }` |
| PATCH | `/api/v2/notifications/{id}/read` | 标记已读 | - | - |
| PATCH | `/api/v2/notifications/read-all` | 全部已读 | - | - |

## 数据模型
- 使用 `notification` 表（见 data-models.md）
- NotificationResponse 包含：id, type, title, content, isRead, createdAt

## 前端实现
- **组件**：
  - `NotificationBell.tsx`（Header 铃铛 + 角标 + 下拉列表）
  - `NotificationDropdown.tsx`（最近 5 条 + 查看全部链接）
  - `NotificationListPage.tsx`（全部通知列表页）
- **API Service**：`services/notificationApi.ts`
- **轮询**：页面加载和定时刷新（30 秒间隔）获取未读数
- **路由**：通知列表页（可选独立页面或 Modal）

## 后端实现
- **包路径**：`com.csr.notification`
- **Controller**：NotificationController — 4 个端点
- **Service**：NotificationService
  - 查询通知列表（按当前用户 + 时间倒序）
  - 获取未读数
  - 标记已读 / 全部已读
  - **创建通知**：提供 `createNotification(userId, type, title, content)` 方法，供其他模块调用
- **Repository**：NotificationRepository
- **触发点**：
  - ParticipationService.signup → 创建 SIGNUP_SUCCESS 通知
  - ParticipationService.review（APPROVE）→ 创建 REVIEW_APPROVED 通知
  - ParticipationService.review（REJECT）→ 创建 REVIEW_REJECTED 通知

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 Notification Entity + NotificationRepository
2. [x] 后端：创建 NotificationResponse DTO
3. [x] 后端：创建 NotificationService（CRUD + createNotification）
4. [x] 后端：创建 NotificationController（4 个端点）
5. [x] 后端：Flyway 迁移脚本（notification 表）
6. [x] 后端：集成到 ParticipationService（报名/审核时触发通知）
7. [x] 前端：创建 services/notificationApi.ts
8. [x] 前端：创建 NotificationBell.tsx（铃铛+角标）
9. [x] 前端：创建 NotificationDropdown.tsx（下拉列表）
10. [x] 前端：创建 NotificationListPage.tsx（全部通知）
11. [x] 前端：集成铃铛组件到 Header
12. [x] 前端：实现未读数轮询
13. [x] 对照 spec-notification-system.md 验收标准自检

## 引用
- 对应功能规格：spec-notification-system.md
- 参考实现：docs/exemplar/

## 角色体验重构 (Admin 端任务化)

为了给管理员和普通用户提供更具针对性的通知体验，系统对管理端顶部的铃铛与功能入口进行了重构：

### 1. 管理端“审批待办”铃铛
- **管理端顶栏铃铛** (`AdminReviewTodoBell.tsx`)：代替了原有的传统消息通知流水铃铛。
- **任务化驱动**：该铃铛由 `/api/v2/participations/review-todos` 接口驱动，返回当前所有状态为 `PENDING` 和 `RE_SUBMITTED` 的报名参与记录（按创建时间倒序）。
- **角标指示**：铃铛角标数字显示当前处于待审核状态的报名总数 (`totalElements`)。
- **下拉展示**：下拉列表展示最新的 5 条待审核信息（含申请人、活动、提交时间以及是否为重新提交）。点击待办行或底部的“查看全部”将直接导航至管理端 `/admin/participations?state=PENDING`。

### 2. 移除通知管理入口与兜底重定向
- **侧边栏变更**：移除管理端左侧侧边栏的「通知管理」菜单项。
- **路由重定向**：访问原管理端通知页面 `/admin/notifications` 的路由在前端被重定向至 `/admin/participations?state=PENDING`，防止老路由产生 404 并且无缝引导管理员至核心审核场景。
- **员工端保留**：员工端的站内通知中心及铃铛保留现状（关注具体的审批结果通知 `REVIEW_APPROVED`、`REVIEW_REJECTED` 等）。
