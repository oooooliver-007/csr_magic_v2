# AI 对话报名模块（ai-chat-registration）

## 概述
通过自然语言对话（Qwen 通义千问）完成活动报名，替代传统表单填写。Agent 根据活动模板类型动态调整对话深度和收集字段。

## 功能清单

| 功能 | spec 文件 | design 文件 | 状态 | 依赖 |
|------|-----------|-------------|------|------|
| 对话界面 | spec-chat-ui.md | design-chat-ui.md | ✅已实现 | activity-detail |
| Agent 对话流程 | spec-agent-flow.md | design-agent-flow.md | 待实现 | chat-ui |

## 模块间依赖
- **依赖**：auth（认证）、activity（需要活动信息和模板字段）
- **被依赖**：无

## 推荐实现顺序
1. chat-ui（对话界面 — UI 层，依赖活动详情）
2. agent-flow（Agent 对话流程 — 核心 AI 逻辑，依赖 chat-ui）

## 涉及的服务
- **前端**：`csr_magic_frontend/src/pages/ChatRegistrationPage.tsx`
- **后端**：`csr_magic_backend/src/main/java/com/csr/chat/`（代理至 AI 服务）
- **AI 服务**：`csr_ai_service/app/api/chat.py`、`csr_ai_service/app/agents/chat_agent.py`
