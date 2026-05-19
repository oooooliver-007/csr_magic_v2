import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet } from 'react-router-dom';
import App from './App';

vi.mock('./components/PrivateRoute', () => ({
  default: () => <Outlet />,
}));

vi.mock('./components/AdminLayout', () => ({
  default: () => (
    <div>
      <div>管理端布局</div>
      <Outlet />
    </div>
  ),
}));

vi.mock('./components/EmployeeLayout', () => ({
  default: () => (
    <div>
      <div>员工端布局</div>
      <Outlet />
    </div>
  ),
}));

vi.mock('./pages/LoginPage', () => ({ default: () => <div>登录页</div> }));
vi.mock('./pages/RegisterPage', () => ({ default: () => <div>注册页</div> }));
vi.mock('./pages/admin/EventManagementPage', () => ({ default: () => <div>事件管理页</div> }));
vi.mock('./pages/admin/ActivityManagementPage', () => ({ default: () => <div>活动管理页</div> }));
vi.mock('./pages/admin/UserManagementPage', () => ({ default: () => <div>用户管理页</div> }));
vi.mock('./pages/admin/ParticipationPage', () => ({ default: () => <div>参与审核页</div> }));
vi.mock('./pages/admin/DashboardPage', () => ({ default: () => <div>数据看板页</div> }));
vi.mock('./pages/ActivityListPage', () => ({ default: () => <div>活动列表页</div> }));
vi.mock('./pages/ActivityDetailPage', () => ({ default: () => <div>活动详情页</div> }));
vi.mock('./pages/HomePage', () => ({ default: () => <div>首页</div> }));
vi.mock('./pages/MyProfilePage', () => ({ default: () => <div>个人中心页</div> }));
vi.mock('./pages/NotificationListPage', () => ({ default: () => <div>通知中心页</div> }));
vi.mock('./pages/AIPosterStudioPage', () => ({ default: () => <div>海报工作台页</div> }));

vi.mock('./stores/authStore', () => ({
  useAuthStore: (selector: (state: { loadFromStorage: () => void }) => unknown) =>
    selector({ loadFromStorage: vi.fn() }),
}));

describe('App 路由', () => {
  it('访问旧的 /admin/notifications 时进入统一个人通知中心而不是管理端子页', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('员工端布局')).toBeInTheDocument();
    });
    expect(screen.getByText('通知中心页')).toBeInTheDocument();
    expect(screen.queryByText('管理端布局')).not.toBeInTheDocument();
  });
});
