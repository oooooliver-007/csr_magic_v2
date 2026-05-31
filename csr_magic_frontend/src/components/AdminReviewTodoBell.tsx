import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Users, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { participationApi } from '../services/participationApi';
import type { Participation } from '../types/participation';

export default function AdminReviewTodoBell() {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Participation[]>([]);
  const [todoCount, setTodoCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      const res = await participationApi.getReviewTodos({ page: 0, size: 5 });
      setItems(res.data.data.content);
      setTodoCount(res.data.data.totalElements);
    } catch {
      // Don't set error on silent background refresh
    }
  }, []);

  const fetchTodosWithLoading = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await participationApi.getReviewTodos({ page: 0, size: 5 });
      setItems(res.data.data.content);
      setTodoCount(res.data.data.totalElements);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '加载待办失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for counts periodically in the background
  useEffect(() => {
    fetchTodos();
    const timer = window.setInterval(fetchTodos, 30000);
    return () => window.clearInterval(timer);
  }, [fetchTodos]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    fetchTodosWithLoading();

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, fetchTodosWithLoading]);

  const handleToggle = () => {
    setOpen((prev) => !prev);
  };

  const handleNavigateToReview = () => {
    setOpen(false);
    navigate('/admin/participations?state=PENDING');
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timeStr;
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-[#1A2E22]/60 hover:text-[#1A2E22] transition-colors focus:outline-none"
        aria-label="查看待办"
        data-testid="admin-todo-bell"
      >
        <Bell className="w-6 h-6" />
        {todoCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-[#FFB347] border-2 border-white text-[10px] font-bold leading-none text-white flex items-center justify-center">
            {todoCount > 99 ? '99+' : todoCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-[#1A2E22] text-sm">审批待办</h3>
            {todoCount > 0 && (
              <span className="text-xs bg-amber-50 text-[#FFB347] font-semibold px-2 py-0.5 rounded-full">
                {todoCount} 项待处理
              </span>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="w-6 h-6 border-2 border-[#2EB87A] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">加载中...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mb-1" />
                <p className="text-xs text-red-500 mb-2">{error}</p>
                <button
                  onClick={fetchTodosWithLoading}
                  className="text-xs text-[#2EB87A] hover:underline font-medium"
                >
                  重新加载
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <Users className="w-10 h-10 mb-2 text-gray-200" />
                <p className="text-sm">暂无待审核任务</p>
                <p className="text-xs mt-1 text-gray-300">所有申请均已处理完毕</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={handleNavigateToReview}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50/50 transition-colors flex space-x-3 items-start"
                  >
                    <div className="mt-0.5 p-1.5 bg-[#2EB87A]/10 text-[#2EB87A] rounded-full">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-gray-900 truncate">
                          {item.userDisplayName}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            item.state === 'RE_SUBMITTED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {item.state === 'RE_SUBMITTED' ? '重新提交' : '新提交'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mb-1">
                        申请报名活动「{item.activityName}」
                      </p>
                      <div className="flex items-center text-[10px] text-gray-400 space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-100">
            <button
              onClick={handleNavigateToReview}
              className="w-full text-center text-xs font-semibold text-[#2EB87A] hover:text-[#249663] py-1.5 block transition-colors"
            >
              查看全部
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
