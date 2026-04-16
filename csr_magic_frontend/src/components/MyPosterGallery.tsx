import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import PosterGallery from './PosterGallery';

export default function MyPosterGallery() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* 标题栏 + 快捷入口 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#1A2E22]">我的海报</h3>
        <button
          onClick={() => navigate('/poster')}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white rounded-xl text-sm font-medium hover:shadow-md hover:scale-[1.02] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          去生成海报
        </button>
      </div>

      <PosterGallery />
    </div>
  );
}
