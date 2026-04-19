import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { activityApi } from '../services/activityApi';
import { participationApi } from '../services/participationApi';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import {
  clearChatDraft,
  loadChatDraft,
  saveChatDraft,
} from '../services/chatDraftStorage';
import { getFormSchemaByType } from '../constants/templateSchemas';
import type { ActivityDetail } from '../types/participation';
import type { FormFieldSchema } from '../types/activity';
import ActivityInfoCard from '../components/chat/ActivityInfoCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import ConfirmationCard from '../components/chat/ConfirmationCard';
import SuccessCard from '../components/chat/SuccessCard';

/**
 * AI 对话报名页
 * - 路由：/activities/:id/chat
 * - 左侧：活动信息卡（移动端顶部折叠）
 * - 右侧：全屏对话窗口
 *
 * 对照 docs/modules/ai-chat-registration/spec-chat-ui.md 验收标准实现。
 */
export default function ChatRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;

  const activityIdNum = id ? Number(id) : NaN;

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    sessionId,
    schema,
    messages,
    collectedFields,
    stage,
    sending,
    error: chatError,
    startSession,
    sendMessage,
    markTypewriterDone,
    setStage,
    loadFromDraft,
    reset,
  } = useChatStore();

  // 初始加载活动详情；同时检测草稿
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (!Number.isFinite(activityIdNum)) {
      setLoadError('活动 ID 无效');
      setLoadingActivity(false);
      return;
    }
    initRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const response = await activityApi.getById(activityIdNum);
        if (cancelled) return;
        const data = response.data.data;
        setActivity(data);

        const draft = loadChatDraft(activityIdNum, userId);
        if (draft && draft.messages.length > 0 && draft.stage !== 'SUBMITTED') {
          setShowResumePrompt(true);
        } else {
          await startSession(data);
        }
      } catch {
        if (!cancelled) setLoadError('加载活动详情失败');
      } finally {
        if (!cancelled) setLoadingActivity(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activityIdNum, userId, startSession]);

  // 组件卸载时 reset store，避免下一次进入时残留
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // 草稿自动保存（对话状态变更时写回 sessionStorage）
  useEffect(() => {
    if (!activity || !sessionId || submitted) return;
    if (stage === 'SUBMITTED') return;
    saveChatDraft(activity.id, userId, {
      sessionId,
      messages,
      collectedFields,
      stage,
    });
  }, [activity, sessionId, messages, collectedFields, stage, userId, submitted]);

  const derivedSchema: FormFieldSchema[] = useMemo(() => {
    if (schema.length) return schema;
    if (!activity) return [];
    if (activity.templateType === 'CUSTOM' && activity.formSchema) {
      try {
        const parsed = JSON.parse(activity.formSchema) as FormFieldSchema[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return getFormSchemaByType(activity.templateType);
  }, [schema, activity]);

  const handleResume = useCallback(() => {
    if (!activity) return;
    const draft = loadChatDraft(activity.id, userId);
    if (!draft) {
      setShowResumePrompt(false);
      void startSession(activity);
      return;
    }
    loadFromDraft(draft, activity);
    setShowResumePrompt(false);
  }, [activity, userId, loadFromDraft, startSession]);

  const handleRestart = useCallback(() => {
    if (!activity) return;
    clearChatDraft(activity.id, userId);
    setShowResumePrompt(false);
    void startSession(activity);
  }, [activity, userId, startSession]);

  const handleSend = useCallback(
    (content: string) => {
      if (!activity) return;
      void sendMessage(content);
    },
    [activity, sendMessage],
  );

  const handleSwitchToForm = useCallback(() => {
    if (!activity) return;
    // 跳转前保留已收集信息到 sessionStorage（key 与对话草稿不同，避免污染）
    try {
      sessionStorage.setItem(
        `chat_to_form_${activity.id}`,
        JSON.stringify(collectedFields),
      );
    } catch {
      // ignore
    }
    navigate(`/activities/${activity.id}`);
  }, [activity, collectedFields, navigate]);

  const handleConfirmSubmit = useCallback(async () => {
    if (!activity) return;
    setSubmitting(true);
    try {
      await participationApi.signup({
        activityId: activity.id,
        formData: JSON.stringify(collectedFields),
      });
      setStage('SUBMITTED');
      setSubmitted(true);
      clearChatDraft(activity.id, userId);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
            '提交失败，请稍后重试')
          : '提交失败，请稍后重试';
      useChatStore.setState({ error: message });
    } finally {
      setSubmitting(false);
    }
  }, [activity, collectedFields, userId, setStage]);

  const handleContinueEdit = useCallback(() => {
    setStage('COLLECTING');
  }, [setStage]);

  if (loadingActivity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  if (loadError || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">{loadError ?? '活动不存在'}</p>
        <button
          type="button"
          onClick={() => navigate('/activities')}
          className="px-4 py-2 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90"
        >
          返回活动列表
        </button>
      </div>
    );
  }

  const footer = (() => {
    if (submitted) {
      return (
        <SuccessCard
          activityName={activity.name}
          onViewDetail={() => navigate(`/activities/${activity.id}`)}
          onBackHome={() => navigate('/')}
        />
      );
    }
    if (stage === 'CONFIRMING') {
      return (
        <ConfirmationCard
          schema={derivedSchema}
          collectedFields={collectedFields}
          onConfirm={handleConfirmSubmit}
          onEdit={handleContinueEdit}
          submitting={submitting}
        />
      );
    }
    if (chatError) {
      return (
        <div
          role="alert"
          className="max-w-md mx-auto flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{chatError}</span>
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="pb-6">
      {/* 草稿恢复提示 */}
      {showResumePrompt && (
        <div
          role="dialog"
          aria-label="恢复草稿"
          className="mb-4 bg-[#FFB347]/10 border border-[#FFB347]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
        >
          <div className="text-sm text-[#1A2E22]">
            上次对话未完成，是否继续？
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRestart}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-[#1A2E22] hover:bg-white"
            >
              重新开始
            </button>
            <button
              type="button"
              onClick={handleResume}
              className="px-3 py-1.5 rounded-xl bg-[#2EB87A] text-white text-sm font-bold hover:bg-[#2EB87A]/90"
            >
              继续
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* 左侧（桌面）/顶部（移动）：活动信息卡 */}
        <div className="w-full md:w-[300px] md:shrink-0">
          <ActivityInfoCard activity={activity} schema={derivedSchema} />
        </div>

        {/* 右侧：对话窗口 */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[480px]">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(`/activities/${activity.id}`)}
                aria-label="返回活动详情"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-[#1A2E22]" />
              </button>
              <div className="min-w-0">
                <h1 className="font-bold text-[#1A2E22] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2EB87A] shrink-0" />
                  AI 对话报名
                </h1>
                <p className="text-xs text-[#1A2E22]/60 truncate">{activity.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchToForm}
              className="text-sm text-[#2EB87A] hover:underline shrink-0"
            >
              切换表单模式
            </button>
          </div>

          <ChatWindow
            messages={messages}
            footer={footer}
            onTypewriterDone={markTypewriterDone}
          />

          <ChatInput
            onSend={handleSend}
            sending={sending}
            disabled={submitted || stage === 'SUBMITTED'}
            placeholder={
              submitted || stage === 'SUBMITTED'
                ? '报名已提交'
                : stage === 'CONFIRMING'
                  ? '输入「确认」提交，或直接调整字段'
                  : '输入消息，Enter 发送（Shift+Enter 换行）'
            }
          />
        </div>
      </div>
    </div>
  );
}
