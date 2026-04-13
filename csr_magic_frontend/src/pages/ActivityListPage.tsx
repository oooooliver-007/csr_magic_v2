import { useState, useEffect, useCallback } from 'react';
import { activityApi } from '../services/activityApi';
import { eventApi } from '../services/eventApi';
import type { Activity, TemplateType, ActivityStatus } from '../types/activity';
import type { Event } from '../types/event';
import ActivityCard from '../components/ActivityCard';
import ActivityFilters from '../components/ActivityFilters';

export default function ActivityListPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 筛选状态
  const [keyword, setKeyword] = useState('');
  const [templateType, setTemplateType] = useState<TemplateType | null>(null);
  const [status, setStatus] = useState<ActivityStatus | null>(null);
  const [eventId, setEventId] = useState<number | null>(null);

  // 分页状态
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 9;

  // 防抖搜索
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 筛选条件变化时重置到第一页
  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, templateType, status, eventId]);

  // 加载活动列表
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await activityApi.list({
        page,
        size: pageSize,
        keyword: debouncedKeyword || undefined,
        templateType: templateType ?? undefined,
        status: status ?? undefined,
        eventId: eventId ?? undefined,
      });
      setActivities(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch (err) {
      console.error('获取活动列表失败:', err);
      setError('加载活动列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedKeyword, templateType, status, eventId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 加载事件列表（用于筛选下拉）
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await eventApi.list({ size: 100 });
        setEvents(res.data.data.content);
      } catch (err) {
        console.error('获取事件列表失败:', err);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="space-y-8">
      {/* 筛选区域 */}
      <ActivityFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        activeTemplateType={templateType}
        onTemplateTypeChange={setTemplateType}
        activeStatus={status}
        onStatusChange={setStatus}
        activeEventId={eventId}
        onEventIdChange={setEventId}
        events={events}
      />

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          {error}
          <button onClick={fetchActivities} className="ml-3 underline font-medium">
            重试
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
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

      {/* 活动卡片网格 */}
      {!loading && activities.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && activities.length === 0 && !error && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🌿</div>
          <h3 className="text-xl font-bold text-[#1A2E22]/70 mb-2">暂无可参与的活动</h3>
          <p className="text-[#1A2E22]/50 text-sm">请稍后再来查看，或尝试调整筛选条件</p>
        </div>
      )}

      {/* 分页控件 */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-[#1A2E22]/70 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            上一页
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                page === i
                  ? 'bg-[#2EB87A] text-white shadow-sm'
                  : 'border border-gray-200 text-[#1A2E22]/70 hover:border-[#2EB87A] hover:text-[#2EB87A]'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-[#1A2E22]/70 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页
          </button>

          <span className="ml-4 text-sm text-[#1A2E22]/50">
            共 {totalElements} 项
          </span>
        </div>
      )}
    </div>
  );
}
