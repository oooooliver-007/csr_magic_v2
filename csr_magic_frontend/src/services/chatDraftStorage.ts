import type { ChatDraft } from '../types/chat';

/**
 * sessionStorage 草稿工具
 *
 * key 格式：chat_draft_{activityId}_{userId}
 *
 * 仅保存 `sessionId`（以及 activityId / updatedAt 校验字段）。
 * 具体的 messages / collectedFields / status 由重入时调 `GET /chat/sessions/{id}`
 * 从后端拉回，避免前端落盘状态与后端漂移。
 */

const KEY_PREFIX = 'chat_draft_';

function assertValidUserId(userId: number | null | undefined): asserts userId is number {
  if (userId === null || userId === undefined || !Number.isFinite(userId) || userId <= 0) {
    throw new Error('chat draft storage requires an authenticated user id');
  }
}

export function draftStorageKey(activityId: number, userId: number | null | undefined): string {
  assertValidUserId(userId);
  if (!Number.isFinite(activityId) || activityId <= 0) {
    throw new Error('chat draft storage requires a valid activityId');
  }
  return `${KEY_PREFIX}${activityId}_${userId}`;
}

export function loadChatDraft(
  activityId: number,
  userId: number | null | undefined,
): ChatDraft | null {
  const key = draftStorageKey(activityId, userId);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatDraft>;
    if (
      !parsed ||
      typeof parsed.sessionId !== 'string' ||
      parsed.activityId !== activityId ||
      !parsed.sessionId.length
    ) {
      return null;
    }
    return {
      sessionId: parsed.sessionId,
      activityId,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveChatDraft(
  activityId: number,
  userId: number | null | undefined,
  sessionId: string,
): void {
  const key = draftStorageKey(activityId, userId);
  const draft: ChatDraft = {
    sessionId,
    activityId,
    updatedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // 忽略配额错误；草稿丢失不阻塞主流程
  }
}

export function clearChatDraft(
  activityId: number,
  userId: number | null | undefined,
): void {
  const key = draftStorageKey(activityId, userId);
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}
