# AI 海报模块（ai-poster）

## 概述
基于员工的活动参与记录，使用通义万相 Wan 2.7 Image Pro 生成个性化 CSR 纪念海报。包含海报工作台（生成）和海报画廊（浏览历史）。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 海报工作台 | spec-poster-studio.md | design-poster-studio.md | ✅ 已实现 | participation |
| 海报画廊 | spec-poster-gallery.md | design-poster-gallery.md | ✅ 已实现 | poster-studio |

## 模块间依赖
- **依赖**：auth（认证）、participation（需要有参与记录才能生成海报）
- **被依赖**：无

## 推荐实现顺序
1. poster-studio（海报工作台 — 核心生成功能）
2. poster-gallery（海报画廊 — 依赖已有海报数据）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/AIPosterStudioPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/poster/`（代理至 AI 服务）
- **AI 服务**：`csr_ai_service/app/api/poster.py`、`app/agents/poster_agent.py`、`app/agents/image_gen.py`
