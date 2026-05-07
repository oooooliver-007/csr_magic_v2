import { describe, it, expect, vi, beforeEach } from 'vitest';

// 先 mock 再 import，避免 apiClient 真实发请求
vi.mock('./apiClient', () => {
  const post = vi.fn();
  const get = vi.fn();
  return {
    default: { post, get },
  };
});

import { chatApi } from './chatApi';
import apiClient from './apiClient';

const mockedPost = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>;

function okResponse<T>(data: T) {
  return { data: { code: 0, message: 'ok', data } };
}

describe('chatApi', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedGet.mockReset();
  });

  it('start 以 { activityId } POST /api/v2/chat/start', async () => {
    mockedPost.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: 'hi',
        status: 'COLLECTING',
        collectedFields: {},
        complete: false,
        messages: [],
      }),
    );

    const res = await chatApi.start(42);

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost.mock.calls[0]?.[0]).toBe('/api/v2/chat/start');
    expect(mockedPost.mock.calls[0]?.[1]).toEqual({ activityId: 42 });
    expect(res.data.data.sessionId).toBe('sess_1');
  });

  it('sendMessage 以 { sessionId, content } POST /api/v2/chat/message', async () => {
    mockedPost.mockResolvedValueOnce(
      okResponse({
        sessionId: 'sess_1',
        activityId: 42,
        reply: '好的',
        status: 'CONFIRMING',
        collectedFields: { amount: 100 },
        complete: true,
        messages: [],
      }),
    );

    await chatApi.sendMessage('sess_1', '100');

    expect(mockedPost).toHaveBeenCalledWith('/api/v2/chat/message', {
      sessionId: 'sess_1',
      content: '100',
    });
  });

  it('confirm 以 { sessionId } POST /api/v2/chat/confirm', async () => {
    mockedPost.mockResolvedValueOnce(
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

    const res = await chatApi.confirm('sess_1');

    expect(mockedPost).toHaveBeenCalledWith('/api/v2/chat/confirm', {
      sessionId: 'sess_1',
    });
    expect(res.data.data.participationId).toBe(777);
  });

  it('getSession 以 GET /api/v2/chat/sessions/{sessionId} 获取会话', async () => {
    mockedGet.mockResolvedValueOnce(
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

    await chatApi.getSession('sess/1?x=1');

    // 对 sessionId 做了 encodeURIComponent，避免特殊字符
    expect(mockedGet).toHaveBeenCalledWith(
      '/api/v2/chat/sessions/sess%2F1%3Fx%3D1',
    );
  });
});
