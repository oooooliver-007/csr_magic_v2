import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyPosterGallery() {
  const navigate = useNavigate();

  // ai-poster 模块尚未实现，展示空态 + CTA 入口
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6">
      <div className="w-20 h-20 bg-gradient-to-br from-[#2EB87A]/20 to-[#FFB347]/20 rounded-2xl flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-[#FFB347]" />
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-[#1A2E22] mb-2">暂无海报</h3>
        <p className="text-[#1A2E22]/60 text-sm max-w-xs leading-relaxed">
          生成一张精美的 AI 海报，分享你的 CSR 旅程吧！
        </p>
      </div>
      <button
        onClick={() => navigate('/poster')}
        className="bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        去生成海报
      </button>
    </div>
  );
}
