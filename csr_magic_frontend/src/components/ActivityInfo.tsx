import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import type { ActivityDetail } from '../types/participation';
import ActivityBadge from './ActivityBadge';

interface ActivityInfoProps {
  activity: ActivityDetail;
}

/**
 * 活动详情信息展示区
 * 遵循 UI 原型：左侧详情区 — Badge + 标题 + 描述 + 四宫格信息卡
 */
export default function ActivityInfo({ activity }: ActivityInfoProps) {
  const formatDateTime = (isoStr: string | null): string => {
    if (!isoStr) return '待定';
    return new Date(isoStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const spotsInfo = (() => {
    if (activity.maxParticipants === null) {
      return `${activity.currentParticipants} 人已报名`;
    }
    const remaining = activity.maxParticipants - activity.currentParticipants;
    return `${activity.currentParticipants} / ${activity.maxParticipants} 人（剩余 ${remaining > 0 ? remaining : 0} 名额）`;
  })();

  return (
    <div className="flex-1 space-y-8">
      {/* 标签 + 标题 + 描述 */}
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          <ActivityBadge templateType={activity.templateType} />
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {activity.eventName}
          </span>
          {activity.status === 'ENDED' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
              已结束
            </span>
          )}
          {activity.status === 'ONGOING' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#2EB87A]/10 text-[#2EB87A]">
              进行中
            </span>
          )}
          {activity.status === 'UPCOMING' && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
              即将开始
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
          {activity.name}
        </h1>
        {activity.description && (
          <p className="text-[#1A2E22]/70 text-lg leading-relaxed">
            {activity.description}
          </p>
        )}
      </div>

      {/* 四宫格信息卡 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoCard
          icon={<Calendar className="w-5 h-5 text-[#2EB87A]" />}
          title="开始时间"
          content={formatDateTime(activity.startTime)}
        />
        <InfoCard
          icon={<Clock className="w-5 h-5 text-[#2EB87A]" />}
          title="结束时间"
          content={formatDateTime(activity.endTime)}
        />
        <InfoCard
          icon={<Users className="w-5 h-5 text-[#2EB87A]" />}
          title="参与人数"
          content={spotsInfo}
        />
        <InfoCard
          icon={<MapPin className="w-5 h-5 text-[#2EB87A]" />}
          title="所属事件"
          content={activity.eventName}
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 bg-[#2EB87A]/10 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="font-bold text-sm">{title}</p>
        <p className="text-[#1A2E22]/60 text-sm mt-0.5">{content}</p>
      </div>
    </div>
  );
}
