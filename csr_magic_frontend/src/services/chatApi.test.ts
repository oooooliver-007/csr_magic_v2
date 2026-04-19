import { describe, it, expect } from 'vitest';
import { chatApi } from './chatApi';
import type { ActivityDetail } from '../types/participation';

function mockActivity(overrides: Partial<ActivityDetail> = {}): ActivityDetail {
  return {
    id: 1,
    eventId: 10,
    eventName: '2026 春季 CSR',
    name: '植树活动',
    description: '种一棵小树',
    templateType: 'DONATION',
    startTime: '2026-05-01T00:00:00Z',
    endTime: '2026-05-02T00:00:00Z',
    maxParticipants: 30,
    coverImage: null,
    status: 'UPCOMING',
    formSchema: null,
    currentParticipants: 5,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: null,
    currentUserParticipation: null,
    ...overrides,
  };
}

describe('chatApi (mock implementation)', () => {
  it('createSession 返回开场白 + 第一个字段问题', async () => {
    const activity = mockActivity();
    const res = await chatApi.createSession(activity);
    expect(res.sessionId).toMatch(/^sess_/);
    expect(res.schema.length).toBeGreaterThan(0);
    const snapshot = await chatApi.getSession(res.sessionId);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.messages.length).toBeGreaterThanOrEqual(2);
    expect(snapshot?.stage).toBe('COLLECTING');
  });

  it('sendMessage 依次收集字段并进入 CONFIRMING', async () => {
    const activity = mockActivity();
    const { sessionId } = await chatApi.createSession(activity);

    // DONATION schema: amount(number, required) + message(text, optional)
    const r1 = await chatApi.sendMessage(sessionId, '100');
    expect(r1.collectedFields.amount).toBe(100);
    expect(r1.stage).toBe('COLLECTING');

    const r2 = await chatApi.sendMessage(sessionId, '加油');
    expect(r2.collectedFields.message).toBe('加油');
    expect(r2.stage).toBe('CONFIRMING');
  });

  it('数字字段解析错误时给出重试提示，不推进阶段', async () => {
    const activity = mockActivity();
    const { sessionId } = await chatApi.createSession(activity);
    const res = await chatApi.sendMessage(sessionId, 'abc');
    expect(res.stage).toBe('COLLECTING');
    expect(res.reply.content).toContain('数字');
  });

  it('无 schema 的活动直接进入 CONFIRMING', async () => {
    const activity = mockActivity({ templateType: 'CUSTOM', formSchema: '[]' });
    const { sessionId } = await chatApi.createSession(activity);
    const snapshot = await chatApi.getSession(sessionId);
    expect(snapshot?.stage).toBe('CONFIRMING');
  });

  it('无效 sessionId 发送消息抛错', async () => {
    await expect(chatApi.sendMessage('not_exist', '你好')).rejects.toThrow();
  });
});
