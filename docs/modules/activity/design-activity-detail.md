---
module: activity
feature: activity-detail
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/EmployeeApp.tsx
    lines: 280-430
    desc: 活动详情页（全宽封面图、左侧详情+右侧粘性报名卡、移动端底栏）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/activity/design-activity-list.md
---

# 活动详情 + 报名 — 技术设计

## 概述
员工端活动详情页，展示活动完整信息，根据模板类型动态渲染报名表单，支持报名和退出操作。

## API 端点

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| GET | `/api/v2/activities/{id}` | 活动详情 | - | `ActivityDetailResponse` |
| POST | `/api/v2/participations/signup` | 报名 | `{ activityId, formData }` | `ParticipationResponse` |
| POST | `/api/v2/participations/{id}/withdraw` | 退出 | - | - |

## 数据模型
- ActivityDetailResponse：扩展 ActivityResponse，增加 description（富文本）、formSchema、currentUserParticipation
- formData 为 JSONB，结构随模板类型变化

## 前端实现
- **页面**：`pages/ActivityDetailPage.tsx`
- **组件**：
  - `ActivityInfo.tsx`（活动信息展示区）
  - `SignupForm.tsx`（报名表单，根据 templateType 动态渲染）
  - `ParticipationStatus.tsx`（当前用户参与状态展示）
- **API Service**：`services/activityApi.ts`（getById）、`services/participationApi.ts`（signup、withdraw）
- **路由**：`/activities/:id`
- **表单验证**：React Hook Form + Zod，schema 根据 templateType 动态生成
- **响应式**：桌面宽屏内容区 / 移动端单列 + 底部固定操作按钮

## 后端实现
- **Controller**：ActivityController — GET /activities/{id}
- **Service**：ActivityService — getById（含当前用户参与状态查询）
- **DTO**：ActivityDetailResponse（含 currentUserParticipation 字段）
- 报名/退出逻辑在 participation 模块中实现

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 ActivityDetailResponse DTO
2. [x] 后端：ActivityService — getById 方法（含参与状态）
3. [x] 后端：ActivityController — GET /activities/{id}
4. [x] 前端：创建 ActivityInfo.tsx 组件
5. [x] 前端：创建 SignupForm.tsx（动态表单，按 templateType 切换）
6. [x] 前端：创建 ParticipationStatus.tsx 组件
7. [x] 前端：创建 ActivityDetailPage.tsx（整合组件）
8. [x] 前端：activityApi.ts 增加 getById 方法
9. [x] 前端：接入路由 /activities/:id
10. [x] 前端：响应式适配（移动端底部固定操作栏）
11. [x] 对照 spec-activity-detail.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/EmployeeApp.tsx` | 280-430 | 全宽封面图（圆角底边）、左侧活动详情（Badge+标签+四宫格信息卡）、右侧粘性报名卡（捐款输入+留言+Register按钮+AI Chat按钮）、移动端底部固定操作栏 |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-activity-detail.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
