---
module: ai-chat-registration
feature: agent-flow
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/data-models.md
  - docs/shared/coding-standards.md
  - docs/shared/tech-stack.md
services:
  - csr_magic_backend
  - csr_ai_service
depends_on:
  - docs/modules/ai-chat-registration/design-chat-ui.md
  - docs/modules/activity/design-activity-templates.md
---

# Agent 对话流程 — 技术设计

## 概述
实现 Qwen Agent 的对话报名核心逻辑：根据活动模板类型动态调整对话策略，逐步收集字段，确认后通过后端 API 提交报名。

## API 端点

### 后端（csr_magic_backend）

| 方法 | 路径 | 说明 | 请求体 | 响应体 |
|------|------|------|--------|--------|
| POST | `/api/v2/chat/sessions` | 创建对话会话 | `{ activityId }` | `{ sessionId, welcomeMessage }` |
| POST | `/api/v2/chat/sessions/{sessionId}/messages` | 发送消息 | `{ content }` | `{ reply, collectedFields, isComplete }` |
| GET | `/api/v2/chat/sessions/{sessionId}` | 获取会话历史 | - | `{ messages[], collectedFields, status }` |

### AI 服务（csr_ai_service）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/chat/sessions` | 创建会话（初始化 Agent 上下文） |
| POST | `/chat/sessions/{session_id}/messages` | 处理用户消息（Agent 推理） |

## Agent 架构

### 会话上下文
```python
class ChatSession:
    session_id: str
    activity_id: int
    activity_info: dict          # 活动信息（名称、类型、时间）
    template_type: str           # 模板类型
    required_fields: list[dict]  # 需要收集的字段列表
    collected_fields: dict       # 已收集的字段值
    messages: list[dict]         # 对话历史
    status: str                  # COLLECTING / CONFIRMING / COMPLETED
```

### Agent 推理流程
1. **创建会话**：根据 activityId 获取活动信息 + 模板字段 → 生成开场白
2. **处理消息**：
   - 构建 prompt（系统指令 + 活动上下文 + 已收集字段 + 对话历史 + 用户消息）
   - 调用 Qwen API 获取回复
   - 解析回复中的字段提取结果
   - 更新 collected_fields
3. **字段收齐**：生成确认摘要，status → CONFIRMING
4. **用户确认**：调用后端报名 API，status → COMPLETED

### Prompt 设计
- **系统 prompt**：定义 Agent 角色（CSR 活动报名助手）、行为规范、输出格式
- **上下文 prompt**：注入活动信息、模板字段、已收集字段
- **指令**：按模板类型调整对话策略（简单活动快速完成，复杂活动分步收集）

### 字段提取
- Qwen 输出结构化 JSON 标记：`<fields>{"amount": 200}</fields>`
- AI 服务解析标记，更新 collected_fields
- 未提取到有效字段时，Agent 重新引导

## 后端实现
- **包路径**：`com.csr.chat`
- **Controller**：ChatController — 3 个端点
- **Service**：ChatService
  - createSession：创建会话记录 → 调用 AI 服务初始化
  - sendMessage：转发消息至 AI 服务 → 返回回复 + 字段状态
  - 字段收齐且用户确认 → 调用 ParticipationService.signup
- **AI 服务代理**：RestTemplate/WebClient 调用 AI 服务

## AI 服务实现
- **API**：`app/api/chat.py`
- **Agent**：`app/agents/chat_agent.py`
- **Prompt 模板**：`app/prompts/chat_system.txt`、`app/prompts/chat_context.txt`
- **字段解析**：`app/utils/field_parser.py`
- **会话存储**：内存字典（MVP）→ Redis（后续）

## 实现步骤清单（Implementation Checklist）
1. [ ] AI 服务：设计系统 prompt 和上下文 prompt 模板
2. [ ] AI 服务：创建 chat_agent.py（Agent 推理主流程）
3. [ ] AI 服务：创建 field_parser.py（字段提取解析）
4. [ ] AI 服务：创建 chat.py API 路由（3 个端点）
5. [ ] AI 服务：会话内存存储管理
6. [ ] 后端：创建 ChatSession Entity（可选，或仅内存）
7. [ ] 后端：创建 ChatService（createSession/sendMessage/getSession）
8. [ ] 后端：创建 ChatController（3 个端点）
9. [ ] 后端：集成 ParticipationService（确认后自动报名）
10. [ ] 前端：chatApi.ts 对接后端 3 个端点
11. [ ] 集成测试：完整对话流程（创建→对话→确认→报名）
12. [ ] 对照 spec-agent-flow.md 验收标准自检

## 引用
- 对应功能规格：spec-agent-flow.md
- 参考实现：docs/exemplar/
