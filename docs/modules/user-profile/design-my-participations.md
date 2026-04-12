---
module: user-profile
feature: my-participations
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/EmployeeApp.tsx
    lines: 69-200
    desc: 首页（统计卡片、时间线、CTA 海报生成卡）
services:
  - csr_magic_frontend
  - csr_magic_backend
depends_on:
  - docs/modules/participation/design-signup.md
---

# 我的参与记录 — 技术设计

## 概述
实现员工端个人中心的参与记录 Tab，展示贡献统计和历史参与列表，集成我的海报 Tab。

## API 端点

| 方法 | 路径 | 说明 | 请求参数 | 响应体 |
|------|------|------|----------|--------|
| GET | `/api/v2/participations/my` | 我的参与记录 | page, size | `PageResponse<ParticipationResponse>` |
| GET | `/api/v2/users/me/stats` | 我的贡献统计 | - | `{ activityCount, volunteerHours, totalDonation }` |
| GET | `/api/v2/posters/my` | 我的海报列表 | page, size | `PageResponse<PosterResponse>` |

## 前端实现
- **页面**：`pages/MyProfilePage.tsx`
- **组件**：
  - `ContributionStats.tsx`（贡献统计卡片：参与数/时长/捐赠）
  - `ParticipationList.tsx`（参与记录列表 + 状态标签）
  - `MyPosterGallery.tsx`（我的海报 Tab）
- **Tab 切换**：Tab 1 = 参与记录，Tab 2 = 我的海报
- **API Service**：`services/participationApi.ts`（my）、`services/userApi.ts`（stats）、`services/posterApi.ts`（my）
- **导出**：CSV 导出功能（前端生成 CSV 文件并下载）
- **路由**：`/my`

## 后端实现
- **Controller**：UserController 增加 GET /users/me/stats 端点
- **Service**：UserService — getMyStats（聚合查询参与数、志愿时长、捐赠总额）
- **Repository**：UserActivityRepository — 聚合查询

## 实现步骤清单（Implementation Checklist）
1. [ ] 后端：UserService 增加 getMyStats 方法
2. [ ] 后端：UserController 增加 GET /users/me/stats 端点
3. [ ] 后端：编写聚合查询（参与数/时长/捐赠）
4. [ ] 前端：创建 ContributionStats.tsx
5. [ ] 前端：创建 ParticipationList.tsx（含状态标签颜色区分）
6. [ ] 前端：创建 MyPosterGallery.tsx
7. [ ] 前端：创建 MyProfilePage.tsx（Tab 切换 + 整合组件）
8. [ ] 前端：实现 CSV 导出功能
9. [ ] 前端：接入路由 /my
10. [ ] 对照 spec-my-participations.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/EmployeeApp.tsx` | 69-200 | 3列统计卡片（参与数/志愿时长/捐款）、Active Activities 卡片网格、最近参与时间线（Badge图标+标题+日期+积分）、CTA 海报生成卡（渐变背景） |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-my-participations.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
