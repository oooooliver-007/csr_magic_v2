import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { TemplateType, ActivityStatus } from '../types/activity';
import type { Event } from '../types/event';

interface ActivityFiltersProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  activeTemplateType: TemplateType | null;
  onTemplateTypeChange: (value: TemplateType | null) => void;
  activeStatus: ActivityStatus | null;
  onStatusChange: (value: ActivityStatus | null) => void;
  activeEventId: number | null;
  onEventIdChange: (value: number | null) => void;
  events: Event[];
}

interface FilterOption<T extends string> {
  value: T | null;
  label: string;
}

const templateTypeFilters: FilterOption<TemplateType>[] = [
  { value: null, label: '全部类型' },
  { value: 'VOLUNTEER', label: '🧡 志愿者' },
  { value: 'DONATION', label: '🌱 捐赠' },
  { value: 'CHECKIN', label: '✅ 签到' },
  { value: 'BASIC', label: '📋 基础' },
  { value: 'CUSTOM', label: '⚙️ 自定义' },
];

const statusFilters: FilterOption<ActivityStatus>[] = [
  { value: null, label: '全部状态' },
  { value: 'ONGOING', label: '进行中' },
  { value: 'UPCOMING', label: '即将开始' },
  { value: 'ENDED', label: '已结束' },
];

export default function ActivityFilters({
  keyword,
  onKeywordChange,
  activeTemplateType,
  onTemplateTypeChange,
  activeStatus,
  onStatusChange,
  activeEventId,
  onEventIdChange,
  events,
}: ActivityFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-4">
      {/* 搜索栏 + 筛选切换（移动端） */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">探索活动</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A2E22]/40" />
            <input
              type="text"
              placeholder="搜索活动..."
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-[#E5E7EB] focus:border-[#2EB87A] focus:outline-none transition-colors"
            />
          </div>
          {/* 移动端筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2.5 rounded-xl border-2 border-[#E5E7EB] text-[#1A2E22]/60 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
          >
            {showFilters ? <X className="w-5 h-5" /> : <SlidersHorizontal className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 筛选标签（桌面端始终显示，移动端可折叠） */}
      <div className={`space-y-3 ${showFilters ? 'block' : 'hidden md:block'}`}>
        {/* 模板类型筛选 — 横向滚动 */}
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {templateTypeFilters.map((filter) => (
            <button
              key={filter.label}
              onClick={() => onTemplateTypeChange(filter.value)}
              className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-colors text-sm ${
                activeTemplateType === filter.value
                  ? 'bg-[#2EB87A] text-white shadow-sm'
                  : 'bg-white text-[#1A2E22]/70 border border-gray-200 hover:border-[#2EB87A] hover:text-[#2EB87A]'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 状态筛选 + 事件筛选（桌面端并排，移动端堆叠） */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {statusFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => onStatusChange(filter.value)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors text-sm ${
                  activeStatus === filter.value
                    ? 'bg-[#1A2E22] text-white'
                    : 'bg-white text-[#1A2E22]/60 border border-gray-200 hover:border-[#1A2E22] hover:text-[#1A2E22]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {events.length > 0 && (
            <select
              value={activeEventId ?? ''}
              onChange={(e) => onEventIdChange(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-1.5 rounded-xl border-2 border-[#E5E7EB] text-sm text-[#1A2E22]/70 focus:border-[#2EB87A] focus:outline-none transition-colors bg-white"
            >
              <option value="">全部事件</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
