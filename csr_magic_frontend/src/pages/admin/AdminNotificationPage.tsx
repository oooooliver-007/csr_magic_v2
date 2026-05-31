import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Check } from 'lucide-react';
import { notificationApi } from '../../services/notificationApi';
import type { AdminNotificationItem } from '../../types/notification';

export default function AdminNotificationPage() {
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchNotifications = useCallback(async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getAdminNotifications({ page: p, size: 20 });
      setNotifications(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setPage(p);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '加载通知失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAdminAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      showToast('已标记为已读');
    } catch {
      showToast('操作失败，请重试');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAdminAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showToast('已全部标记为已读');
    } catch {
      showToast('操作失败，请重试');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E22]">通知管理</h1>
          <p className="text-sm text-[#1A2E22]/60 mt-1">查看并管理所有员工通知</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={unreadCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#2EB87A] text-white rounded-lg text-sm font-medium hover:bg-[#29A86E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <CheckCheck className="w-4 h-4" />
          全部标记已读
        </button>
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1A2E22] text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#2EB87A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 错误状态 */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={() => fetchNotifications(page)}
            className="mt-3 text-sm text-red-500 hover:text-red-700 underline"
          >
            重试
          </button>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && notifications.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-[#1A2E22]/40 text-sm">暂无通知</p>
        </div>
      )}

      {/* 通知列表 */}
      {!loading && !error && notifications.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`flex items-start gap-4 px-6 py-4 ${!notification.isRead ? 'bg-[#2EB87A]/5' : ''}`}
            >
              {/* 未读圆点 */}
              <div className="mt-1 flex-shrink-0">
                {!notification.isRead ? (
                  <div className="w-2 h-2 rounded-full bg-[#2EB87A]" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-200" />
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#2EB87A] bg-[#2EB87A]/10 px-2 py-0.5 rounded-full">
                    {notification.displayName || notification.username}
                  </span>
                  <span className="text-xs text-[#1A2E22]/40">{new Date(notification.createdAt).toLocaleString('zh-CN')}</span>
                </div>
                <p className="text-sm font-medium text-[#1A2E22]">{notification.title}</p>
                {notification.content && (
                  <p className="text-xs text-[#1A2E22]/60 mt-0.5 line-clamp-2">{notification.content}</p>
                )}
              </div>

              {/* 标记已读按钮 */}
              {!notification.isRead && (
                <button
                  onClick={() => handleMarkAsRead(notification.id)}
                  className="flex-shrink-0 flex items-center gap-1 text-xs text-[#1A2E22]/50 hover:text-[#2EB87A] transition-colors px-2 py-1 rounded hover:bg-[#2EB87A]/10"
                  aria-label={`标记已读 ${notification.title}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  标记已读
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => fetchNotifications(i)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                i === page
                  ? 'bg-[#2EB87A] text-white'
                  : 'bg-white text-[#1A2E22]/60 border border-gray-200 hover:border-[#2EB87A]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
