import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminNotificationPage from './AdminNotificationPage';
import { notificationApi } from '../../services/notificationApi';

vi.mock('../../services/notificationApi', () => ({
  notificationApi: {
    getAdminNotifications: vi.fn(),
    markAdminAsRead: vi.fn(),
    markAllAdminAsRead: vi.fn(),
  },
}));

const mockNotifications = [
  {
    id: 10,
    userId: 1,
    username: 'testuser',
    displayName: '张三',
    type: 'SIGNUP_SUCCESS' as const,
    title: '报名提交成功',
    content: '您已成功报名',
    isRead: false,
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 11,
    userId: 2,
    username: 'user2',
    displayName: '李四',
    type: 'REVIEW_APPROVED' as const,
    title: '报名审核通过',
    content: '审核已通过',
    isRead: true,
    createdAt: '2026-05-02T10:00:00Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminNotificationPage />
    </MemoryRouter>
  );
}

describe('AdminNotificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(notificationApi.getAdminNotifications).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: mockNotifications.map((n) => ({ ...n })),
          totalElements: 2,
          totalPages: 1,
        },
      },
    } as never);
    vi.mocked(notificationApi.markAdminAsRead).mockResolvedValue({ data: { code: 200 } } as never);
    vi.mocked(notificationApi.markAllAdminAsRead).mockResolvedValue({ data: { code: 200 } } as never);
  });

  it('页面标题为"通知管理"', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('通知管理')).toBeInTheDocument();
    });
  });

  it('首次加载调用 getAdminNotifications', async () => {
    renderPage();

    await waitFor(() => {
      expect(notificationApi.getAdminNotifications).toHaveBeenCalledTimes(1);
    });
  });

  it('展示通知接收用户的 displayName', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
    });
  });

  it('展示通知标题', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('报名提交成功')).toBeInTheDocument();
      expect(screen.getByText('报名审核通过')).toBeInTheDocument();
    });
  });

  it('未读通知有"标记已读"按钮，点击调用 markAdminAsRead', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('报名提交成功')).toBeInTheDocument();
    });

    const firstBtn = screen.getByRole('button', { name: '标记已读 报名提交成功' });
    fireEvent.click(firstBtn);

    await waitFor(() => {
      expect(notificationApi.markAdminAsRead).toHaveBeenCalledWith(10);
    });
  });

  it('点击"全部标记已读"按钮调用 markAllAdminAsRead', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('报名提交成功')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '全部标记已读' }));

    await waitFor(() => {
      expect(notificationApi.markAllAdminAsRead).toHaveBeenCalledTimes(1);
    });
  });
});
