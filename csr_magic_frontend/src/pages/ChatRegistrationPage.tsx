import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import { useAuthStore } from '../stores/authStore';
import { useChatRegistration } from '../hooks/useChatRegistration';
import ActivityInfoCard from '../components/chat/ActivityInfoCard';
import ChatWindow from '../components/chat/ChatWindow';
import ChatInput from '../components/chat/ChatInput';
import ChatHeader from '../components/chat/ChatHeader';
import ChatFooter from '../components/chat/ChatFooter';
import DraftResumePrompt from '../components/chat/DraftResumePrompt';

/**
 * AI 对话报名页
 * - 路由：/activities/:id/chat
 * - 左侧：活动信息卡（移动端顶部折叠）
 * - 右侧：全屏对话窗口（header + 消息列表 + footer + 输入框，flex 纵向布局）
 *
 * 对照 docs/modules/ai-chat-registration/spec-chat-ui.md 验收标准实现。
 * 编排逻辑抽到 `useChatRegistration`，本组件只做视图拼装。
 */
export default function ChatRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? null;
  const activityIdNum = id ? Number(id) : NaN;

  const {
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
  } = useChatRegistration({ activityId: activityIdNum, userId });

  const messages = useChatStore((s) => s.messages);
  const collectedFields = useChatStore((s) => s.collectedFields);
  const stage = useChatStore((s) => s.stage);
  const sending = useChatStore((s) => s.sending);
  const submitting = useChatStore((s) => s.submitting);
  const chatError = useChatStore((s) => s.error);
  const markTypewriterDone = useChatStore((s) => s.markTypewriterDone);

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

  const footer = (
    <ChatFooter
      stage={stage}
      submitted={submitted}
      submitting={submitting}
      error={chatError}
      schema={schema}
      collectedFields={collectedFields}
      activityName={activity.name}
      onConfirm={handleConfirmSubmit}
      onEdit={handleContinueEdit}
      onViewDetail={handleViewDetail}
      onBackHome={handleBackHome}
    />
  );

  const inputDisabled = submitted || stage === 'COMPLETED';

  return (
    <div className="pb-6 flex flex-col min-h-[calc(100vh-120px)]">
      {showResumePrompt && (
        <DraftResumePrompt onResume={handleResume} onRestart={handleRestart} />
      )}

      <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
        {/* 左侧（桌面）/顶部（移动）：活动信息卡 */}
        <div className="w-full md:w-[300px] md:shrink-0">
          <ActivityInfoCard activity={activity} schema={schema} />
        </div>

        {/* 右侧：对话窗口（flex 纵向，避免硬编码高度） */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[480px]">
          <ChatHeader
            activityName={activity.name}
            onBack={handleBack}
            onSwitchToForm={handleSwitchToForm}
          />
          <ChatWindow
            messages={messages}
            footer={footer}
            onTypewriterDone={markTypewriterDone}
          />
          <ChatInput
            onSend={handleSend}
            sending={sending}
            disabled={inputDisabled}
          />
        </div>
      </div>
    </div>
  );
}
