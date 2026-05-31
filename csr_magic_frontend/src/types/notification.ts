export type NotificationType =
  | 'SIGNUP_SUCCESS'
  | 'REVIEW_APPROVED'
  | 'REVIEW_REJECTED'
  | 'ACTIVITY_REMINDER';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  content: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
}

export interface AdminNotificationItem extends NotificationItem {
  userId: number;
  username: string;
  displayName: string;
}
