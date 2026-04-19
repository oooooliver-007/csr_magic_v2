import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearChatDraft,
  draftStorageKey,
  loadChatDraft,
  saveChatDraft,
} from './chatDraftStorage';

describe('chatDraftStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('key 格式为 chat_draft_{activityId}_{userId}', () => {
    expect(draftStorageKey(10, 20)).toBe('chat_draft_10_20');
  });

  it('未登录（userId 为 null / undefined / 0）时抛错，避免草稿串用户', () => {
    expect(() => draftStorageKey(10, null)).toThrow();
    expect(() => draftStorageKey(10, undefined)).toThrow();
    expect(() => draftStorageKey(10, 0)).toThrow();
  });

  it('非法 activityId 抛错', () => {
    expect(() => draftStorageKey(0, 1)).toThrow();
    expect(() => draftStorageKey(Number.NaN, 1)).toThrow();
  });

  it('保存后可以读取同样的草稿（只含 sessionId）', () => {
    saveChatDraft(1, 2, 'sess_abc');
    const draft = loadChatDraft(1, 2);
    expect(draft).not.toBeNull();
    expect(draft?.sessionId).toBe('sess_abc');
    expect(draft?.activityId).toBe(1);
    expect(draft?.updatedAt).toBeTruthy();
  });

  it('activityId 不匹配时返回 null', () => {
    saveChatDraft(1, 2, 'sess_abc');
    expect(loadChatDraft(999, 2)).toBeNull();
  });

  it('clearChatDraft 可清空草稿', () => {
    saveChatDraft(1, 2, 'sess_abc');
    clearChatDraft(1, 2);
    expect(loadChatDraft(1, 2)).toBeNull();
  });

  it('损坏的 JSON 返回 null 不抛错', () => {
    sessionStorage.setItem(draftStorageKey(1, 2), '{invalid json');
    expect(loadChatDraft(1, 2)).toBeNull();
  });
});
