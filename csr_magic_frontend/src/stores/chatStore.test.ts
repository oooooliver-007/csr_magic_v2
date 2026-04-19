import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/chatApi', () => {
  return {
    chatApi: {
      start: vi.fn(),
      sendMessage: vi.fn(),
      confirm: vi.fn(),
      getSession: vi.fn(),
    },
  };
});

import { useChatStore } from './chatStore';
import { chatApi } from '../services/chatApi';

const mockedStart = chatApi.start as unknown as ReturnType<typeof vi.fn>;
const mockedSend = chatApi.sendMessage as unknown as ReturnType<typeof vi.fn>;
const mockedConfirm = chatApi.confirm as unknown as ReturnType<typeof vi.fn>;
const mockedGetSession = chatApi.getSession as unknown as ReturnType<typeof vi.fn>;

function okResponse<T>(data: T) {
  return { data: { code: 0, message: 'ok', data } };
}

describe('chatStore', () => {
  beforeEach(() => {
    useChatStore.getState().reset();
    mockedStart.mockReset();
    mockedSend.mockReset();
    mockedConfirm.mockReset();
    mockedGetSession.mockReset();
  });

  it('startSession 将后端返回 messages/collectedFields/stage 同步到 store', async () => {
    mockedStart.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '欢迎',
        status: 'COLLECTING',
        collectedFields: { amount: 100 },
        complete: false,
        messages: [
          { role: 'assistant', content: '欢迎' },
          { role: 'assistant', content: '请输入金额' },
        ],
      }),
    );

    await useChatStore.getState().startSession(42);

    const st = useChatStore.getState();
    expect(st.sessionId).toBe('sess_1');
    expect(st.activityId).toBe(42);
    expect(st.messages).toHaveLength(2);
    expect(st.messages.every((m) => m.role === 'AI')).toBe(true);
    // 最后一条 AI 启用打字机
    expect(st.messages[st.messages.length - 1]?.typewriter).toBe(true);
    expect(st.collectedFields).toEqual({ amount: 100 });
    expect(st.stage).toBe('COLLECTING');
    expect(st.loading).toBe(false);
  });

  it('sendMessage 重入保护：sending 中再次调用会被丢弃', async () => {
    // 先让 sessionId 就绪
    mockedStart.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '',
        status: 'COLLECTING',
        collectedFields: {},
        complete: false,
        messages: [],
      }),
    );
    await useChatStore.getState().startSession(42);

    let resolveFirst: (v: unknown) => void = () => undefined;
    mockedSend.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    );

    const first = useChatStore.getState().sendMessage('你好');
    // 此时 sending=true，第二次调用应直接 return，不触发 chatApi.sendMessage
    const second = useChatStore.getState().sendMessage('再次');
    await second;
    expect(mockedSend).toHaveBeenCalledTimes(1);

    resolveFirst(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '好的',
        status: 'CONFIRMING',
        collectedFields: { field: 'v' },
        complete: true,
        messages: [],
      }),
    );
    await first;

    const st = useChatStore.getState();
    expect(st.sending).toBe(false);
    expect(st.stage).toBe('CONFIRMING');
    // 只追加了 1 条用户消息 + 1 条 AI 回复（第二次被丢弃）
    const userMsgs = st.messages.filter((m) => m.role === 'USER');
    expect(userMsgs).toHaveLength(1);
    expect(userMsgs[0]?.content).toBe('你好');
  });

  it('confirmSubmit 返回 participationId 并进入 COMPLETED', async () => {
    mockedStart.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '',
        status: 'CONFIRMING',
        collectedFields: {},
        complete: true,
        messages: [],
      }),
    );
    await useChatStore.getState().startSession(42);

    mockedConfirm.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '已提交',
        status: 'COMPLETED',
        collectedFields: {},
        complete: true,
        messages: [],
        participationId: 777,
      }),
    );

    const pid = await useChatStore.getState().confirmSubmit();
    expect(pid).toBe(777);

    const st = useChatStore.getState();
    expect(st.stage).toBe('COMPLETED');
    expect(st.participationId).toBe(777);
    expect(st.submitting).toBe(false);
  });

  it('resumeSession 从 GET /sessions/{id} 拉回完整状态', async () => {
    mockedGetSession.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_x',
        activityId: 10,
        reply: '',
        status: 'COLLECTING',
        collectedFields: { amount: 5 },
        complete: false,
        messages: [
          { role: 'user', content: '5' },
          { role: 'assistant', content: '还需要姓名' },
        ],
      }),
    );

    await useChatStore.getState().resumeSession('sess_x');
    const st = useChatStore.getState();
    expect(mockedGetSession).toHaveBeenCalledWith('sess_x');
    expect(st.sessionId).toBe('sess_x');
    expect(st.messages).toHaveLength(2);
    // resume 不应给最后一条 AI 启用打字机（回看历史场景）
    expect(st.messages.some((m) => m.typewriter)).toBe(false);
    expect(st.collectedFields).toEqual({ amount: 5 });
  });

  it('confirmSubmit 在 sending 中丢弃', async () => {
    mockedStart.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '',
        status: 'CONFIRMING',
        collectedFields: {},
        complete: true,
        messages: [],
      }),
    );
    await useChatStore.getState().startSession(42);

    useChatStore.setState({ sending: true });
    const pid = await useChatStore.getState().confirmSubmit();
    expect(pid).toBeNull();
    expect(mockedConfirm).not.toHaveBeenCalled();
  });
});
