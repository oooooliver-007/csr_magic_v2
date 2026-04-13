import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import type { Participation } from '../types/participation';

interface ParticipationStatusProps {
  participation: Participation;
  onWithdraw: () => void;
  onResubmit: () => void;
  withdrawing: boolean;
  activityEnded: boolean;
}

const STATE_CONFIG: Record<string, { icon: React.ReactNode; label: string; bgClass: string; textClass: string }> = {
  PENDING: {
    icon: <Clock className="w-5 h-5 text-yellow-600" />,
    label: '审核中',
    bgClass: 'bg-yellow-50 border-yellow-200',
    textClass: 'text-yellow-700',
  },
  APPROVED: {
    icon: <CheckCircle className="w-5 h-5 text-[#2EB87A]" />,
    label: '已通过',
    bgClass: 'bg-[#2EB87A]/5 border-[#2EB87A]/20',
    textClass: 'text-[#2EB87A]',
  },
  REJECTED: {
    icon: <XCircle className="w-5 h-5 text-red-500" />,
    label: '已驳回',
    bgClass: 'bg-red-50 border-red-200',
    textClass: 'text-red-600',
  },
  RE_SUBMITTED: {
    icon: <AlertTriangle className="w-5 h-5 text-blue-500" />,
    label: '已重新提交',
    bgClass: 'bg-blue-50 border-blue-200',
    textClass: 'text-blue-600',
  },
};

/**
 * 当前用户参与状态展示组件
 * 展示已报名状态、驳回原因，提供退出和重新提交入口
 */
export default function ParticipationStatus({
  participation,
  onWithdraw,
  onResubmit,
  withdrawing,
  activityEnded,
}: ParticipationStatusProps) {
  const defaultConfig = { icon: <Clock className="w-5 h-5 text-yellow-600" />, label: '审核中', bgClass: 'bg-yellow-50 border-yellow-200', textClass: 'text-yellow-700' };
  const config = STATE_CONFIG[participation.state] ?? defaultConfig;

  return (
    <div className={`p-5 rounded-2xl border ${config.bgClass} space-y-4`}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <p className={`font-bold ${config.textClass}`}>{config.label}</p>
          <p className="text-sm text-[#1A2E22]/60">
            报名时间：{new Date(participation.createdAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </div>

      {/* 驳回原因 */}
      {participation.state === 'REJECTED' && participation.rejectReason && (
        <div className="bg-white p-3 rounded-xl text-sm text-red-600">
          <span className="font-medium">驳回原因：</span>
          {participation.rejectReason}
        </div>
      )}

      {/* 已提交的表单数据（只读展示） */}
      {participation.formData && (
        <FormDataDisplay formData={participation.formData} />
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        {participation.state === 'REJECTED' && !activityEnded && (
          <button
            onClick={onResubmit}
            className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90 transition-colors text-sm"
          >
            修改后重新提交
          </button>
        )}
        {!activityEnded && (
          <button
            onClick={onWithdraw}
            disabled={withdrawing}
            className="flex-1 py-2.5 rounded-xl bg-white border border-red-300 text-red-500 font-medium hover:bg-red-50 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawing ? '退出中...' : '退出活动'}
          </button>
        )}
      </div>
    </div>
  );
}

function FormDataDisplay({ formData }: { formData: string }) {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(formData) as Record<string, unknown>;
  } catch {
    return null;
  }

  const entries = Object.entries(parsed).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );

  if (entries.length === 0) return null;

  return (
    <div className="bg-white p-3 rounded-xl space-y-2">
      <p className="text-xs font-medium text-[#1A2E22]/40 uppercase">已提交信息</p>
      {entries.map(([key, value]) => (
        <div key={key} className="flex justify-between text-sm">
          <span className="text-[#1A2E22]/60">{key}</span>
          <span className="font-medium text-[#1A2E22]">
            {Array.isArray(value) ? `${value.length} 项` : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
