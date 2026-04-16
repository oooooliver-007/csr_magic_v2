import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';
import type { PosterRecord } from '../types/poster';

interface PosterLightboxProps {
  poster: PosterRecord;
  onClose: () => void;
}

export default function PosterLightbox({ poster, onClose }: PosterLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    if (!poster.posterUrl) return;
    const link = document.createElement('a');
    link.href = poster.posterUrl;
    link.download = `csr-poster-${poster.id}.png`;
    link.target = '_blank';
    link.click();
  };

  const formattedDate = new Date(poster.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-lightbox-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-[#1A2E22]/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 内容 */}
      <div className="relative z-10 max-w-3xl w-full mx-4 animate-lightbox-scale-in">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors"
          aria-label="关闭"
        >
          <X className="w-6 h-6" />
        </button>

        {/* 海报大图 */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {poster.posterUrl && (
            <img
              src={poster.posterUrl}
              alt={poster.activityName ?? '海报'}
              className="w-full max-h-[70vh] object-contain bg-gray-50"
            />
          )}

          {/* 底部信息栏 */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-[#1A2E22]">
                {poster.activityName ?? '未知活动'}
              </p>
              <p className="text-xs text-[#1A2E22]/50 mt-0.5">{formattedDate}</p>
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#2EB87A] text-white rounded-xl text-sm font-medium hover:bg-[#2EB87A]/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              下载
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
