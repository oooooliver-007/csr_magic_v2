---
module: ai-poster
feature: poster-studio
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/tech-stack.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/EmployeeApp.tsx
    lines: 548-667
    desc: AI 海报工作台（左侧控制面板+右侧预览、输入+风格选择+生成+下载/分享）
services:
  - csr_magic_frontend
  - csr_magic_backend
  - csr_ai_service
depends_on:
  - docs/modules/participation/design-signup.md
---

# 海报工作台 — 技术设计

## 概述
实现 AI 海报生成的前后端全链路：前端选择活动+风格+提示词 → 后端代理至 AI 服务 → AI 服务调用通义万相生成海报 → 前端轮询状态并展示结果。

## API 端点

### 后端（csr_magic_backend）

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | `/api/v2/posters/generate` | 提交生成任务 | `{ activityId, style, userPrompt }` | `{ taskId }` |
| GET | `/api/v2/posters/{taskId}/status` | 查询生成状态 | - | `{ status, posterUrl, errorMessage }` |
| GET | `/api/v2/posters/my` | 我的海报列表 | query: page, size | `PageResponse<PosterResponse>` |

### AI 服务（csr_ai_service）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/poster/generate` | 接收生成请求，异步处理 |
| GET | `/poster/{task_id}` | 查询任务状态和结果 |

## 数据模型
- 使用 `ai_poster` 表（见 data-models.md）
- 海报图片存储在 AI 服务的 `/static/posters/` 目录（MVP），后续迁移 OSS

## 前端实现
- **页面**：`pages/AIPosterStudioPage.tsx`
- **组件**：
  - `ActivitySelector.tsx`（活动下拉，仅显示已参与的活动）
  - `StyleSelector.tsx`（6 种风格卡片选择）
  - `PromptInput.tsx`（自定义提示词输入）
  - `GenerateButton.tsx`（生成按钮 + loading 状态）
  - `PosterResult.tsx`（生成结果展示）
- **API Service**：`services/posterApi.ts`
- **轮询逻辑**：每 3 秒调用 status API，超时 2 分钟，401/403 自动停止
- **路由**：`/poster`
- **响应式**：单栏垂直布局，天然适配移动端

## 后端实现
- **包路径**：`com.csr.poster`
- **Controller**：PosterController — 3 个端点
- **Service**：PosterService
  - generate：创建 ai_poster 记录 → 异步调用 AI 服务
  - getStatus：查询 ai_poster 状态
  - getMyPosters：按 userId 分页查询
- **AI 服务代理**：使用 RestTemplate/WebClient 调用 AI 服务

## AI 服务实现
- **API**：`app/api/poster.py`
- **Agent**：`app/agents/poster_agent.py` — 海报生成主流程
- **图像生成**：`app/agents/image_gen.py` — 通义万相 Wan 2.7 Image Pro 调用
- **Prompt 构建**：`app/utils/prompt_builder.py` — 根据活动类型+风格构建 prompt
- **图像合成**：`app/utils/image_compose.py` — Pillow 合成最终海报
- **存储**：`app/utils/storage.py` — 本地文件存储

### 海报生成流程
1. 前端提交 → 后端创建 ai_poster 记录（PENDING）→ 异步调用 AI 服务
2. AI 服务：prompt_builder 构建 prompt → image_gen 调用万相 API → 下载临时 URL 图片
3. Pillow 合成最终海报（背景+文字叠加）→ 存储到 /static/posters/
4. 更新后端 ai_poster 记录（COMPLETED + posterUrl）
5. 前端轮询发现 COMPLETED → 展示海报

## 实现步骤清单（Implementation Checklist）
1. [ ] AI 服务：创建 prompt_builder.py（根据活动类型+风格构建 prompt）
2. [ ] AI 服务：创建 image_gen.py（通义万相 API 调用封装）
3. [ ] AI 服务：创建 image_compose.py（Pillow 合成海报）
4. [ ] AI 服务：创建 storage.py（本地文件存储）
5. [ ] AI 服务：创建 poster_agent.py（生成主流程编排）
6. [ ] AI 服务：创建 poster.py API 路由
7. [ ] 后端：创建 AiPoster Entity + AiPosterRepository
8. [ ] 后端：创建 PosterService（generate/getStatus/getMyPosters）
9. [ ] 后端：创建 PosterController（3 个端点）
10. [ ] 后端：Flyway 迁移脚本（ai_poster 表）
11. [ ] 前端：创建 services/posterApi.ts
12. [ ] 前端：创建各组件（ActivitySelector/StyleSelector/PromptInput/GenerateButton/PosterResult）
13. [ ] 前端：创建 AIPosterStudioPage.tsx（整合组件 + 轮询逻辑）
14. [ ] 前端：接入路由 /poster
15. [ ] 对照 spec-poster-studio.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/EmployeeApp.tsx` | 548-667 | 左侧控制面板（描述输入+6种风格选择按钮+生成按钮含 Loading）、右侧预览卡（虚线边框占位符→生成后图片+渐变覆盖层文字）、底部 Download+Share 按钮 |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-poster-studio.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
