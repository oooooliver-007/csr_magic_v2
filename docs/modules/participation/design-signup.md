---
module: participation
feature: signup
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 557-757
    desc: 参与审核页（Checkbox表格、批量审批/拒绝、可展开详情行、分页）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/activity/design-activity-detail.md
---

# 报名/退出 — 技术设计

## 概述
实现员工活动报名和退出的全链路，以及管理端参与记录的查看和审核功能。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | `/api/v2/participations/signup` | 报名 | `{ activityId, formData }` | `ParticipationResponse` |
| POST | `/api/v2/participations/{id}/withdraw` | 退出 | - | - |
| GET | `/api/v2/participations/my` | 我的参与记录 | query: page, size | `PageResponse<ParticipationResponse>` |
| GET | `/api/v2/participations` | 参与列表（管理端） | query: page, size, eventId, activityId, userId, state, keyword, createdFrom, createdTo | `PageResponse<ParticipationResponse>` |
| PATCH | `/api/v2/participations/{id}/review` | 审核 | `{ action: "APPROVE"|"REJECT", rejectReason? }` | `ParticipationResponse` |

## 数据模型
- 使用 `user_activity` 表（见 data-models.md）
- formData 为 JSONB，存储用户提交的表单数据
- state 状态流转：PENDING → APPROVED / REJECTED

## 前端实现
- **员工端**：报名表单集成在 `ActivityDetailPage.tsx` 的 `SignupForm.tsx` 中
- **管理端页面**：`pages/admin/ParticipationPage.tsx`
- **组件**：
  - `ParticipationTable.tsx`（参与记录表格）
  - `ParticipationDetail.tsx`（展开详情：表单内容+附件）
  - `ReviewDialog.tsx`（审核弹窗：通过/驳回+原因）
- **API Service**：`services/participationApi.ts`
- **路由**：管理端 `/admin/participations`
- **当前实现补充**：管理端支持事件、活动、员工、状态、关键词、时间范围筛选；列表展示参与内容摘要、审核人；展开详情支持附件图片预览

## 后端实现
- **包路径**：`com.csr.participation`
- **Controller**：ParticipationController — 5 个端点
- **Service**：ParticipationService
  - signup：校验活动状态、名额、重复报名 → 创建记录 → 发送通知
  - withdraw：校验状态为 PENDING 且活动未结束 → 删除记录
  - review：更新状态 → 发送通知（通过/驳回）
- **Repository**：UserActivityRepository
- **通知集成**：报名成功、审核通过、审核驳回时调用 NotificationService 发送站内通知

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 UserActivity Entity + UserActivityRepository
2. [x] 后端：创建 DTO（SignupRequest、ReviewRequest、ParticipationResponse）
3. [x] 后端：创建 ParticipationService（signup/withdraw/review/list）
4. [x] 后端：创建 ParticipationController（5 个端点）
5. [x] 后端：Flyway 迁移脚本（user_activity 表）
6. [x] 后端：集成通知发送（审核通过/驳回时）
7. [x] 前端：创建 services/participationApi.ts
8. [x] 前端：创建 ParticipationPage.tsx（管理端）
9. [x] 前端：创建 ParticipationTable + Detail + ReviewDialog 组件
10. [x] 前端：集成 SignupForm 到 ActivityDetailPage
11. [x] 前端：接入路由 /admin/participations
12. [x] 前端：响应式适配（管理端表格→卡片+展开详情）
13. [x] 对照 spec-signup.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/AdminApp.tsx` | 557-757 | Checkbox 表格（员工头像+部门/活动/日期/状态徽章）、批量审批/拒绝按钮、可展开详情行（报名备注+联系）、筛选栏、分页 |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-signup.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
