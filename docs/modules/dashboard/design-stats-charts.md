---
module: dashboard
feature: stats-charts
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/AdminApp.tsx
    lines: 153-320
    desc: Dashboard页（4列 StatCard、折线图+饼图、Top员工表+活动进度条）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/activity/design-activity-crud.md
  - docs/modules/participation/design-signup.md
---

# 统计看板 — 技术设计

## 概述
管理端数据看板实现，包括统计卡片、趋势折线图、类型分布饼图、员工排行和近期活动列表。

## API 端点

| 方法 | 路径 | 说明 | 响应体 |
|------|------|------|--------|
| GET | `/api/v2/dashboard/stats` | 总览统计 | `{ totalActivities, totalParticipations, totalDonation, monthlyNew }` |
| GET | `/api/v2/dashboard/trends` | 参与趋势 | `[{ month, count }]` |
| GET | `/api/v2/dashboard/distribution` | 类型分布 | `[{ templateType, count, percentage }]` |
| GET | `/api/v2/dashboard/top-participants` | Top 10 员工 | `[{ userId, displayName, count }]` |

## 前端实现
- **页面**：`pages/admin/DashboardPage.tsx`
- **组件**：
  - `StatCards.tsx`（4 个统计卡片）
  - `TrendChart.tsx`（Recharts 折线图）
  - `DistributionChart.tsx`（Recharts 饼图）
  - `TopParticipantsList.tsx`（排行列表）
  - `RecentActivities.tsx`（近期活动）
- **图表库**：Recharts
- **路由**：`/admin`（管理端首页）
- **加载状态**：骨架屏（Skeleton）
- **响应式**：桌面 4 列卡片 + 2 列图表 / 移动端 2 列卡片 + 图表堆叠

## 后端实现
- **包路径**：`com.csr.dashboard`
- **Controller**：DashboardController — 4 个统计端点
- **Service**：DashboardService — 聚合查询
- **Repository**：复用 ActivityRepository、UserActivityRepository，使用 @Query 聚合
- **权限**：所有端点需 ADMIN 角色

## 实现步骤清单（Implementation Checklist）
1. [x] 后端：创建 DashboardService（stats/trends/distribution/topParticipants）
2. [x] 后端：编写聚合查询 SQL（@Query 注解）
3. [x] 后端：创建 DashboardController（4 个端点）
4. [x] 后端：创建响应 DTO
5. [x] 前端：创建 services/dashboardApi.ts
6. [x] 前端：创建 StatCards.tsx
7. [x] 前端：创建 TrendChart.tsx（Recharts 折线图）
8. [x] 前端：创建 DistributionChart.tsx（Recharts 饼图）
9. [x] 前端：创建 TopParticipantsList.tsx
10. [x] 前端：创建 DashboardPage.tsx（整合所有组件 + 骨架屏）
11. [x] 前端：接入路由 /admin
12. [x] 前端：响应式适配
13. [x] 对照 spec-stats-charts.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/AdminApp.tsx` | 153-320 | 4列 StatCard（标题+数值+趋势标签）、月度参与趋势折线图（Recharts）、活动类型分布饼图、Top活跃员工表格、活动进度条 |
| `UI_UX_prototype/src/components/AdminApp.tsx` | 113-127 | 骨架屏加载状态（DashboardSkeleton） |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-stats-charts.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
