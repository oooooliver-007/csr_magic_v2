import { useState } from 'react';
import { Calendar, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { ActivityDetail } from '../../types/participation';
import type { FormFieldSchema } from '../../types/activity';
import ActivityBadge from '../ActivityBadge';
import { TEMPLATE_TYPE_LABELS } from '../../constants/templateSchemas';

interface ActivityInfoCardProps {
  activity: ActivityDetail;
  schema: FormFieldSchema[];
  /** 移动端是否启用顶部折叠（默认 true） */
  collapsibleOnMobile?: boolean;
}

/**
 * AI 对话报名页的活动信息卡
 * - 桌面端：左侧固定宽列
 * - 移动端：顶部折叠卡片（点击标题展开/收起）
 */
export default function ActivityInfoCard({
  activity,
  schema,
  collapsibleOnMobile = true,
}: ActivityInfoCardProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const formatDateTime = (iso: string | null): string => {
    if (!iso) return '待定';
    return new Date(iso).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <aside className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 移动端标题栏（可折叠） */}
      {collapsibleOnMobile && (
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="chat-activity-info-body"
          className="md:hidden w-full flex items-center justify-between px-4 py-3 border-b border-gray-100"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ActivityBadge templateType={activity.templateType} />
            <span className="font-bold text-sm truncate text-[#1A2E22]">{activity.name}</span>
          </div>
          {mobileOpen ? (
            <ChevronUp className="w-4 h-4 text-[#1A2E22]/60 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#1A2E22]/60 shrink-0" />
          )}
        </button>
      )}

      <div
        id="chat-activity-info-body"
        className={`${collapsibleOnMobile ? (mobileOpen ? 'block' : 'hidden md:block') : 'block'} p-4 md:p-6 space-y-5`}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <ActivityBadge templateType={activity.templateType} />
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {activity.eventName}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1A2E22] leading-tight">{activity.name}</h2>
          {activity.description && (
            <p className="mt-2 text-sm text-[#1A2E22]/70 leading-relaxed line-clamp-3">
              {activity.description}
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm text-[#1A2E22]/80">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 mt-0.5 text-[#2EB87A] shrink-0" />
            <div>
              <span className="text-xs text-[#1A2E22]/50 block">开始时间</span>
              <span className="font-medium">{formatDateTime(activity.startTime)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 text-[#2EB87A] shrink-0" />
            <div>
              <span className="text-xs text-[#1A2E22]/50 block">结束时间</span>
              <span className="font-medium">{formatDateTime(activity.endTime)}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs text-[#1A2E22]/50 uppercase font-bold tracking-wide mb-2">
            需要收集的信息
          </p>
          {schema.length === 0 ? (
            <p className="text-sm text-[#1A2E22]/60">无需额外信息，直接确认即可。</p>
          ) : (
            <ul className="space-y-1.5">
              {schema.map((field) => (
                <li
                  key={field.name}
                  className="flex items-center justify-between text-sm text-[#1A2E22]/80"
                >
                  <span>
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </span>
                  <span className="text-xs text-[#1A2E22]/40 uppercase">
                    {TEMPLATE_TYPE_LABELS[activity.templateType]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}
