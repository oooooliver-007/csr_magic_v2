import type {
  ChatDraft,
  ChatMessage,
  ChatStage,
  CreateChatSessionResponse,
  SendChatMessageResponse,
} from '../types/chat';
import type { ActivityDetail } from '../types/participation';
import type { FormFieldSchema } from '../types/activity';
import { getFormSchemaByType } from '../constants/templateSchemas';

/**
 * AI 对话报名 API Service
 *
 * 接口契约（见 docs/shared/api-contracts.md）：
 * - POST   /api/v2/chat/sessions                      创建对话会话
 * - POST   /api/v2/chat/sessions/{sessionId}/messages 发送消息
 * - GET    /api/v2/chat/sessions/{sessionId}          获取会话历史
 *
 * TODO(ai-chat-registration/agent-flow)：后端 /api/v2/chat/*
 * 尚未由 Dev-2 实现，当前版本使用本地 Mock 驱动 Agent 流程，
 * 保证前端 UI 与验收项可独立跑通。待后端 + csr_ai_service 接好
 * Qwen 对话后，将本文件中的 MOCK_* 实现替换为 apiClient 真实调用即可，
 * 页面、store、组件层无需修改。
 */

const MESSAGE_DELAY_MS = 400;

function randomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeMessage(
  role: ChatMessage['role'],
  content: string,
  typewriter = role === 'AI',
): ChatMessage {
  return {
    id: randomId('msg'),
    role,
    content,
    createdAt: nowIso(),
    typewriter,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openingFor(activity: ActivityDetail, schema: FormFieldSchema[]): string {
  const fieldsDesc = schema.length
    ? `为了帮你完成报名，我会依次询问以下信息：${schema.map((f) => f.label).join('、')}。`
    : '';
  return (
    `你好 👋 我是 CSR 报名小助手，欢迎参加「${activity.name}」。` +
    fieldsDesc +
    '\n\n你可以随时输入「切换表单」回到传统表单模式。我们开始吧！'
  );
}

function questionFor(field: FormFieldSchema): string {
  switch (field.type) {
    case 'number':
      return `请问${field.label}是多少？（请输入数字）`;
    case 'image':
      return `可以上传${field.label}吗？如暂时不方便，可回复「跳过」。`;
    case 'boolean':
      return `${field.label}？（请回答 是 / 否）`;
    case 'text':
    default:
      return `请问${field.label}是？`;
  }
}

function parseAnswer(field: FormFieldSchema, raw: string): { value: unknown; error?: string } {
  const trimmed = raw.trim();
  if (field.type === 'number') {
    const cleaned = trimmed.replace(/[^\d.\-]/g, '');
    if (!cleaned) {
      return { value: null, error: `${field.label}需要是数字，能否再提供一下？` };
    }
    const num = Number(cleaned);
    if (!Number.isFinite(num)) {
      return { value: null, error: `${field.label}需要是数字，能否再提供一下？` };
    }
    if (field.required && num <= 0) {
      return { value: null, error: `${field.label}需要大于 0，请重新填写。` };
    }
    return { value: num };
  }
  if (field.type === 'boolean') {
    if (/^(是|好|yes|y|true|要)$/i.test(trimmed)) return { value: true };
    if (/^(否|不|no|n|false|不要)$/i.test(trimmed)) return { value: false };
    return { value: null, error: `${field.label}请回答「是」或「否」。` };
  }
  if (field.type === 'image') {
    if (/^(跳过|skip)$/i.test(trimmed)) return { value: null };
    return { value: trimmed };
  }
  if (field.required && !trimmed) {
    return { value: null, error: `${field.label}不能为空，请再告诉我一次。` };
  }
  return { value: trimmed };
}

interface MockSessionState {
  sessionId: string;
  activity: ActivityDetail;
  schema: FormFieldSchema[];
  collectedFields: Record<string, unknown>;
  pendingFieldIdx: number;
  stage: ChatStage;
  messages: ChatMessage[];
}

const MOCK_SESSIONS = new Map<string, MockSessionState>();

function buildSchema(activity: ActivityDetail): FormFieldSchema[] {
  if (activity.templateType === 'CUSTOM' && activity.formSchema) {
    try {
      const parsed = JSON.parse(activity.formSchema) as FormFieldSchema[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return getFormSchemaByType(activity.templateType);
}

function confirmationMessageContent(state: MockSessionState): string {
  const lines = state.schema.map((field) => {
    const val = state.collectedFields[field.name];
    const display =
      val === null || val === undefined || val === ''
        ? '（跳过）'
        : typeof val === 'boolean'
          ? val
            ? '是'
            : '否'
          : String(val);
    return `• ${field.label}：${display}`;
  });
  const header = lines.length
    ? '所有信息都已经记录啦，我帮你整理一下：'
    : '所有信息都已经记录啦。';
  return `${header}${lines.length ? '\n' + lines.join('\n') : ''}\n\n确认无误就可以提交报名啦，有需要调整的内容也可以继续告诉我。`;
}

function advanceAfterAnswer(state: MockSessionState): ChatMessage {
  // 跳过已收集的字段，找下一个未收集的
  while (
    state.pendingFieldIdx < state.schema.length &&
    state.collectedFields[state.schema[state.pendingFieldIdx]!.name] !== undefined
  ) {
    state.pendingFieldIdx += 1;
  }

  if (state.pendingFieldIdx >= state.schema.length) {
    state.stage = 'CONFIRMING';
    return makeMessage('AI', confirmationMessageContent(state));
  }

  const nextField = state.schema[state.pendingFieldIdx]!;
  return makeMessage('AI', questionFor(nextField));
}

export const chatApi = {
  /**
   * 创建对话会话
   * TODO: 接入真实后端 `POST /api/v2/chat/sessions`（body: { activityId }）
   */
  async createSession(activity: ActivityDetail): Promise<CreateChatSessionResponse> {
    const schema = buildSchema(activity);
    const sessionId = randomId('sess');
    const opening = makeMessage('AI', openingFor(activity, schema));

    const state: MockSessionState = {
      sessionId,
      activity,
      schema,
      collectedFields: {},
      pendingFieldIdx: 0,
      stage: schema.length ? 'COLLECTING' : 'CONFIRMING',
      messages: [opening],
    };

    if (!schema.length) {
      const confirm = makeMessage('AI', confirmationMessageContent(state));
      state.messages.push(confirm);
    } else {
      const firstQuestion = makeMessage('AI', questionFor(schema[0]!));
      state.messages.push(firstQuestion);
    }

    MOCK_SESSIONS.set(sessionId, state);

    await delay(MESSAGE_DELAY_MS);
    return {
      sessionId,
      openingMessage: state.messages[0]!,
      schema,
    };
  },

  /**
   * 获取会话快照（当前仅返回消息与已收集字段）
   * TODO: 接入真实后端 `GET /api/v2/chat/sessions/{sessionId}`
   */
  async getSession(sessionId: string): Promise<{
    messages: ChatMessage[];
    collectedFields: Record<string, unknown>;
    stage: ChatStage;
  } | null> {
    await delay(50);
    const state = MOCK_SESSIONS.get(sessionId);
    if (!state) return null;
    return {
      messages: state.messages,
      collectedFields: { ...state.collectedFields },
      stage: state.stage,
    };
  },

  /**
   * 发送用户消息，获取 AI 回复
   * TODO: 接入真实后端 `POST /api/v2/chat/sessions/{sessionId}/messages`
   *       body: { content }，返回 reply + collectedFields + stage
   */
  async sendMessage(sessionId: string, content: string): Promise<SendChatMessageResponse> {
    const state = MOCK_SESSIONS.get(sessionId);
    if (!state) {
      throw new Error('会话不存在或已失效，请重新打开对话');
    }

    await delay(MESSAGE_DELAY_MS);

    const trimmed = content.trim();

    // 已在确认阶段：解析确认/调整指令
    if (state.stage === 'CONFIRMING') {
      if (/^(确认|提交|ok|好|yes)$/i.test(trimmed)) {
        const reply = makeMessage(
          'AI',
          '好的，正在为你提交报名……可以点击下方的「确认提交」按钮完成最后一步。',
        );
        state.messages.push(reply);
        return { reply, collectedFields: { ...state.collectedFields }, stage: state.stage };
      }
      const reply = makeMessage(
        'AI',
        '如果想调整信息，可以直接告诉我要改哪个字段，或点击下方按钮「继续修改」。',
      );
      state.messages.push(reply);
      return { reply, collectedFields: { ...state.collectedFields }, stage: state.stage };
    }

    // 收集阶段：将回答写入 collectedFields，再继续下一个字段
    const field = state.schema[state.pendingFieldIdx];
    if (!field) {
      state.stage = 'CONFIRMING';
      const reply = makeMessage('AI', confirmationMessageContent(state));
      state.messages.push(reply);
      return { reply, collectedFields: { ...state.collectedFields }, stage: state.stage };
    }

    const { value, error } = parseAnswer(field, trimmed);
    if (error) {
      const reply = makeMessage('AI', error);
      state.messages.push(reply);
      return { reply, collectedFields: { ...state.collectedFields }, stage: state.stage };
    }

    state.collectedFields[field.name] = value;
    state.pendingFieldIdx += 1;

    const reply = advanceAfterAnswer(state);
    state.messages.push(reply);

    return {
      reply,
      collectedFields: { ...state.collectedFields },
      stage: state.stage,
    };
  },

  /**
   * 在 Agent 完成字段收集后，最终提交报名。
   * 内部复用 `/api/v2/participations/signup`，不新增后端端点。
   */
  finalizeSessionAsDraft(sessionId: string, draft: ChatDraft): void {
    const state = MOCK_SESSIONS.get(sessionId);
    if (!state) return;
    state.collectedFields = { ...draft.collectedFields };
    state.messages = [...draft.messages];
    state.stage = draft.stage;
  },
};
