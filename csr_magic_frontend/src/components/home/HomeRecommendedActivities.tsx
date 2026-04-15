import ActivityCard from '../ActivityCard';
import type { Activity } from '../../types/activity';

interface HomeRecommendedActivitiesProps {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onViewAll: () => void;
}

export default function HomeRecommendedActivities({
  activities,
  loading,
  error,
  onRetry,
  onViewAll,
}: HomeRecommendedActivitiesProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1A2E22]">推荐活动</h2>
          <p className="mt-2 text-sm text-[#1A2E22]/60">优先展示进行中和即将开始的活动。</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-[#2EB87A] font-medium hover:underline hidden md:block"
        >
          查看全部
        </button>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
              <div className="h-48 bg-gray-200" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-10 bg-gray-200 rounded-xl mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
          <button type="button" onClick={onRetry} className="ml-3 underline font-medium">
            重试
          </button>
        </div>
      )}

      {!loading && !error && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {!loading && !error && activities.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-5xl mb-4">🌿</div>
          <h3 className="text-xl font-bold text-[#1A2E22]/70 mb-2">暂无推荐活动</h3>
          <p className="text-[#1A2E22]/50 text-sm">活动上线后会优先出现在这里</p>
        </div>
      )}
    </section>
  );
}
