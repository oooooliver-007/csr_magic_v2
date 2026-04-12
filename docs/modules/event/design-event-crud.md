---
module: event
feature: event-crud
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/api-guidelines.md
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/auth/design-jwt-auth.md
---

# 事件 CRUD — 技术设计

## 概述
管理端事件的完整 CRUD 实现。本模块被选为 Exemplar 参考实现（详见 docs/exemplar/）。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/events` | 事件列表（分页+搜索） | query: page, size, keyword | `PageResponse<EventResponse>` |
| GET | `/api/v2/events/{id}` | 事件详情 | - | `EventResponse` |
| POST | `/api/v2/events` | 创建事件 | `CreateEventRequest` | `EventResponse` |
| PUT | `/api/v2/events/{id}` | 更新事件 | `UpdateEventRequest` | `EventResponse` |
| DELETE | `/api/v2/events/{id}` | 删除事件 | - | - |

## 数据模型
- 使用 `event` 表（见 data-models.md）
- 封面图使用 base64 存储（≤500KB）

## 前端实现
- **页面**：`pages/admin/EventManagementPage.tsx`
- **组件**：`EventFormDrawer.tsx`（创建/编辑抽屉）、`EventViewDrawer.tsx`（只读查看）
- **API Service**：`services/eventApi.ts`
- **类型定义**：`types/event.ts`
- **路由**：`/admin/events`（Admin 权限）
- **响应式**：桌面端表格 / 移动端卡片列表

## 后端实现
- **包路径**：`com.csr.event`
- **Controller**：EventController — 5 个端点
- **Service**：EventService 接口 + EventServiceImpl
- **Repository**：EventRepository（JpaRepository）
- **Entity**：Event
- **DTO**：CreateEventRequest、UpdateEventRequest、EventResponse
- **权限**：所有端点需 ADMIN 角色

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 Event Entity + EventRepository
2. [x] 后端：创建 DTO（CreateEventRequest、UpdateEventRequest、EventResponse）
3. [x] 后端：创建 EventService 接口 + EventServiceImpl
4. [x] 后端：创建 EventController（5 个端点）
5. [x] 后端：Flyway 迁移脚本（event 表）
6. [x] 前端：创建 types/event.ts 类型定义
7. [x] 前端：创建 services/eventApi.ts
8. [x] 前端：创建 EventManagementPage.tsx（表格+搜索+分页）
9. [x] 前端：创建 EventFormDrawer.tsx（创建/编辑抽屉）
10. [x] 前端：创建 EventViewDrawer.tsx（只读查看抽屉）
11. [x] 前端：接入路由 /admin/events
12. [x] 前端：响应式适配（表格→卡片）
13. [x] 对照 spec-event-crud.md 验收标准自检

## 引用
- 对应功能规格：spec-event-crud.md
- 参考实现：docs/exemplar/（本模块即为 exemplar 原型）
