import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import { authApi } from '../services/authApi';

vi.mock('../services/authApi', () => ({
  authApi: { login: vi.fn() },
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { setAuth: () => void }) => unknown) =>
    selector({ setAuth: vi.fn() }),
}));

function renderLogin(from?: string) {
  return render(
    <MemoryRouter
      initialEntries={[{ pathname: '/login', state: from ? { from } : undefined }]}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/participations" element={<div>参与审核页面</div>} />
        <Route path="/admin" element={<div>管理端首页</div>} />
        <Route path="/activities" element={<div>活动列表页面</div>} />
        <Route path="/" element={<div>首页</div>} />
      </Routes>
    </MemoryRouter>
  );
}

async function submitLogin(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/用户名/), 'zhuyu');
  await user.type(screen.getByLabelText(/密码/), '123456');
  await user.click(screen.getByRole('button', { name: '登录' }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('LoginPage 深链接返回（admin-session 规格）', () => {
  it('登录成功后返回 PrivateRoute 记录的来源页面', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        data: {
          accessToken: 'at',
          user: { id: 1, username: 'zhuyu', displayName: '管理员', realName: null, gender: null, region: null, role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z' },
        },
      },
    } as never);

    renderLogin('/admin/participations');
    await submitLogin(user);

    expect(await screen.findByText('参与审核页面')).toBeInTheDocument();
  });

  it('无来源时按角色跳转管理端首页', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        data: {
          accessToken: 'at',
          user: { id: 1, username: 'zhuyu', displayName: '管理员', realName: null, gender: null, region: null, role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z' },
        },
      },
    } as never);

    renderLogin();
    await submitLogin(user);

    expect(authApi.login).toHaveBeenCalledWith({ username: 'zhuyu', password: '123456' });
    expect(await screen.findByText('管理端首页')).toBeInTheDocument();
  });

  it('管理员从根路径（from=/）登录仍应进入管理端，而非员工端', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        data: {
          accessToken: 'at',
          user: { id: 1, username: 'zhuyu', displayName: '管理员', realName: null, gender: null, region: null, role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z' },
        },
      },
    } as never);

    renderLogin('/');
    await submitLogin(user);

    expect(await screen.findByText('管理端首页')).toBeInTheDocument();
    expect(screen.queryByText('首页')).not.toBeInTheDocument();
  });

  it('管理员从员工页来源（from=/activities）登录也应进入管理端', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        data: {
          accessToken: 'at',
          user: { id: 1, username: 'zhuyu', displayName: '管理员', realName: null, gender: null, region: null, role: 'ADMIN', createdAt: '2026-01-01T00:00:00Z' },
        },
      },
    } as never);

    renderLogin('/activities');
    await submitLogin(user);

    expect(await screen.findByText('管理端首页')).toBeInTheDocument();
    expect(screen.queryByText('首页')).not.toBeInTheDocument();
  });

  it('员工从员工页来源登录返回来源页', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
      data: {
        data: {
          accessToken: 'at',
          user: { id: 2, username: 'zhangsan', displayName: '测试', realName: null, gender: null, region: null, role: 'USER', createdAt: '2026-01-01T00:00:00Z' },
        },
      },
    } as never);

    renderLogin('/activities');
    await submitLogin(user);

    expect(await screen.findByText('活动列表页面')).toBeInTheDocument();
    expect(screen.queryByText('管理端首页')).not.toBeInTheDocument();
  });
});