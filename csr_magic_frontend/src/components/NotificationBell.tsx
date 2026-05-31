import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { notificationApi } from '../services/notificationApi';
import type { AdminNotificationItem, NotificationItem } from '../types/notification';
import { getNotificationHref } from '../constants/notificationMeta';

interface NotificationBellProps {
  scope?: 'user' | 'admin';
  viewAllPath?: string;
}

export default function NotificationBell({ scope = 'user', viewAllPath }: NotificationBellProps) {
  const resolvedViewAllPath = viewAllPath ?? (scope === 'admin' ? '/admin/notifications' : '/notifications');
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<(NotificationItem | AdminNotificationItem)[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = scope === 'admin'
        ? await notificationApi.getAdminUnreadCount()
        : await notificationApi.getUnreadCount();
      setUnreadCount(res.data.data.count);
    } catch {
      setUnreadCount(0);
    }
  }, [scope]);

  const fetchRecentNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = scope === 'admin'
        ? await notificationApi.getAdminNotifications({ page: 0, size: 5 })
        : await notificationApi.getMyNotifications({ page: 0, size: 5 });
      setItems(res.data.data.content);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '加载通知失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [scope]);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchUnreadCount(), fetchRecentNotifications()]);
  }, [fetchRecentNotifications, fetchUnreadCount]);

  useEffect(() => {
    fetchUnreadCount();
    const timer = window.setInterval(fetchUnreadCount, 30000);
    return () => window.clearInterval(timer);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    refreshAll();

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, refreshAll]);

  const handleToggle = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) {
      await refreshAll();
    }
  };

  const handleItemClick = async (notification: NotificationItem | AdminNotificationItem) => {
    try {
      if (!notification.isRead) {
        if (scope === 'admin') {
          await notificationApi.markAdminAsRead(notification.id);
        } else {
          await notificationApi.markAsRead(notification.id);
        }
      }
    } catch {
      // ignore
    } finally {
      setOpen(false);
      await fetchUnreadCount();
      if (scope !== 'admin') {
        navigate(getNotificationHref(notification as NotificationItem));
      }
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate(resolvedViewAllPath);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-[#1A2E22]/60 hover:text-[#1A2E22] transition-colors"
        aria-label="查看通知"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 border-2 border-white text-[10px] font-bold leading-none text-white flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          items={items}
          loading={loading}
          error={error}
          unreadCount={unreadCount}
          onRetry={refreshAll}
          onViewAll={handleViewAll}
          onItemClick={handleItemClick}
        />
      )}
    </div>
  );
}
