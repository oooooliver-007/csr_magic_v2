/**
 * AI 对话报名 — 前端领域类型
 *
 * 后端契约（见 docs/shared/api-contracts.md 与 PR #3）：
 *   POST   /api/v2/chat/start          body { activityId }
 *   POST   /api/v2/chat/message        body { sessionId, content }
 *   POST   /api/v2/chat/confirm        body { sessionId }
 *   GET    /api/v2/chat/sessions/{sessionId}
 *
 * 所有响应 data 字段：
 *   { sessionId, activityId, reply, status, collectedFields, complete,
 *     messages, participationId? }
 */

/**
 * 前端展示层的消息角色。
 * 后端 `messages[].role` 为 "user" / "assistant" / "system"，
 * 在 `chatStore` 转换为该枚举。
 */
export type ChatRole = 'USER' | 'AI' | 'SYSTEM';

/**
 * 会话阶段（与后端 `ChatResponse.status` 一致）
 * - COLLECTING：正在收集字段
 * - CONFIRMING：已收集完成，等待用户确认
 * - COMPLETED：已成功报名（后端调用 participationService.signup 完成）
 * - ERROR：前端网络/业务错误，仅前端使用
 */
export type ChatStage = 'COLLECTING' | 'CONFIRMING' | 'COMPLETED' | 'ERROR';

/**
 * 前端渲染用的聊天消息
 */
export interface ChatMessage {
  /** 客户端生成的稳定 id，用于 React key */
  id: string;
  role: ChatRole;
  content: string;
  /** ISO 8601 UTC */
  createdAt: string;
  /** AI 消息是否使用打字机动画（默认最新一条 AI 消息为 true） */
  typewriter?: boolean;
}

/**
 * 后端返回的原始消息（messages[] 数组项）
 */
export interface ChatServerMessage {
  role: string;
  content: string;
}

/**
 * `POST /chat/start|message|confirm` 与 `GET /chat/sessions/{id}` 的响应 data
 */
export interface ChatSessionResponse {
  sessionId: string;
  activityId: number;
  reply: string;
  status: ChatStage;
  collectedFields: Record<string, unknown>;
  complete: boolean;
  messages: ChatServerMessage[];
  participationId?: number | null;
}

/**
 * sessionStorage 草稿结构（仅保存 sessionId，状态由后端拉回）。
 *
 * 重入流程：入页检测到草稿 → 用 sessionId 调 `GET /chat/sessions/{id}`
 * 拿回最新的 messages / collectedFields / status，避免前端落盘状态与后端漂移。
 */
export interface ChatDraft {
  sessionId: string;
  activityId: number;
  /** 草稿写入时间（ISO 8601 UTC） */
  updatedAt: string;
}
