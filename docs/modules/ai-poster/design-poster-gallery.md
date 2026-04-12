---
module: ai-poster
feature: poster-gallery
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/coding-standards.md
services:
  - csr_magic_frontend
depends_on:
  - docs/modules/ai-poster/design-poster-studio.md
---

# 海报画廊 — 技术设计

## 概述
实现海报历史展示组件，包括卡片网格、Lightbox 大图预览和下载功能。复用于海报工作台下方和个人中心"我的海报"Tab。

## API 端点

| 方法 | 路径 | 说明 | 请求参数 | 响应体 |
|------|------|------|----------|--------|
| GET | `/api/v2/posters/my` | 我的海报列表 | page, size | `PageResponse<PosterResponse>` |

## 前端实现
- **组件**：
  - `PosterGallery.tsx`（可复用的画廊组件，接收 posters 数据）
  - `PosterCard.tsx`（单张海报卡片：缩略图+活动名+时间）
  - `PosterLightbox.tsx`（大图预览：fadeIn + scaleIn 动画 + 下载按钮）
- **API Service**：复用 `services/posterApi.ts` — getMyPosters
- **使用位置**：
  - `AIPosterStudioPage.tsx` 下方（生成后自动刷新）
  - `MyProfilePage.tsx` 的"我的海报" Tab

### Lightbox 实现
- 点击卡片 → 打开 Lightbox（CSS transition: fadeIn + scaleIn）
- 背景半透明遮罩
- 点击遮罩或关闭按钮 → 关闭
- 下载按钮 → `<a download>` 触发浏览器下载

### 空状态
- 无海报时显示插画 + "暂无海报" + 「去生成海报」按钮

### 响应式
- 桌面：3-4 列卡片网格
- 移动端：2 列卡片网格
- Lightbox 全屏展示

## 实现步骤清单（Implementation Checklist）
1. [ ] 前端：创建 PosterCard.tsx
2. [ ] 前端：创建 PosterLightbox.tsx（动画 + 下载）
3. [ ] 前端：创建 PosterGallery.tsx（整合卡片+Lightbox+分页+空状态）
4. [ ] 前端：集成到 AIPosterStudioPage.tsx 下方
5. [ ] 前端：集成到 MyProfilePage.tsx 的"我的海报" Tab
6. [ ] 前端：响应式适配
7. [ ] 对照 spec-poster-gallery.md 验收标准自检

## 引用
- 对应功能规格：spec-poster-gallery.md
- 参考实现：docs/exemplar/
