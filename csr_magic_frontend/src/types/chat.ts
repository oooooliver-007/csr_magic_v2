import type { FormFieldSchema, TemplateType } from './activity';

/**
 * 聊天消息角色
 * - USER：员工发送的消息
 * - AI：Agent 回复
 * - SYSTEM：系统通知（预留，如错误提示、状态变更）
 */
export type ChatRole = 'USER' | 'AI' | 'SYSTEM';

/**
 * 聊天消息
 */
export interface ChatMessage {
  /** 客户端生成的稳定 id，用于 React key */
  id: string;
  role: ChatRole;
  content: string;
  /** ISO 8601 UTC */
  createdAt: string;
  /** AI 消息是否使用打字机动画（默认 true） */
  typewriter?: boolean;
}

/**
 * Agent 对话阶段
 * - COLLECTING：正在收集字段
 * - CONFIRMING：已收集完成，等待用户确认提交
 * - SUBMITTED：已成功提交报名
 * - ERROR：网络或业务错误，前端展示重试
 */
export type ChatStage = 'COLLECTING' | 'CONFIRMING' | 'SUBMITTED' | 'ERROR';

/**
 * 会话快照（含消息历史 + 已收集字段 + 阶段）
 */
export interface ChatSession {
  sessionId: string;
  activityId: number;
  templateType: TemplateType;
  /** 需要 Agent 收集的字段 schema（根据 templateType 派生） */
  schema: FormFieldSchema[];
  messages: ChatMessage[];
  collectedFields: Record<string, unknown>;
  stage: ChatStage;
}

/**
 * 创建会话响应
 */
export interface CreateChatSessionResponse {
  sessionId: string;
  openingMessage: ChatMessage;
  schema: FormFieldSchema[];
}

/**
 * 发送消息响应
 */
export interface SendChatMessageResponse {
  reply: ChatMessage;
  collectedFields: Record<string, unknown>;
  stage: ChatStage;
}

/**
 * sessionStorage 草稿结构
 */
export interface ChatDraft {
  sessionId: string;
  activityId: number;
  messages: ChatMessage[];
  collectedFields: Record<string, unknown>;
  stage: ChatStage;
  /** 草稿更新时间（ISO 8601 UTC） */
  updatedAt: string;
}
