import { create } from 'zustand';
import type {
  ChatMessage,
  ChatServerMessage,
  ChatSessionResponse,
  ChatStage,
} from '../types/chat';
import { chatApi } from '../services/chatApi';

/**
 * AI 对话报名 — 当前页面会话状态（Zustand）
 *
 * store 不再持有任何 schema。前端消息历史与 collectedFields 完全由后端
 * `/api/v2/chat/*` 响应驱动：
 * - `startSession(activityId)`  →  POST /chat/start
 * - `resumeSession(sessionId)`  →  GET  /chat/sessions/{sessionId}
 * - `sendMessage(content)`      →  POST /chat/message
 * - `confirmSubmit()`           →  POST /chat/confirm
 *
 * `sending` / `submitting` 做重入保护：在途请求未完成时丢弃新请求。
 */

export interface ChatStoreState {
  sessionId: string;
  activityId: number;
  messages: ChatMessage[];
  collectedFields: Record<string, unknown>;
  stage: ChatStage;
  participationId: number | null;
  loading: boolean;
  sending: boolean;
  submitting: boolean;
  error: string | null;
}

interface ChatStoreActions {
  reset: () => void;
  setError: (error: string | null) => void;
  markTypewriterDone: (messageId: string) => void;
  startSession: (activityId: number) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  confirmSubmit: () => Promise<number | null>;
}

const INITIAL_STATE: ChatStoreState = {
  sessionId: '',
  activityId: 0,
  messages: [],
  collectedFields: {},
  stage: 'COLLECTING',
  participationId: null,
  loading: false,
  sending: false,
  submitting: false,
  error: null,
};

let msgCounter = 0;
function clientMessageId(): string {
  msgCounter += 1;
  return `msg_${Date.now()}_${msgCounter}`;
}

function mapRole(role: string): ChatMessage['role'] {
  const lower = role.toLowerCase();
  if (lower === 'user') return 'USER';
  if (lower === 'assistant' || lower === 'ai') return 'AI';
  return 'SYSTEM';
}

/** 将后端 messages[] 规范化为前端渲染消息；最末一条 AI 消息默认带打字机动画 */
function hydrateMessages(
  serverMessages: ChatServerMessage[],
  options: { animateLastAi: boolean },
): ChatMessage[] {
  const now = Date.now();
  const mapped: ChatMessage[] = serverMessages.map((m, idx) => ({
    id: `srv_${now}_${idx}`,
    role: mapRole(m.role),
    content: m.content,
    createdAt: new Date(now + idx).toISOString(),
    typewriter: false,
  }));
  if (options.animateLastAi) {
    for (let i = mapped.length - 1; i >= 0; i -= 1) {
      const msg = mapped[i];
      if (msg && msg.role === 'AI') {
        mapped[i] = { ...msg, typewriter: true };
        break;
      }
    }
  }
  return mapped;
}

function applySessionResponse(
  state: ChatStoreState,
  data: ChatSessionResponse,
  options: { animateLastAi: boolean },
): Partial<ChatStoreState> {
  return {
    sessionId: data.sessionId,
    activityId: data.activityId,
    messages: hydrateMessages(data.messages, options),
    collectedFields: data.collectedFields ?? {},
    stage: data.status,
    participationId: data.participationId ?? state.participationId,
    error: null,
  };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybeAxios = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    if (maybeAxios.response?.data?.message) return maybeAxios.response.data.message;
    if (typeof maybeAxios.message === 'string') return maybeAxios.message;
  }
  return fallback;
}

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set, get) => ({
  ...INITIAL_STATE,

  reset: () => set({ ...INITIAL_STATE }),

  setError: (error) => set({ error }),

  markTypewriterDone: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, typewriter: false } : m,
      ),
    })),

  startSession: async (activityId) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const response = await chatApi.start(activityId);
      const data = response.data.data;
      set((state) => ({
        ...applySessionResponse(state, data, { animateLastAi: true }),
        loading: false,
        sending: false,
        submitting: false,
        participationId: data.participationId ?? null,
      }));
    } catch (err) {
      set({
        loading: false,
        error: extractErrorMessage(err, '创建对话会话失败，请重试'),
      });
    }
  },

  resumeSession: async (sessionId) => {
    if (!sessionId || get().loading) return;
    set({ loading: true, error: null });
    try {
      const response = await chatApi.getSession(sessionId);
      const data = response.data.data;
      set((state) => ({
        ...applySessionResponse(state, data, { animateLastAi: false }),
        loading: false,
        sending: false,
        submitting: false,
        participationId: data.participationId ?? null,
      }));
    } catch (err) {
      set({
        loading: false,
        error: extractErrorMessage(err, '恢复对话失败，请重新开始'),
      });
    }
  },

  sendMessage: async (content) => {
    const trimmed = content.trim();
    const { sessionId, sending, submitting, stage } = get();
    // 重入保护：sending / submitting 中丢弃新请求，避免并发写入后端 Agent
    if (!sessionId || !trimmed || sending || submitting) return;
    if (stage === 'COMPLETED' || stage === 'ERROR') return;

    const userMessage: ChatMessage = {
      id: clientMessageId(),
      role: 'USER',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      sending: true,
      error: null,
    }));

    try {
      const response = await chatApi.sendMessage(sessionId, trimmed);
      const data = response.data.data;
      const aiReply: ChatMessage = {
        id: clientMessageId(),
        role: 'AI',
        content: data.reply,
        createdAt: new Date().toISOString(),
        typewriter: true,
      };
      set((state) => ({
        messages: [...state.messages, aiReply],
        collectedFields: data.collectedFields ?? state.collectedFields,
        stage: data.status,
        participationId: data.participationId ?? state.participationId,
        sending: false,
      }));
    } catch (err) {
      set({
        sending: false,
        error: extractErrorMessage(err, '网络异常，请重试'),
      });
    }
  },

  confirmSubmit: async () => {
    const { sessionId, submitting, sending } = get();
    if (!sessionId || submitting || sending) return null;
    set({ submitting: true, error: null });
    try {
      const response = await chatApi.confirm(sessionId);
      const data = response.data.data;
      set((state) => ({
        ...applySessionResponse(state, data, { animateLastAi: false }),
        stage: data.status,
        participationId: data.participationId ?? null,
        submitting: false,
      }));
      return data.participationId ?? null;
    } catch (err) {
      set({
        submitting: false,
        error: extractErrorMessage(err, '提交失败，请稍后重试'),
      });
      return null;
    }
  },
}));
