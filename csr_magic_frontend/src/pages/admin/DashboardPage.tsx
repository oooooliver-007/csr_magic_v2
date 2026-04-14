import { useState, useEffect } from 'react';
import { dashboardApi } from '../../services/dashboardApi';
import { activityApi } from '../../services/activityApi';
import StatCards from '../../components/dashboard/StatCards';
import TrendChart from '../../components/dashboard/TrendChart';
import DistributionChart from '../../components/dashboard/DistributionChart';
import TopParticipantsList from '../../components/dashboard/TopParticipantsList';
import RecentActivities from '../../components/dashboard/RecentActivities';
import type { DashboardStats, TrendItem, DistributionItem, TopParticipantItem } from '../../types/dashboard';
import type { Activity } from '../../types/activity';

/** 骨架屏 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 统计卡片骨架 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 h-32" />
        ))}
      </div>
      {/* 图表骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-96" />
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-96" />
      </div>
      {/* 底部区域骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-72" />
        <div className="bg-white p-6 rounded-2xl border border-gray-100 h-72" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);
  const [topParticipants, setTopParticipants] = useState<TopParticipantItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [statsRes, trendsRes, distRes, topRes, activitiesRes] = await Promise.all([
          dashboardApi.getStats(),
          dashboardApi.getTrends(),
          dashboardApi.getDistribution(),
          dashboardApi.getTopParticipants(),
          activityApi.list({ status: 'ONGOING', size: 5 }),
        ]);

        setStats(statsRes.data.data);
        setTrends(trendsRes.data.data);
        setDistribution(distRes.data.data);
        setTopParticipants(topRes.data.data);
        setRecentActivities(activitiesRes.data.data.content);
      } catch (error) {
        console.error('获取看板数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">数据看板</h1>
      </div>

      {/* 统计卡片 */}
      {stats && <StatCards stats={stats} />}

      {/* 图表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TrendChart data={trends} />
        <DistributionChart data={distribution} />
      </div>

      {/* 底部区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TopParticipantsList data={topParticipants} />
        <RecentActivities data={recentActivities} />
      </div>
    </div>
  );
}
