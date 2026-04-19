import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { activityApi } from '../services/activityApi';
import { participationApi } from '../services/participationApi';
import type { ActivityDetail } from '../types/participation';
import ActivityInfo from '../components/ActivityInfo';
import ParticipationStatus from '../components/ParticipationStatus';
import SignupForm from '../components/SignupForm';

/**
 * 员工端活动详情页
 * 遵循 UI 原型：全宽封面图 + 左侧详情 + 右侧粘性报名卡 + 移动端底部固定操作栏
 */
export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [showResubmitForm, setShowResubmitForm] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchActivity = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const response = await activityApi.getById(Number(id));
      setActivity(response.data.data);
    } catch {
      setError('加载活动详情失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleSignup = async (formData: Record<string, unknown>) => {
    if (!activity) return;
    try {
      const participation = activity.currentUserParticipation;
      if (showResubmitForm && participation && participation.state === 'REJECTED') {
        await participationApi.resubmit(participation.id, JSON.stringify(formData));
        setShowResubmitForm(false);
        await fetchActivity();
        showToast('success', '重新提交成功，请等待审核');
      } else {
        await participationApi.signup({
          activityId: activity.id,
          formData: JSON.stringify(formData),
        });
        await fetchActivity();
        showToast('success', '报名提交成功，请等待审核');
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      throw new Error(message);
    }
  };

  const handleWithdraw = async () => {
    if (!activity?.currentUserParticipation) return;
    const confirmed = window.confirm('确认退出该活动吗？仅待审核状态可退出。');
    if (!confirmed) return;
    try {
      setWithdrawing(true);
      await participationApi.withdraw(activity.currentUserParticipation.id);
      await fetchActivity();
      showToast('success', '退出活动成功');
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
      showToast('error', message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  if (error && !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={() => navigate('/activities')}
          className="px-4 py-2 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90 transition-colors"
        >
          返回活动列表
        </button>
      </div>
    );
  }

  if (!activity) return null;

  const isEnded = activity.status === 'ENDED';
  const participation = activity.currentUserParticipation;
  const hasParticipation = participation !== null;
  const isFull = activity.maxParticipants !== null &&
    activity.currentParticipants >= activity.maxParticipants;
  const showSignupForm = (!hasParticipation && !isEnded) ||
    (showResubmitForm && participation?.state === 'REJECTED');

  return (
    <div className="pb-24 md:pb-0">
      {/* 全宽封面图（圆角底边） */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 mb-8 relative h-64 md:h-96">
        {activity.coverImage ? (
          <img
            src={activity.coverImage}
            alt={activity.name}
            className="w-full h-full object-cover rounded-b-3xl shadow-sm"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#2EB87A] to-[#249663] rounded-b-3xl shadow-sm flex items-center justify-center">
            <span className="text-white/60 text-lg">暂无封面</span>
          </div>
        )}
        <button
          onClick={() => navigate('/activities')}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <ChevronRight className="w-6 h-6 rotate-180 text-[#1A2E22]" />
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}

      {toast && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-[#2EB87A]/10 text-[#2EB87A]' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* 左侧：活动详情信息 */}
        <ActivityInfo activity={activity} />

        {/* 右侧：粘性报名卡（仅桌面端） */}
        <div className="hidden md:block w-96 shrink-0">
          <div className="sticky top-24 bg-white p-6 rounded-2xl border border-gray-100 shadow-md">
            <RegistrationCard
              activity={activity}
              participation={participation}
              hasParticipation={hasParticipation}
              isEnded={isEnded}
              isFull={isFull}
              showSignupForm={showSignupForm}
              showResubmitForm={showResubmitForm}
              withdrawing={withdrawing}
              onSignup={handleSignup}
              onWithdraw={handleWithdraw}
              onResubmit={() => setShowResubmitForm(true)}
              onNavigateChat={() => navigate(`/activities/${activity.id}/chat`)}
            />
          </div>
        </div>
      </div>

      {/* 移动端底部固定操作栏 */}
      <MobileBottomBar
        hasParticipation={hasParticipation}
        isEnded={isEnded}
        isFull={isFull}
        onNavigateChat={() => navigate(`/activities/${activity.id}/chat`)}
      />
    </div>
  );
}

interface RegistrationCardProps {
  activity: ActivityDetail;
  participation: ActivityDetail['currentUserParticipation'];
  hasParticipation: boolean;
  isEnded: boolean;
  isFull: boolean;
  showSignupForm: boolean;
  showResubmitForm: boolean;
  withdrawing: boolean;
  onSignup: (formData: Record<string, unknown>) => Promise<void>;
  onWithdraw: () => void;
  onResubmit: () => void;
  onNavigateChat: () => void;
}

function RegistrationCard({
  activity,
  participation,
  hasParticipation,
  isEnded,
  isFull,
  showSignupForm,
  showResubmitForm,
  withdrawing,
  onSignup,
  onWithdraw,
  onResubmit,
  onNavigateChat,
}: RegistrationCardProps) {
  if (isEnded) {
    return (
      <div className="text-center py-4">
        <p className="text-[#1A2E22]/60 font-medium">活动已结束</p>
        {hasParticipation && participation && (
          <div className="mt-4">
            <ParticipationStatus
              participation={participation}
              onWithdraw={onWithdraw}
              onResubmit={onResubmit}
              withdrawing={withdrawing}
              activityEnded
            />
          </div>
        )}
      </div>
    );
  }

  if (hasParticipation && participation && !showResubmitForm) {
    return (
      <div>
        <h3 className="text-xl font-bold mb-4">报名状态</h3>
        <ParticipationStatus
          participation={participation}
          onWithdraw={onWithdraw}
          onResubmit={onResubmit}
          withdrawing={withdrawing}
          activityEnded={false}
        />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-2">
        {showResubmitForm ? '重新提交报名' : '立即报名'}
      </h3>
      {isFull && !showSignupForm ? (
        <p className="text-red-500 text-sm mb-4">名额已满</p>
      ) : (
        <>
          {activity.maxParticipants !== null && (
            <p className="text-[#1A2E22]/60 text-sm mb-6">
              剩余 {Math.max(0, activity.maxParticipants - activity.currentParticipants)} 个名额
            </p>
          )}
        </>
      )}

      {showSignupForm && (
        <div className="mb-6">
          <SignupForm
            templateType={activity.templateType}
            formSchemaJson={activity.formSchema}
            onSubmit={onSignup}
            disabled={isFull}
          />
        </div>
      )}

      {!showSignupForm && !isFull && (
        <p className="text-[#1A2E22]/60 text-sm mb-6">准备好了吗？</p>
      )}

      <div className="space-y-3">
        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-[#1A2E22]/40 text-xs uppercase font-bold">Or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <button
          onClick={onNavigateChat}
          className="w-full bg-white text-[#2EB87A] border-2 border-[#2EB87A] py-3.5 rounded-xl font-bold hover:bg-[#2EB87A]/5 transition-colors flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          AI 对话报名 ✨
        </button>
      </div>
    </div>
  );
}

interface MobileBottomBarProps {
  hasParticipation: boolean;
  isEnded: boolean;
  isFull: boolean;
  onNavigateChat: () => void;
}

function MobileBottomBar({
  hasParticipation,
  isEnded,
  isFull,
  onNavigateChat,
}: MobileBottomBarProps) {
  if (isEnded) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <p className="text-center text-[#1A2E22]/60 font-medium py-2">活动已结束</p>
      </div>
    );
  }

  if (hasParticipation) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <p className="text-center text-[#2EB87A] font-bold py-2">✅ 已报名</p>
      </div>
    );
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 z-40 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <button
        disabled={isFull}
        className="flex-1 bg-[#2EB87A] text-white py-3.5 rounded-xl font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }}
      >
        {isFull ? '名额已满' : '报名'}
      </button>
      <button
        onClick={onNavigateChat}
        className="flex-1 bg-white text-[#2EB87A] border-2 border-[#2EB87A] py-3.5 rounded-xl font-bold flex items-center justify-center gap-1.5"
      >
        <MessageSquare className="w-4 h-4" />
        AI 对话 ✨
      </button>
    </div>
  );
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr.response?.data?.message ?? '操作失败';
  }
  return '操作失败';
}
