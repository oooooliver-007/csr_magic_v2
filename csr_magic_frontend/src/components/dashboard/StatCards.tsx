import { Activity, Users, DollarSign, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../../types/dashboard';

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, trend, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#1A2E22]/60 font-medium text-sm">{title}</p>
        <div className="w-8 h-8 rounded-lg bg-[#2EB87A]/10 flex items-center justify-center text-[#2EB87A]">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-[#1A2E22] mb-2">{value}</p>
      <p className="text-xs font-medium text-[#2EB87A] bg-[#2EB87A]/10 inline-block px-2 py-1 rounded-md">
        {trend}
      </p>
    </div>
  );
}

interface StatCardsProps {
  stats: DashboardStats;
}

export default function StatCards({ stats }: StatCardsProps) {
  const cards: StatCardProps[] = [
    {
      title: '总活动数',
      value: String(stats.totalActivities),
      trend: '全部活动',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      title: '累计参与人次',
      value: stats.totalParticipations.toLocaleString(),
      trend: '所有参与记录',
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: '累计捐赠额',
      value: `¥${stats.totalDonation.toLocaleString()}`,
      trend: '已审批捐赠',
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      title: '本月新增参与',
      value: String(stats.monthlyNew),
      trend: '本月活跃',
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
