import { create } from 'zustand';
import type {
  ChatDraft,
  ChatMessage,
  ChatSession,
  ChatStage,
} from '../types/chat';
import type { ActivityDetail } from '../types/participation';
import { chatApi } from '../services/chatApi';

/**
 * AI 对话报名 — 会话状态（Zustand）
 *
 * 该 store 只负责 *当前页面* 持有的单条对话会话：
 * - 消息历史（含打字机动画标记）
 * - 已收集字段 + 阶段
 * - 错误与发送中状态
 *
 * 草稿持久化通过 `sessionStorage`（见 `draftStorageKey()`），
 * 跨页面导航 / 误关浏览器后可恢复。
 */

export interface ChatStoreState extends ChatSession {
  loading: boolean;
  sending: boolean;
  error: string | null;
}

interface ChatStoreActions {
  reset: () => void;
  setSession: (session: ChatSession) => void;
  setError: (error: string | null) => void;
  startSession: (activity: ActivityDetail) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  appendMessage: (message: ChatMessage) => void;
  markTypewriterDone: (messageId: string) => void;
  setStage: (stage: ChatStage) => void;
  updateCollectedFields: (patch: Record<string, unknown>) => void;
  loadFromDraft: (draft: ChatDraft, activity: ActivityDetail) => void;
}

const INITIAL_STATE: ChatStoreState = {
  sessionId: '',
  activityId: 0,
  templateType: 'BASIC',
  schema: [],
  messages: [],
  collectedFields: {},
  stage: 'COLLECTING',
  loading: false,
  sending: false,
  error: null,
};

export const useChatStore = create<ChatStoreState & ChatStoreActions>((set, get) => ({
  ...INITIAL_STATE,

  reset: () => set({ ...INITIAL_STATE }),

  setSession: (session) =>
    set({
      ...session,
      loading: false,
      sending: false,
      error: null,
    }),

  setError: (error) => set({ error }),

  startSession: async (activity) => {
    set({ loading: true, error: null });
    try {
      const response = await chatApi.createSession(activity);
      // 创建后立即 getSession 拿到完整 messages（含首个问题）
      const snapshot = await chatApi.getSession(response.sessionId);
      set({
        sessionId: response.sessionId,
        activityId: activity.id,
        templateType: activity.templateType,
        schema: response.schema,
        messages: snapshot?.messages ?? [response.openingMessage],
        collectedFields: snapshot?.collectedFields ?? {},
        stage: snapshot?.stage ?? 'COLLECTING',
        loading: false,
        sending: false,
        error: null,
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : '创建对话会话失败，请重试',
      });
    }
  },

  sendMessage: async (content) => {
    const { sessionId, sending } = get();
    if (!sessionId || sending || !content.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role: 'USER',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      sending: true,
      error: null,
    }));

    try {
      const response = await chatApi.sendMessage(sessionId, content.trim());
      set((state) => ({
        messages: [...state.messages, response.reply],
        collectedFields: response.collectedFields,
        stage: response.stage,
        sending: false,
      }));
    } catch (err) {
      set({
        sending: false,
        error: err instanceof Error ? err.message : '网络异常，请重试',
      });
    }
  },

  appendMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  markTypewriterDone: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, typewriter: false } : m,
      ),
    })),

  setStage: (stage) => set({ stage }),

  updateCollectedFields: (patch) =>
    set((state) => ({
      collectedFields: { ...state.collectedFields, ...patch },
    })),

  loadFromDraft: (draft, activity) => {
    chatApi.finalizeSessionAsDraft(draft.sessionId, draft);
    set({
      sessionId: draft.sessionId,
      activityId: activity.id,
      templateType: activity.templateType,
      schema:
        activity.templateType === 'CUSTOM' && activity.formSchema
          ? safeParseSchema(activity.formSchema)
          : get().schema,
      messages: draft.messages.map((m) => ({ ...m, typewriter: false })),
      collectedFields: draft.collectedFields,
      stage: draft.stage,
      loading: false,
      sending: false,
      error: null,
    });
  },
}));

function safeParseSchema(json: string): ChatStoreState['schema'] {
  try {
    const parsed = JSON.parse(json) as ChatStoreState['schema'];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
