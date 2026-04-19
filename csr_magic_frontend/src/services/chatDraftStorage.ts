import type { ChatDraft, ChatMessage, ChatStage } from '../types/chat';

/**
 * sessionStorage 草稿工具
 *
 * key 格式：chat_draft_{activityId}_{userId}
 * 仅保存必要字段，重进页面时可恢复对话进度。
 */

const KEY_PREFIX = 'chat_draft_';

export function draftStorageKey(activityId: number, userId: number | null | undefined): string {
  const uid = userId ?? 0;
  return `${KEY_PREFIX}${activityId}_${uid}`;
}

export function loadChatDraft(
  activityId: number,
  userId: number | null | undefined,
): ChatDraft | null {
  try {
    const raw = sessionStorage.getItem(draftStorageKey(activityId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatDraft;
    if (!parsed || parsed.activityId !== activityId || !Array.isArray(parsed.messages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveChatDraft(
  activityId: number,
  userId: number | null | undefined,
  payload: {
    sessionId: string;
    messages: ChatMessage[];
    collectedFields: Record<string, unknown>;
    stage: ChatStage;
  },
): void {
  const draft: ChatDraft = {
    sessionId: payload.sessionId,
    activityId,
    messages: payload.messages,
    collectedFields: payload.collectedFields,
    stage: payload.stage,
    updatedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(draftStorageKey(activityId, userId), JSON.stringify(draft));
  } catch {
    // 忽略配额错误；草稿丢失不阻塞主流程
  }
}

export function clearChatDraft(activityId: number, userId: number | null | undefined): void {
  try {
    sessionStorage.removeItem(draftStorageKey(activityId, userId));
  } catch {
    // ignore
  }
}
