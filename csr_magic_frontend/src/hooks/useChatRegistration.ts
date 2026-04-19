import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityApi } from '../services/activityApi';
import { useChatStore } from '../stores/chatStore';
import {
  clearChatDraft,
  loadChatDraft,
  saveChatDraft,
} from '../services/chatDraftStorage';
import { getFormSchemaByType } from '../constants/templateSchemas';
import type { ActivityDetail } from '../types/participation';
import type { FormFieldSchema } from '../types/activity';

interface UseChatRegistrationOptions {
  activityId: number;
  userId: number | null;
}

interface UseChatRegistrationResult {
  activity: ActivityDetail | null;
  loadingActivity: boolean;
  loadError: string | null;
  schema: FormFieldSchema[];
  showResumePrompt: boolean;
  submitted: boolean;
  handleResume: () => void;
  handleRestart: () => void;
  handleSend: (content: string) => void;
  handleConfirmSubmit: () => void;
  handleContinueEdit: () => void;
  handleSwitchToForm: () => void;
  handleBack: () => void;
  handleViewDetail: () => void;
  handleBackHome: () => void;
}

/**
 * AI 对话报名页的编排 hook
 *
 * 职责：
 * - 按 activityId 加载活动详情；
 * - 检测 sessionStorage 草稿并决定是「新建会话」还是「恢复对话」；
 * - 对外暴露一组 handler，页面组件仅负责视图编排；
 * - 草稿仅保存 sessionId，重入时调 `chatStore.resumeSession` 从后端拉回状态；
 * - 未登录（`userId == null`）时不触碰 sessionStorage，避免草稿串用户。
 */
export function useChatRegistration({
  activityId,
  userId,
}: UseChatRegistrationOptions): UseChatRegistrationResult {
  const navigate = useNavigate();
  const {
    sessionId,
    messages,
    stage,
    participationId,
    startSession,
    resumeSession,
    sendMessage,
    confirmSubmit,
    reset,
  } = useChatStore();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const hasUser = userId !== null && Number.isFinite(userId) && userId > 0;

  // 初始加载 & 草稿检测（仅运行一次）
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    if (!Number.isFinite(activityId) || activityId <= 0) {
      setLoadError('活动 ID 无效');
      setLoadingActivity(false);
      return;
    }
    initRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const response = await activityApi.getById(activityId);
        if (cancelled) return;
        const data = response.data.data;
        setActivity(data);

        if (!hasUser) {
          // 未登录：不读草稿，直接启动新会话（后端会拒绝；前端统一走 loadError 分支）
          await startSession(activityId);
          return;
        }

        const draft = loadChatDraft(activityId, userId);
        if (draft && draft.sessionId) {
          setShowResumePrompt(true);
        } else {
          await startSession(activityId);
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
  }, [activityId, userId, hasUser, startSession]);

  // 组件卸载时 reset store，避免下次进入残留
  useEffect(() => () => reset(), [reset]);

  // 草稿自动保存（仅保存 sessionId）；COMPLETED / submitted 时不再写盘
  useEffect(() => {
    if (!activity || !sessionId || submitted) return;
    if (stage === 'COMPLETED') return;
    if (!hasUser) return;
    saveChatDraft(activity.id, userId, sessionId);
  }, [activity, sessionId, messages, stage, userId, hasUser, submitted]);

  // 由活动模板推导展示用 schema（仅用于 ActivityInfoCard / ConfirmationCard 左侧摘要）
  const schema: FormFieldSchema[] = useMemo(() => {
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
  }, [activity]);

  const handleResume = useCallback(() => {
    if (!activity || !hasUser) return;
    const draft = loadChatDraft(activity.id, userId);
    setShowResumePrompt(false);
    if (!draft) {
      void startSession(activity.id);
      return;
    }
    void resumeSession(draft.sessionId);
  }, [activity, userId, hasUser, resumeSession, startSession]);

  const handleRestart = useCallback(() => {
    if (!activity) return;
    if (hasUser) clearChatDraft(activity.id, userId);
    setShowResumePrompt(false);
    void startSession(activity.id);
  }, [activity, userId, hasUser, startSession]);

  const handleSend = useCallback(
    (content: string) => {
      if (!activity) return;
      void sendMessage(content);
    },
    [activity, sendMessage],
  );

  const handleConfirmSubmit = useCallback(() => {
    if (!activity) return;
    void (async () => {
      const pid = await confirmSubmit();
      if (pid !== null) {
        if (hasUser) clearChatDraft(activity.id, userId);
        setSubmitted(true);
      }
    })();
  }, [activity, userId, hasUser, confirmSubmit]);

  const handleContinueEdit = useCallback(() => {
    // 用户要继续补充时，向后端发一条「修改」意图，由后端切回 COLLECTING
    void sendMessage('修改');
  }, [sendMessage]);

  const handleSwitchToForm = useCallback(() => {
    if (!activity) return;
    navigate(`/activities/${activity.id}`);
  }, [activity, navigate]);

  const handleBack = useCallback(() => {
    if (!activity) return;
    navigate(`/activities/${activity.id}`);
  }, [activity, navigate]);

  const handleViewDetail = useCallback(() => {
    if (!activity) return;
    if (participationId) {
      navigate(`/participations/${participationId}`);
    } else {
      navigate(`/activities/${activity.id}`);
    }
  }, [activity, participationId, navigate]);

  const handleBackHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  return {
    activity,
    loadingActivity,
    loadError,
    schema,
    showResumePrompt,
    submitted,
    handleResume,
    handleRestart,
    handleSend,
    handleConfirmSubmit,
    handleContinueEdit,
    handleSwitchToForm,
    handleBack,
    handleViewDetail,
    handleBackHome,
  };
}
