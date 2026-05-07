import { CheckCircle2, ArrowRight } from 'lucide-react';

interface SuccessCardProps {
  activityName: string;
  onViewDetail: () => void;
  onBackHome?: () => void;
}

/**
 * Agent 报名成功卡片
 * - 绿色 CheckCircle + 提示文案
 * - 「查看报名详情」跳转活动详情页
 */
export default function SuccessCard({ activityName, onViewDetail, onBackHome }: SuccessCardProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border-2 border-[#2EB87A] shadow-sm p-6 text-center space-y-4">
      <div className="w-14 h-14 mx-auto bg-[#2EB87A]/10 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-[#2EB87A]" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[#1A2E22]">报名提交成功</h3>
        <p className="text-sm text-[#1A2E22]/70 mt-1">
          你已成功提交「{activityName}」的报名信息，请等待管理员审核。
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={onViewDetail}
          className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] text-white font-bold hover:bg-[#2EB87A]/90 transition-colors flex items-center justify-center gap-2"
        >
          查看报名详情
          <ArrowRight className="w-4 h-4" />
        </button>
        {onBackHome && (
          <button
            type="button"
            onClick={onBackHome}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[#1A2E22] font-medium hover:bg-gray-50 transition-colors"
          >
            返回首页
          </button>
        )}
      </div>
    </div>
  );
}
