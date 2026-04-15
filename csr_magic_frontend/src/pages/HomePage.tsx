import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut } from 'lucide-react';
import ContributionStats from '../components/ContributionStats';
import HomePosterCta from '../components/home/HomePosterCta';
import HomeRecentTimeline from '../components/home/HomeRecentTimeline';
import HomeRecommendedActivities from '../components/home/HomeRecommendedActivities';
import { activityApi } from '../services/activityApi';
import { participationApi } from '../services/participationApi';
import { useAuthStore } from '../stores/authStore';
import type { Activity } from '../types/activity';
import type { MyParticipation } from '../types/participation';

const statusPriority: Record<Activity['status'], number> = {
  ONGOING: 0,
  UPCOMING: 1,
  ENDED: 2,
};

function getRecommendedActivities(activities: Activity[]): Activity[] {
  return activities
    .filter((activity) => activity.status !== 'ENDED')
    .sort((a, b) => {
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }

      const aTime = a.startTime ? new Date(a.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.startTime ? new Date(b.startTime).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 3);
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [recommendedActivities, setRecommendedActivities] = useState<Activity[]>([]);
  const [recentParticipations, setRecentParticipations] = useState<MyParticipation[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const fetchRecommendedActivities = useCallback(async () => {
    setActivityLoading(true);
    setActivityError(null);
    try {
      const response = await activityApi.list({ page: 0, size: 12 });
      setRecommendedActivities(getRecommendedActivities(response.data.data.content));
    } catch {
      setActivityError('加载推荐活动失败，请稍后重试');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchRecentParticipations = useCallback(async () => {
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const response = await participationApi.getMyParticipations({ page: 0, size: 5 });
      setRecentParticipations(response.data.data.content);
    } catch {
      setTimelineError('加载最近参与记录失败，请稍后重试');
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRecommendedActivities();
    void fetchRecentParticipations();
  }, [fetchRecommendedActivities, fetchRecentParticipations]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A2E22]">Hi，{user.displayName || user.username} 👋</h1>
            <p className="mt-3 text-sm md:text-base text-[#1A2E22]/60">
              快速查看你的 CSR 动态、近期活动和参与进展。
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-[#1A2E22]/70 hover:border-red-200 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
        <ContributionStats />
      </section>

      <HomeRecommendedActivities
        activities={recommendedActivities}
        loading={activityLoading}
        error={activityError}
        onRetry={() => {
          void fetchRecommendedActivities();
        }}
        onViewAll={() => navigate('/activities')}
      />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <HomeRecentTimeline
          records={recentParticipations}
          loading={timelineLoading}
          error={timelineError}
          onRetry={() => {
            void fetchRecentParticipations();
          }}
        />
        <HomePosterCta onNavigate={() => navigate('/my?tab=posters')} />
      </section>
    </div>
  );
}
