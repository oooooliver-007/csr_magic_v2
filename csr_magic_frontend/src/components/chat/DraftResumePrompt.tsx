interface DraftResumePromptProps {
  onResume: () => void;
  onRestart: () => void;
}

/**
 * 入页检测到 sessionStorage 草稿时展示的「继续 / 重新开始」横幅
 */
export default function DraftResumePrompt({ onResume, onRestart }: DraftResumePromptProps) {
  return (
    <div
      role="dialog"
      aria-label="恢复草稿"
      className="mb-4 bg-[#FFB347]/10 border border-[#FFB347]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
    >
      <div className="text-sm text-[#1A2E22]">上次对话未完成，是否继续？</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-[#1A2E22] hover:bg-white"
        >
          重新开始
        </button>
        <button
          type="button"
          onClick={onResume}
          className="px-3 py-1.5 rounded-xl bg-[#2EB87A] text-white text-sm font-bold hover:bg-[#2EB87A]/90"
        >
          继续
        </button>
      </div>
    </div>
  );
}
