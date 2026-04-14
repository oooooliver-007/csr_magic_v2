# 数据看板模块（dashboard）

## 概述
为管理员提供 CSR 项目的整体运营数据可视化，包括统计卡片、趋势图、分布图和排行榜。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 统计看板 | spec-stats-charts.md | design-stats-charts.md | ✅ 已实现 | activity, participation |

## 模块间依赖
- **依赖**：auth（Admin 角色校验）、activity（活动数据）、participation（参与数据）
- **被依赖**：无

## 推荐实现顺序
1. stats-charts（仅一个功能，直接实现；需等 activity 和 participation 模块有数据后）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/admin/DashboardPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/dashboard/`
- **AI 服务**：不涉及
