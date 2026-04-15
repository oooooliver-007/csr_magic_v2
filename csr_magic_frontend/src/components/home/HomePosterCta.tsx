import { Sparkles } from 'lucide-react';

interface HomePosterCtaProps {
  onNavigate: () => void;
}

export default function HomePosterCta({ onNavigate }: HomePosterCtaProps) {
  return (
    <>
      <div className="hidden md:flex flex-col justify-center">
        <div className="bg-gradient-to-br from-[#2EB87A]/20 to-[#FFB347]/20 rounded-2xl p-8 text-center border border-white shadow-sm">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Sparkles className="w-8 h-8 text-[#FFB347]" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-[#1A2E22]">分享你的影响力</h3>
          <p className="text-[#1A2E22]/70 mb-6 text-sm leading-relaxed">
            生成一张专属 CSR 海报，展示你的参与成果与公益足迹。
          </p>
          <button
            type="button"
            onClick={onNavigate}
            className="w-full bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            去我的海报
          </button>
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40">
        <button
          type="button"
          onClick={onNavigate}
          className="w-full bg-gradient-to-r from-[#2EB87A] to-[#249663] text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          去我的海报
        </button>
      </div>
    </>
  );
}
