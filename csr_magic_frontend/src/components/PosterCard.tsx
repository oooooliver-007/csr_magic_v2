import type { PosterRecord } from '../types/poster';

interface PosterCardProps {
  poster: PosterRecord;
  onClick: () => void;
}

export default function PosterCard({ poster, onClick }: PosterCardProps) {
  const formattedDate = new Date(poster.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-left transition-all hover:shadow-md hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/40"
    >
      {/* 缩略图 */}
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
        {poster.posterUrl ? (
          <img
            src={poster.posterUrl}
            alt={poster.activityName ?? '海报'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-3">
        <p className="text-sm font-medium text-[#1A2E22] truncate">
          {poster.activityName ?? '未知活动'}
        </p>
        <p className="text-xs text-[#1A2E22]/50 mt-1">{formattedDate}</p>
      </div>
    </button>
  );
}
