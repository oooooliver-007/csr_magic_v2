import { ChevronRight } from 'lucide-react';
import { getNotificationEmptyIcon, getNotificationMeta, formatNotificationTime } from '../constants/notificationMeta';
import type { NotificationItem } from '../types/notification';

interface NotificationDropdownProps {
  items: NotificationItem[];
  loading: boolean;
  error: string | null;
  unreadCount: number;
  onRetry: () => void;
  onViewAll: () => void;
  onItemClick: (notification: NotificationItem) => void;
}

export default function NotificationDropdown({
  items,
  loading,
  error,
  unreadCount,
  onRetry,
  onViewAll,
  onItemClick,
}: NotificationDropdownProps) {
  const EmptyIcon = getNotificationEmptyIcon();

  return (
    <div className="absolute right-0 top-full mt-3 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-100 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-[#1A2E22]">通知</h3>
          <p className="text-xs text-[#1A2E22]/50 mt-0.5">最近 5 条消息</p>
        </div>
        {unreadCount > 0 && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-500">
            {unreadCount > 99 ? '99+' : unreadCount} 未读
          </span>
        )}
      </div>

      {loading && (
        <div className="p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-100 p-3 animate-pulse space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-200" />
              <div className="h-3 w-full rounded bg-gray-100" />
              <div className="h-3 w-1/3 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="p-6 text-center">
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={onRetry}
            className="mt-3 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-[#1A2E22] hover:bg-gray-50 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#2EB87A]/10 text-[#2EB87A]">
            <EmptyIcon className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-[#1A2E22]">暂时没有新通知</p>
          <p className="mt-1 text-xs text-[#1A2E22]/50">报名成功和审核结果会显示在这里</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="max-h-[420px] overflow-y-auto p-2">
          <div className="space-y-2">
            {items.map((notification) => {
              const meta = getNotificationMeta(notification.type);
              const Icon = meta.icon;

              return (
                <button
                  key={notification.id}
                  onClick={() => onItemClick(notification)}
                  className={`w-full rounded-2xl border p-3 text-left transition-colors hover:bg-gray-50 ${
                    notification.isRead
                      ? 'border-gray-100 bg-white'
                      : 'border-[#2EB87A]/20 bg-[#2EB87A]/[0.05]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-50 ${meta.iconClassName}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[#1A2E22]">{notification.title}</p>
                        {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-500" />}
                      </div>
                      <p className="text-xs leading-5 text-[#1A2E22]/70">{notification.content ?? '暂无内容'}</p>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${meta.badgeClassName}`}>
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-[#1A2E22]/45">{formatNotificationTime(notification.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-gray-100 p-2">
        <button
          onClick={onViewAll}
          className="flex w-full items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-[#2EB87A] hover:bg-[#2EB87A]/5 transition-colors"
        >
          查看全部
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
