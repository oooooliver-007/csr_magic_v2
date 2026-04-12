---
module: ai-chat-registration
feature: chat-ui
requires_context:
  - docs/shared/api-contracts.md
  - docs/shared/coding-standards.md
  - docs/shared/ui-design-tokens.md
ui_prototype:
  - file: UI_UX_prototype/src/components/EmployeeApp.tsx
    lines: 432-546
    desc: AI 对话报名页（全屏聊天容器、AI/用户气泡、底部输入框、完成后按钮组）
services:
  - csr_magic_frontend
depends_on:
  - docs/modules/activity/design-activity-detail.md
---

# 对话界面 — 技术设计

## 概述
实现 AI 对话报名的前端聊天界面，包括消息气泡、打字机动画、输入框、草稿自动保存和表单模式切换。

## 前端实现
- **页面**：`pages/ChatRegistrationPage.tsx`
- **组件**：
  - `ChatWindow.tsx`（对话窗口主体）
  - `ChatBubble.tsx`（消息气泡：用户/AI 区分样式）
  - `ChatInput.tsx`（底部输入框 + 发送按钮）
  - `ActivityInfoCard.tsx`（左侧活动信息卡）
  - `ConfirmationCard.tsx`（报名确认摘要卡片）
  - `SuccessCard.tsx`（提交成功绿色卡片）
- **API Service**：`services/chatApi.ts`
- **路由**：`/activities/:id/chat`

### 消息气泡样式
- 用户消息：右对齐，蓝色背景，白色文字
- AI 消息：左对齐，浅灰背景，深色文字
- AI 消息有打字机动画（逐字显示，约 30ms/字）

### 输入框
- 底部固定，文本输入 + 发送按钮
- 发送中：输入框禁用 + loading 指示器
- Enter 发送，Shift+Enter 换行

### 草稿自动保存
- 使用 sessionStorage 存储已收集的字段数据
- key 格式：`chat_draft_{activityId}_{userId}`
- 重新进入页面检测到草稿 → 弹出"继续/重新开始"选择

### 表单模式切换
- 底部「切换表单模式」链接
- 点击 → 跳转到 `/activities/:id`（传统报名页）
- 跳转前将已收集的字段写入 URL query 或 sessionStorage

### 响应式
- 桌面：左侧活动信息卡（固定宽 300px）+ 右侧对话窗口
- 移动端：顶部活动信息卡（可折叠）+ 全屏对话窗口

## 实现步骤清单（Implementation Checklist）
1. [ ] 前端：创建 services/chatApi.ts（createSession/sendMessage/getSession）
2. [ ] 前端：创建 ChatBubble.tsx（用户/AI 样式区分 + 打字机动画）
3. [ ] 前端：创建 ChatInput.tsx（输入框 + 发送逻辑）
4. [ ] 前端：创建 ActivityInfoCard.tsx
5. [ ] 前端：创建 ConfirmationCard.tsx（确认摘要卡片）
6. [ ] 前端：创建 SuccessCard.tsx（成功提示卡片）
7. [ ] 前端：创建 ChatWindow.tsx（整合消息列表 + 滚动管理）
8. [ ] 前端：创建 ChatRegistrationPage.tsx（整合所有组件）
9. [ ] 前端：实现草稿自动保存/恢复逻辑
10. [ ] 前端：实现表单模式切换
11. [ ] 前端：接入路由 /activities/:id/chat
12. [ ] 前端：响应式适配（移动端折叠信息卡）
13. [ ] 对照 spec-chat-ui.md 验收标准自检

## UI 原型参考

| 原型文件 | 行范围 | 关键 UI 元素 |
|---------|--------|-------------|
| `UI_UX_prototype/src/components/EmployeeApp.tsx` | 432-546 | 全屏聊天容器（圆角白色卡片）、顶部 header（返回+标题+活动名）、消息区（AI 绿色图标左侧白色气泡 / 用户右侧绿色气泡）、完成后 CTA 按钮组（Create Poster + Back to Home）、底部输入框+发送按钮 |

> 实现时必须读取上述原型文件，遵循其布局、配色和交互模式。

## 引用
- 对应功能规格：spec-chat-ui.md
- 参考实现：docs/exemplar/
- 设计令牌：docs/shared/ui-design-tokens.md
