import { useState, useEffect } from 'react';
import { userApi } from '../services/userApi';
import type { MyStatsResponse } from '../types/user';

export default function ContributionStats() {
  const [stats, setStats] = useState<MyStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await userApi.getMyStats();
        setStats(res.data.data);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '获取统计数据失败';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-10 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-2xl text-red-600 text-sm">
        {error}
      </div>
    );
  }

  const cards = [
    { label: '参与活动数', value: stats?.activityCount ?? 0, unit: '' },
    { label: '累计志愿时长', value: Math.round(stats?.volunteerHours ?? 0), unit: 'h' },
    { label: '累计捐赠总额', value: `¥${(stats?.totalDonation ?? 0).toFixed(0)}`, unit: '' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, i) => (
        <div
          key={i}
          className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 ${
            i === 2 ? 'col-span-2 md:col-span-1' : ''
          }`}
        >
          <p className="text-[#1A2E22]/60 font-medium mb-2">{card.label}</p>
          <p className="text-4xl font-bold text-[#2EB87A]">
            {card.value}{card.unit}
          </p>
        </div>
      ))}
    </div>
  );
}
