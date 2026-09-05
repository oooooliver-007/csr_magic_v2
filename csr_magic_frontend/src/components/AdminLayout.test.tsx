import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import * as authStore from '../stores/authStore';

const __setUser = (authStore as unknown as { __setUser: (user: { displayName: string; role: string; username: string } | null) => void }).__setUser;

vi.mock('./AdminReviewTodoBell', () => ({
  default: () => <div data-testid="admin-review-todo-bell">待办铃铛</div>,
}));

vi.mock('../stores/authStore', () => {
  const mockState: {
    user: { displayName: string; role: string; username: string } | null;
  } = {
    user: { displayName: '管理员', role: 'ADMIN', username: 'zhuyu' },
  };
  const useAuthStore = (selector: (state: { user: typeof mockState.user; logout: () => void }) => unknown) =>
    selector({ user: mockState.user, logout: vi.fn() });
  return {
    useAuthStore,
    __setUser: (user: typeof mockState.user) => {
      mockState.user = user;
    },
  };
});

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>数据看板内容</div>} />
        </Route>
        <Route path="/" element={<div>返回首页</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  __setUser({ displayName: '管理员', role: 'ADMIN', username: 'zhuyu' });
});

describe('AdminLayout', () => {
  it('侧边栏不再有通知管理入口', () => {
    renderAdminLayout();
    expect(screen.queryByRole('link', { name: '通知管理' })).not.toBeInTheDocument();
  });

  it('顶部包含待审核任务铃铛', () => {
    renderAdminLayout();
    expect(screen.getByTestId('admin-review-todo-bell')).toBeInTheDocument();
  });

  it('非 ADMIN 用户访问被重定向首页（BUG-10 角色门禁）', async () => {
    __setUser({ displayName: '员工', role: 'USER', username: 'emp' });
    renderAdminLayout();
    await waitFor(() => expect(screen.getByText('返回首页')).toBeInTheDocument());
    expect(screen.queryByText('数据看板内容')).not.toBeInTheDocument();
  });

  it('ADMIN 用户正常渲染管理端', () => {
    renderAdminLayout();
    expect(screen.getByText('数据看板内容')).toBeInTheDocument();
    expect(screen.queryByText('返回首页')).not.toBeInTheDocument();
  });
});