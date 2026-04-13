---
module: activity
feature: activity-list
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/EmployeeApp.tsx
    lines: 202-278
    desc: 活动列表页（搜索框、横向滚动筛选标签、3列卡片网格）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/event/design-event-crud.md
---

# 活动列表（员工端） — 技术设计

## 概述
员工端活动浏览页面，支持搜索、多维筛选和分页，以卡片网格展示活动列表。

## API 端点

| 方法 | 路径 | 说明 | 请求参数 | 响应体 |
|------|------|------|----------|--------|
| GET | `/api/v2/activities` | 活动列表 | page, size, keyword, templateType, status, eventId | `PageResponse<ActivityResponse>` |

## 数据模型
- 使用 `activity` 表 + JOIN `event` 表获取事件名
- ActivityResponse 包含：id, name, eventName, templateType, status, startTime, endTime, coverImage, participantCount, maxParticipants

## 前端实现
- **页面**：`pages/ActivityListPage.tsx`
- **组件**：`ActivityCard.tsx`（活动卡片）、`ActivityFilters.tsx`（筛选栏）
- **API Service**：`services/activityApi.ts`
- **类型定义**：`types/activity.ts`
- **路由**：`/activities`
- **交互**：搜索防抖 300ms，筛选变化重置到第一页
- **响应式**：桌面 2-3 列卡片 / 移动端单列 + 筛选可折叠

## 后端实现
- **包路径**：`com.csr.activity`
- **Controller**：ActivityController — GET /activities（带筛选参数）
- **Service**：ActivityService — list 方法支持多维筛选
- **Repository**：ActivityRepository — 自定义查询（Specification 或 @Query）
- **DTO**：ActivityResponse（含 eventName、participantCount）

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 Activity Entity + ActivityRepository
2. [x] 后端：创建 ActivityResponse DTO（含关联字段）
3. [x] 后端：创建 ActivityService — list 方法（多维筛选）
4. [x] 后端：创建 ActivityController — GET /activities
5. [x] 前端：创建 types/activity.ts
6. [x] 前端：创建 services/activityApi.ts — list 方法
7. [x] 前端：创建 ActivityCard.tsx 组件
8. [x] 前端：创建 ActivityFilters.tsx 组件（搜索+筛选）
9. [x] 前端：创建 ActivityListPage.tsx（整合卡片+筛选+分页）
10. [x] 前端：接入路由 /activities
11. [x] 前端：响应式适配（多列→单列，筛选折叠）
12. [x] 对照 spec-activity-list.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/EmployeeApp.tsx` | 202-278 | 搜索框、横向滚动筛选标签（All/Volunteer/Donation/Check-in/General）、3列卡片网格、卡片含封面图+Badge+日期+参与人数 |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-activity-list.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
