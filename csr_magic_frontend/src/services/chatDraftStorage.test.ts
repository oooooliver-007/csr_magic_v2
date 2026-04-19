import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearChatDraft,
  draftStorageKey,
  loadChatDraft,
  saveChatDraft,
} from './chatDraftStorage';
import type { ChatMessage } from '../types/chat';

const sampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'AI',
    content: 'hi',
    createdAt: '2026-04-19T00:00:00Z',
  },
];

describe('chatDraftStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('key 格式为 chat_draft_{activityId}_{userId}', () => {
    expect(draftStorageKey(10, 20)).toBe('chat_draft_10_20');
    expect(draftStorageKey(10, null)).toBe('chat_draft_10_0');
  });

  it('保存后可以读取同样的草稿', () => {
    saveChatDraft(1, 2, {
      sessionId: 's1',
      messages: sampleMessages,
      collectedFields: { amount: 100 },
      stage: 'COLLECTING',
    });
    const draft = loadChatDraft(1, 2);
    expect(draft).not.toBeNull();
    expect(draft?.sessionId).toBe('s1');
    expect(draft?.messages).toHaveLength(1);
    expect(draft?.collectedFields.amount).toBe(100);
    expect(draft?.stage).toBe('COLLECTING');
    expect(draft?.updatedAt).toBeTruthy();
  });

  it('activityId 不匹配时返回 null', () => {
    saveChatDraft(1, 2, {
      sessionId: 's1',
      messages: sampleMessages,
      collectedFields: {},
      stage: 'COLLECTING',
    });
    expect(loadChatDraft(999, 2)).toBeNull();
  });

  it('clearChatDraft 可清空草稿', () => {
    saveChatDraft(1, 2, {
      sessionId: 's1',
      messages: sampleMessages,
      collectedFields: {},
      stage: 'COLLECTING',
    });
    clearChatDraft(1, 2);
    expect(loadChatDraft(1, 2)).toBeNull();
  });

  it('损坏的 JSON 返回 null 不抛错', () => {
    sessionStorage.setItem(draftStorageKey(1, 2), '{invalid json');
    expect(loadChatDraft(1, 2)).toBeNull();
  });
});
