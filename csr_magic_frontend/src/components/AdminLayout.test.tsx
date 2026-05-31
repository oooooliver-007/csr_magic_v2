import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout';

vi.mock('./AdminReviewTodoBell', () => ({
  default: () => (
    <div data-testid="admin-review-todo-bell">待办铃铛</div>
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
  it('侧边栏不再有通知管理入口', () => {
    renderAdminLayout();

    expect(screen.queryByRole('link', { name: '通知管理' })).not.toBeInTheDocument();
  });

  it('顶部包含待审核任务铃铛', () => {
    renderAdminLayout();

    expect(screen.getByTestId('admin-review-todo-bell')).toBeInTheDocument();
  });
});
