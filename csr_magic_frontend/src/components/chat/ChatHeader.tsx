import { ArrowLeft, Sparkles } from 'lucide-react';

interface ChatHeaderProps {
  activityName: string;
  onBack: () => void;
  onSwitchToForm: () => void;
}

/**
 * 对话窗口顶部栏：返回、标题、切换表单模式
 */
export default function ChatHeader({ activityName, onBack, onSwitchToForm }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onBack}
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
          <p className="text-xs text-[#1A2E22]/60 truncate">{activityName}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSwitchToForm}
        className="text-xs text-[#1A2E22]/60 hover:text-[#2EB87A] underline underline-offset-2 shrink-0"
      >
        切换表单模式
      </button>
    </div>
  );
}
