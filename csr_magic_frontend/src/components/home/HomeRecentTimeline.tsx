import { Check, ClipboardList, XCircle } from 'lucide-react';
import ActivityBadge from '../ActivityBadge';
import type { MyParticipation } from '../../types/participation';

interface HomeRecentTimelineProps {
  records: MyParticipation[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function getStateText(state: MyParticipation['state']): string {
  switch (state) {
    case 'APPROVED':
      return '已通过';
    case 'REJECTED':
      return '已驳回';
    case 'RE_SUBMITTED':
      return '已重提';
    case 'PENDING':
    default:
      return '待审核';
  }
}

function getStatePill(state: MyParticipation['state']): string {
  switch (state) {
    case 'APPROVED':
      return 'bg-[#2EB87A]/10 text-[#2EB87A]';
    case 'REJECTED':
      return 'bg-red-50 text-red-600';
    case 'RE_SUBMITTED':
      return 'bg-blue-50 text-blue-600';
    case 'PENDING':
    default:
      return 'bg-[#FFB347]/15 text-[#C47A00]';
  }
}

function getStateIcon(state: MyParticipation['state']) {
  switch (state) {
    case 'APPROVED':
      return <Check className="w-4 h-4 text-[#2EB87A]" />;
    case 'REJECTED':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'RE_SUBMITTED':
      return <ClipboardList className="w-4 h-4 text-blue-600" />;
    case 'PENDING':
    default:
      return <ClipboardList className="w-4 h-4 text-[#FFB347]" />;
  }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function HomeRecentTimeline({ records, loading, error, onRetry }: HomeRecentTimelineProps) {
  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-[#1A2E22]">最近参与</h2>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-h-[320px]">
        {loading && (
          <div className="space-y-6 animate-pulse">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-[#2EB87A] hover:underline"
            >
              重新加载
            </button>
          </div>
        )}

        {!loading && !error && records.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <div className="w-12 h-12 rounded-full bg-[#F7FAF8] flex items-center justify-center mb-4">
              <ClipboardList className="w-6 h-6 text-[#1A2E22]/40" />
            </div>
            <h3 className="text-lg font-bold text-[#1A2E22] mb-2">还没有参与记录</h3>
            <p className="text-sm text-[#1A2E22]/60">去活动列表挑选一个感兴趣的公益活动吧。</p>
          </div>
        )}

        {!loading && !error && records.length > 0 && (
          <div className="space-y-6">
            {records.map((item, index) => (
              <div key={item.id} className="flex gap-4 relative">
                {index !== records.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100" />
                )}
                <div className="w-10 h-10 rounded-full bg-[#F7FAF8] flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm">
                  {getStateIcon(item.state)}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2">
                        <ActivityBadge templateType={item.templateType} />
                      </div>
                      <h4 className="font-bold text-[#1A2E22]">{item.activityName}</h4>
                      <p className="text-sm text-[#1A2E22]/60 mt-1">参与时间：{formatDate(item.createdAt)}</p>
                    </div>
                    <span className={`text-sm font-bold px-2 py-1 rounded-lg self-start ${getStatePill(item.state)}`}>
                      {getStateText(item.state)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
