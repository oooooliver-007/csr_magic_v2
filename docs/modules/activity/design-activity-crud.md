---
module: activity
feature: activity-crud
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/api-guidelines.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 322-547
    desc: 活动管理页（筛选栏+表格、右侧 Drawer 创建表单含封面上传）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/event/design-event-crud.md
---

# 活动 CRUD（管理端） — 技术设计

## 概述
管理端活动的完整 CRUD 实现，包括列表（含缩略图）、View 只读抽屉、Edit 编辑抽屉和创建功能。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/activities` | 活动列表（分页+筛选） | query: page, size, eventId, status | `PageResponse<ActivityResponse>` |
| GET | `/api/v2/activities/{id}` | 活动详情 | - | `ActivityDetailResponse` |
| POST | `/api/v2/activities` | 创建活动 | `CreateActivityRequest` | `ActivityResponse` |
| PUT | `/api/v2/activities/{id}` | 更新活动 | `UpdateActivityRequest` | `ActivityResponse` |
| DELETE | `/api/v2/activities/{id}` | 删除活动 | - | - |

## 数据模型
- 使用 `activity` 表（见 data-models.md）
- CreateActivityRequest 包含：eventId, name, templateType, startTime, endTime, maxParticipants, description, coverImage
- 封面图 base64 编码（≤500KB）

## 前端实现
- **页面**：`pages/admin/ActivityManagementPage.tsx`
- **组件**：`ActivityFormDrawer.tsx`（创建/编辑）、`ActivityViewDrawer.tsx`（只读查看）
- **API Service**：`services/activityApi.ts`
- **路由**：`/admin/activities`
- **事件下拉**：调用 eventApi.list 获取事件列表
- **响应式**：桌面端表格（含缩略图列）/ 移动端卡片列表

## 后端实现
- **包路径**：`com.csr.activity`
- **Controller**：ActivityController — 5 个 CRUD 端点
- **Service**：ActivityService — CRUD 方法 + 参与人数统计
- **Repository**：ActivityRepository
- **DTO**：CreateActivityRequest、UpdateActivityRequest、ActivityResponse
- **权限**：创建/更新/删除需 ADMIN 角色

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 Activity Entity（如不存在）
2. [x] 后端：创建 DTO（CreateActivityRequest、UpdateActivityRequest）
3. [x] 后端：创建 ActivityService — CRUD 方法
4. [x] 后端：创建 ActivityController — 5 个端点
5. [x] 后端：Flyway 迁移脚本（activity 表）
6. [x] 前端：创建/更新 types/activity.ts
7. [x] 前端：activityApi.ts 增加 CRUD 方法
8. [x] 前端：创建 ActivityManagementPage.tsx
9. [x] 前端：创建 ActivityFormDrawer.tsx
10. [x] 前端：创建 ActivityViewDrawer.tsx
11. [x] 前端：接入路由 /admin/activities
12. [x] 前端：响应式适配
13. [x] 对照 spec-activity-crud.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/AdminApp.tsx` | 322-547 | 筛选栏（搜索+事件下拉+状态下拉+创建按钮）、数据表格（名称/事件/类型徽章/日期/参与人数/状态+操作）、右侧 Drawer（事件选择/名称/模板类型/日期/容量/描述/封面上传） |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-activity-crud.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
