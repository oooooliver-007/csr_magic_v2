import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import * as authStore from './stores/authStore';

const __setAuth = (authStore as unknown as { __setAuth: (isAuthenticated: boolean, role?: string) => void }).__setAuth;

vi.mock('./pages/LoginPage', () => ({ default: () => <div>登录页</div> }));
vi.mock('./pages/RegisterPage', () => ({ default: () => <div>注册页</div> }));
vi.mock('./pages/HomePage', () => ({ default: () => <div>首页</div> }));
vi.mock('./pages/admin/EventManagementPage', () => ({ default: () => <div>事件管理页</div> }));
vi.mock('./pages/admin/ActivityManagementPage', () => ({ default: () => <div>活动管理页</div> }));
vi.mock('./pages/admin/UserManagementPage', () => ({ default: () => <div>用户管理页</div> }));
vi.mock('./pages/admin/ParticipationPage', () => ({ default: () => <div>参与审核页</div> }));
vi.mock('./pages/admin/DashboardPage', () => ({ default: () => <div>数据看板页</div> }));
vi.mock('./pages/admin/SurveyManagementPage', () => ({ default: () => <div>问卷管理页</div> }));
vi.mock('./pages/admin/AdminNotificationPage', () => ({ default: () => <div>通知管理页</div> }));
vi.mock('./pages/ActivityListPage', () => ({ default: () => <div>活动列表页</div> }));
vi.mock('./pages/ActivityDetailPage', () => ({ default: () => <div>活动详情页</div> }));
vi.mock('./pages/MyProfilePage', () => ({ default: () => <div>个人中心页</div> }));
vi.mock('./pages/NotificationListPage', () => ({ default: () => <div>通知中心页</div> }));
vi.mock('./pages/AIPosterStudioPage', () => ({ default: () => <div>海报工作台页</div> }));
vi.mock('./pages/MySurveysPage', () => ({ default: () => <div>我的问卷页</div> }));
vi.mock('./pages/SurveyFillPage', () => ({ default: () => <div>问卷填写页</div> }));
vi.mock('./components/AdminReviewTodoBell', () => ({ default: () => null }));
vi.mock('./components/NotificationBell', () => ({ default: () => null }));

vi.mock('./stores/authStore', () => {
  const mockState: {
    isAuthenticated: boolean;
    user: { role: string; displayName?: string; username?: string } | null;
  } = {
    isAuthenticated: false,
    user: null,
  };
  const useAuthStore = (selector: (state: {
    isAuthenticated: boolean;
    user: typeof mockState.user;
    logout: () => void;
  }) => unknown) => selector({
    isAuthenticated: mockState.isAuthenticated,
    user: mockState.user,
    logout: vi.fn(),
  });
  return {
    useAuthStore: Object.assign(useAuthStore, {
      getState: () => ({ loadFromStorage: vi.fn(), isAuthenticated: mockState.isAuthenticated }),
    }),
    __setAuth: (isAuthenticated: boolean, role = 'USER') => {
      mockState.isAuthenticated = isAuthenticated;
      mockState.user = isAuthenticated ? { role, displayName: '用户', username: 'u' } : null;
    },
  };
});

function renderAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>);
}

beforeEach(() => {
  __setAuth(false);
});

describe('管理端会话与访问控制（BUG-10 代码侧 + admin-session 规格）', () => {
  it('管理员登录态下整页访问管理端深链接直接渲染，不跳登录（深链接会话恢复）', async () => {
    __setAuth(true, 'ADMIN');
    renderAt('/admin/participations');
    await waitFor(() => expect(screen.getByText('参与审核页')).toBeInTheDocument());
    expect(screen.queryByText('登录页')).not.toBeInTheDocument();
  });

  it('普通用户访问 /admin 被重定向员工端首页（角色门禁）', async () => {
    __setAuth(true, 'USER');
    renderAt('/admin/participations');
    await waitFor(() => expect(screen.getByText('CSR Hub')).toBeInTheDocument());
    expect(screen.queryByText('参与审核页')).not.toBeInTheDocument();
  });

  it('无有效会话访问管理端深链接跳转登录页', async () => {
    __setAuth(false);
    renderAt('/admin/participations');
    await waitFor(() => expect(screen.getByText('登录页')).toBeInTheDocument());
    expect(screen.queryByText('参与审核页')).not.toBeInTheDocument();
  });
});