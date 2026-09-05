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
vi.mock('./pages/admin/AdminNotificationPage', () => ({ default: () => <div>通知管理页</div> }));

vi.mock('./stores/authStore', () => {
  const mockState: { isAuthenticated: boolean } = { isAuthenticated: false };
  const loadFromStorage = vi.fn();
  const useAuthStore = (selector: (state: { loadFromStorage: () => void; isAuthenticated: boolean }) => unknown) =>
    selector({ loadFromStorage, isAuthenticated: mockState.isAuthenticated });
  return {
    useAuthStore: Object.assign(useAuthStore, {
      getState: () => ({ loadFromStorage, isAuthenticated: mockState.isAuthenticated }),
    }),
    __setAuthenticated: (value: boolean) => {
      mockState.isAuthenticated = value;
    },
  };
});

describe('App 路由', () => {
  it('访问 /admin/notifications 重定向并渲染管理端参与审核页', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('管理端布局')).toBeInTheDocument();
    });
    expect(screen.getByText('参与审核页')).toBeInTheDocument();
    expect(screen.queryByText('员工端布局')).not.toBeInTheDocument();
  });

  it('已登录用户访问 /register 被重定向首页，不渲染注册页（BUG-04 回归）', async () => {
    const store = (await import('./stores/authStore')) as unknown as {
      __setAuthenticated: (value: boolean) => void;
    };
    store.__setAuthenticated(true);

    render(
      <MemoryRouter initialEntries={['/register']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('首页')).toBeInTheDocument();
    });
    expect(screen.queryByText('注册页')).not.toBeInTheDocument();

    store.__setAuthenticated(false);
  });

  it('已登录用户访问 /login 被重定向首页（同源一致化）', async () => {
    const store = (await import('./stores/authStore')) as unknown as {
      __setAuthenticated: (value: boolean) => void;
    };
    store.__setAuthenticated(true);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('首页')).toBeInTheDocument();
    });
    expect(screen.queryByText('登录页')).not.toBeInTheDocument();

    store.__setAuthenticated(false);
  });
});
