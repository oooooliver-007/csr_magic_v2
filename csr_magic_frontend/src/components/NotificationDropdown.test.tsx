import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NotificationDropdown from './NotificationDropdown';
import type { NotificationItem } from '../types/notification';

const sampleNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'SIGNUP_SUCCESS',
    title: '报名提交成功',
    content: '您已成功提交活动报名申请',
    isRead: false,
    createdAt: '2026-04-14T12:00:00Z',
  },
  {
    id: 2,
    type: 'REVIEW_APPROVED',
    title: '报名审核通过',
    content: '您报名的活动已审核通过',
    isRead: true,
    createdAt: '2026-04-13T10:00:00Z',
  },
];

describe('NotificationDropdown', () => {
  it('渲染最近通知列表和查看全部按钮', () => {
    render(
      <NotificationDropdown
        items={sampleNotifications}
        loading={false}
        error={null}
        unreadCount={1}
        onRetry={vi.fn()}
        onViewAll={vi.fn()}
        onItemClick={vi.fn()}
      />
    );

    expect(screen.getByText('通知')).toBeInTheDocument();
    expect(screen.getByText('报名提交成功')).toBeInTheDocument();
    expect(screen.getByText('报名审核通过')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /查看全部/i })).toBeInTheDocument();
  });

  it('点击通知项触发 onItemClick', async () => {
    const user = userEvent.setup();
    const onItemClick = vi.fn();

    render(
      <NotificationDropdown
        items={sampleNotifications}
        loading={false}
        error={null}
        unreadCount={1}
        onRetry={vi.fn()}
        onViewAll={vi.fn()}
        onItemClick={onItemClick}
      />
    );

    await user.click(screen.getByText('报名提交成功'));

    expect(onItemClick).toHaveBeenCalledWith(sampleNotifications[0]);
  });

  it('错误状态下点击重试触发 onRetry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <NotificationDropdown
        items={[]}
        loading={false}
        error="加载失败"
        unreadCount={0}
        onRetry={onRetry}
        onViewAll={vi.fn()}
        onItemClick={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: '重试' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
