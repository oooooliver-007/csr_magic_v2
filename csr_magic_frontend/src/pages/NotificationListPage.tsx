import { useCallback, useEffect, useState } from 'react';
import { CheckCheck, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/notificationApi';
import { formatNotificationTime, getNotificationHref, getNotificationMeta } from '../constants/notificationMeta';
import type { NotificationItem } from '../types/notification';
import type { PageResponse } from '../types/common';

export default function NotificationListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [pageData, setPageData] = useState<PageResponse<NotificationItem> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getMyNotifications({ page, size: 20 });
      setItems(res.data.data.content);
      setPageData(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '获取通知列表失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleItemClick = async (notification: NotificationItem) => {
    try {
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.id);
        setItems((prev) => prev.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item)));
      }
    } catch {
      showToast('标记已读失败');
    } finally {
      navigate(getNotificationHref(notification));
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await notificationApi.markAllAsRead();
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      showToast('已全部标记为已读');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '全部标记已读失败';
      showToast(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1A2E22]">通知中心</h1>
          <p className="mt-1 text-sm text-[#1A2E22]/60">查看最新报名、审核结果和活动提醒</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          disabled={actionLoading || items.every((item) => item.isRead)}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-[#1A2E22] hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <CheckCheck className="h-4 w-4 text-[#2EB87A]" />
          全部标记已读
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 p-4 animate-pulse space-y-3">
              <div className="h-5 w-1/3 rounded bg-gray-200" />
              <div className="h-4 w-full rounded bg-gray-100" />
              <div className="h-4 w-2/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchNotifications}
            className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2EB87A]/10 text-[#2EB87A]">
            <Loader2 className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#1A2E22]">暂无通知</h2>
          <p className="mt-2 text-sm text-[#1A2E22]/55">当你报名活动或收到审核结果后，通知会展示在这里</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-4">
          {items.map((notification) => {
            const meta = getNotificationMeta(notification.type);
            const Icon = meta.icon;

            return (
              <button
                key={notification.id}
                onClick={() => handleItemClick(notification)}
                className={`w-full rounded-2xl border p-5 text-left shadow-sm transition-colors hover:bg-gray-50 ${
                  notification.isRead
                    ? 'border-gray-100 bg-white'
                    : 'border-[#2EB87A]/20 bg-[#2EB87A]/[0.04]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 ${meta.iconClassName}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-[#1A2E22]">{notification.title}</h2>
                          {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-red-500" />}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[#1A2E22]/70">{notification.content ?? '暂无内容'}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${meta.badgeClassName}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-[#1A2E22]/45">{formatNotificationTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-[#1A2E22]/70 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors disabled:opacity-40"
          >
            上一页
          </button>
          <span className="text-sm text-[#1A2E22]/60">{page + 1} / {pageData.totalPages}</span>
          <button
            onClick={() => setPage((prev) => Math.min(pageData.totalPages - 1, prev + 1))}
            disabled={page >= pageData.totalPages - 1}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-[#1A2E22]/70 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors disabled:opacity-40"
          >
            下一页
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1A2E22] px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
