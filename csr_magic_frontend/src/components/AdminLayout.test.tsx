import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';

vi.mock('./NotificationBell', () => ({
  default: ({ viewAllPath = '/notifications' }: { viewAllPath?: string }) => (
    <div data-testid="notification-bell" data-view-all-path={viewAllPath}>通知铃铛</div>
  ),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { displayName: string; role: 'ADMIN' }; logout: () => void }) => unknown) =>
    selector({
      user: { displayName: '管理员', role: 'ADMIN' },
      logout: vi.fn(),
    }),
}));

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>数据看板内容</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminLayout', () => {
  it('不在管理端侧边栏暴露未实现的通知管理入口', () => {
    renderAdminLayout();

    expect(screen.queryByRole('link', { name: '通知管理' })).not.toBeInTheDocument();
  });

  it('顶部通知铃铛查看全部跳转到统一个人通知中心', () => {
    renderAdminLayout();

    expect(screen.getByTestId('notification-bell')).toHaveAttribute('data-view-all-path', '/notifications');
  });
});
