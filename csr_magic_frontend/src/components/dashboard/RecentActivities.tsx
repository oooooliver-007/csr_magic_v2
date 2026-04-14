import type { Activity } from '../../types/activity';

const TYPE_COLORS: Record<string, string> = {
  VOLUNTEER: 'bg-[#FFB347]',
  DONATION: 'bg-[#2EB87A]',
  CHECKIN: 'bg-blue-500',
  BASIC: 'bg-gray-400',
  CUSTOM: 'bg-purple-500',
};

const TYPE_LABELS: Record<string, string> = {
  VOLUNTEER: '志愿者',
  DONATION: '捐赠',
  CHECKIN: '签到',
  BASIC: '基础',
  CUSTOM: '自定义',
};

interface RecentActivitiesProps {
  data: Activity[];
}

export default function RecentActivities({ data }: RecentActivitiesProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold">近期活动</h3>
      </div>
      <div className="p-6 space-y-6">
        {data.length === 0 && (
          <p className="text-center text-[#1A2E22]/40 py-4">暂无进行中的活动</p>
        )}
        {data.map((activity) => {
          const current = activity.currentParticipants;
          const max = activity.maxParticipants ?? 0;
          const percent = max > 0 ? Math.round((current / max) * 100) : 0;
          const colorClass = TYPE_COLORS[activity.templateType] ?? 'bg-gray-400';

          return (
            <div key={activity.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-bold text-sm">{activity.name}</h4>
                  <p className="text-xs text-[#1A2E22]/50 mt-0.5">
                    {TYPE_LABELS[activity.templateType] ?? activity.templateType}
                  </p>
                </div>
                <div className="text-sm font-medium">
                  {current}
                  {max > 0 && (
                    <span className="text-[#1A2E22]/50"> / {max}</span>
                  )}
                </div>
              </div>
              {max > 0 && (
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorClass}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
