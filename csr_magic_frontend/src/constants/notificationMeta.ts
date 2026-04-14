import { Bell, CheckCircle2, CircleAlert, Clock3, type LucideIcon } from 'lucide-react';
import type { NotificationItem, NotificationType } from '../types/notification';

export interface NotificationMeta {
  label: string;
  icon: LucideIcon;
  iconClassName: string;
  badgeClassName: string;
  href: string;
}

export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  SIGNUP_SUCCESS: {
    label: '报名成功',
    icon: CheckCircle2,
    iconClassName: 'text-[#2EB87A]',
    badgeClassName: 'bg-[#2EB87A]/10 text-[#2EB87A]',
    href: '/my?tab=participations',
  },
  REVIEW_APPROVED: {
    label: '审核通过',
    icon: CheckCircle2,
    iconClassName: 'text-[#2EB87A]',
    badgeClassName: 'bg-[#2EB87A]/10 text-[#2EB87A]',
    href: '/my?tab=participations',
  },
  REVIEW_REJECTED: {
    label: '审核驳回',
    icon: CircleAlert,
    iconClassName: 'text-red-500',
    badgeClassName: 'bg-red-50 text-red-500',
    href: '/my?tab=participations',
  },
  ACTIVITY_REMINDER: {
    label: '活动提醒',
    icon: Clock3,
    iconClassName: 'text-[#FFB347]',
    badgeClassName: 'bg-[#FFB347]/15 text-[#C97B07]',
    href: '/activities',
  },
};

export function getNotificationMeta(type: NotificationType): NotificationMeta {
  return NOTIFICATION_META[type];
}

export function getNotificationHref(notification: NotificationItem): string {
  return getNotificationMeta(notification.type).href;
}

export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) {
    return '刚刚';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes} 分钟前`;
  }
  if (diffHours < 24) {
    return `${diffHours} 小时前`;
  }
  if (diffDays < 7) {
    return `${diffDays} 天前`;
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getNotificationEmptyIcon(): LucideIcon {
  return Bell;
}
