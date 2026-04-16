import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { posterApi } from '../services/posterApi';
import type { PosterRecord } from '../types/poster';
import PosterCard from './PosterCard';
import PosterLightbox from './PosterLightbox';

interface PosterGalleryProps {
  refreshKey?: number;
}

export default function PosterGallery({ refreshKey }: PosterGalleryProps) {
  const navigate = useNavigate();
  const [posters, setPosters] = useState<PosterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoster, setSelectedPoster] = useState<PosterRecord | null>(null);

  // 分页
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 12;

  const fetchPosters = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await posterApi.getMyPosters({ page: pageNum, size: pageSize });
      const data = res.data.data;
      setPosters(data.content.filter((p) => p.status === 'COMPLETED' && p.posterUrl));
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        '获取海报列表失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosters(0);
  }, [fetchPosters, refreshKey]);

  if (loading && posters.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-red-500 text-sm">{error}</p>
        <button
          onClick={() => fetchPosters(page)}
          className="px-4 py-2 bg-[#2EB87A] text-white rounded-xl text-sm font-medium hover:bg-[#2EB87A]/90 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  // 空状态
  if (posters.length === 0) {
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

  return (
    <div>
      {/* 卡片网格：桌面 3-4 列，移动端 2 列 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posters.map((poster) => (
          <PosterCard
            key={poster.id}
            poster={poster}
            onClick={() => setSelectedPoster(poster)}
          />
        ))}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => fetchPosters(page - 1)}
            disabled={page === 0}
            className="p-2 rounded-xl border border-gray-200 text-[#1A2E22]/60 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-[#1A2E22]/60">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => fetchPosters(page + 1)}
            disabled={page >= totalPages - 1}
            className="p-2 rounded-xl border border-gray-200 text-[#1A2E22]/60 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox */}
      {selectedPoster && (
        <PosterLightbox
          poster={selectedPoster}
          onClose={() => setSelectedPoster(null)}
        />
      )}
    </div>
  );
}
