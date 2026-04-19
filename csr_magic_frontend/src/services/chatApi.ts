import apiClient from './apiClient';
import type { ApiResponse } from '../types/common';
import type { ChatSessionResponse } from '../types/chat';

/**
 * AI 对话报名 API Service
 *
 * 后端契约（ai-chat-registration / agent-flow, PR #3）：
 *   POST /api/v2/chat/start          body { activityId }
 *   POST /api/v2/chat/message        body { sessionId, content }
 *   POST /api/v2/chat/confirm        body { sessionId }    （确认后由后端完成 signup）
 *   GET  /api/v2/chat/sessions/{sessionId}
 *
 * 所有请求经 `apiClient` 自动附加 JWT 及刷新拦截。
 */

const BASE = '/api/v2/chat';

export interface ChatStartRequest {
  activityId: number;
}

export interface ChatMessageRequest {
  sessionId: string;
  content: string;
}

export interface ChatConfirmRequest {
  sessionId: string;
}

export const chatApi = {
  /**
   * 创建会话。后端根据活动模板类型生成开场白 + 首个字段问题。
   */
  start: (activityId: number) =>
    apiClient.post<ApiResponse<ChatSessionResponse>>(`${BASE}/start`, {
      activityId,
    } satisfies ChatStartRequest),

  /**
   * 发送消息。后端 Agent 解析字段并推动状态机。
   */
  sendMessage: (sessionId: string, content: string) =>
    apiClient.post<ApiResponse<ChatSessionResponse>>(`${BASE}/message`, {
      sessionId,
      content,
    } satisfies ChatMessageRequest),

  /**
   * 确认提交。后端在事务中完成 participationService.signup
   * 并返回 `participationId`，前端据此跳转到「查看报名详情」。
   */
  confirm: (sessionId: string) =>
    apiClient.post<ApiResponse<ChatSessionResponse>>(`${BASE}/confirm`, {
      sessionId,
    } satisfies ChatConfirmRequest),

  /**
   * 拉取当前会话最新快照。用于草稿恢复（不依赖前端持久化的 messages / collectedFields）。
   */
  getSession: (sessionId: string) =>
    apiClient.get<ApiResponse<ChatSessionResponse>>(
      `${BASE}/sessions/${encodeURIComponent(sessionId)}`,
    ),
};
