import { Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Activity } from '../types/activity';
import ActivityBadge from './ActivityBadge';

interface ActivityCardProps {
  activity: Activity;
}

const statusConfig: Record<string, { text: string; classes: string }> = {
  ONGOING: { text: '进行中', classes: 'bg-green-500 text-white' },
  UPCOMING: { text: '即将开始', classes: 'bg-blue-500 text-white' },
  ENDED: { text: '已结束', classes: 'bg-gray-400 text-white' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '待定';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '待定';
  }
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();
  const defaultStatus = { text: '未知', classes: 'bg-gray-400 text-white' };
  const statusInfo = statusConfig[activity.status] ?? defaultStatus;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
      {/* 封面图 */}
      <div className="h-48 overflow-hidden relative bg-gray-100">
        {activity.coverImage ? (
          <img
            src={activity.coverImage}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#1A2E22]/20">
            <Calendar className="w-12 h-12" />
          </div>
        )}
        {/* 左上角模板类型 Badge */}
        <div className="absolute top-3 left-3">
          <ActivityBadge
            templateType={activity.templateType}
            className="bg-white/90 backdrop-blur-sm shadow-sm"
          />
        </div>
        {/* 右上角状态标签 */}
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.classes}`}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg mb-1 line-clamp-2 leading-tight">{activity.name}</h3>
        <p className="text-[#1A2E22]/50 text-xs mb-3">{activity.eventName}</p>

        <div className="mt-auto space-y-2 mb-5">
          <div className="flex items-center text-[#1A2E22]/60 text-sm">
            <Calendar className="w-4 h-4 mr-2 shrink-0" />
            {formatDate(activity.startTime)}
          </div>
          <div className="flex items-center text-[#1A2E22]/60 text-sm">
            <Users className="w-4 h-4 mr-2 shrink-0" />
            {activity.currentParticipants}
            {activity.maxParticipants ? ` / ${activity.maxParticipants}` : ''} 人参与
          </div>
        </div>

        <button
          onClick={() => navigate(`/activities/${activity.id}`)}
          className="w-full py-2.5 rounded-xl border-2 border-[#E5E7EB] font-medium text-[#1A2E22] hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
        >
          查看详情
        </button>
      </div>
    </div>
  );
}
