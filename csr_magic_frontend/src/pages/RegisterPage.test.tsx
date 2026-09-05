import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';
import { authApi } from '../services/authApi';

vi.mock('../services/authApi', () => ({
  authApi: {
    register: vi.fn(),
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText(/姓名/), '测试用户');
  await userEvent.type(screen.getByLabelText(/用户名/), 'newuser');
  await userEvent.type(screen.getByLabelText(/密码/), '123456');
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterPage 注册回归', () => {
  it('重复用户名（409）时展示后端错误信息，不做静默失败（BUG-03 回归）', async () => {
    const error = Object.assign(new Error('Request failed with status code 409'), {
      response: { data: { message: '用户名已存在' } },
    });
    vi.mocked(authApi.register).mockRejectedValueOnce(error);

    renderPage();
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: '注册' }));

    expect(await screen.findByText('用户名已存在')).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledTimes(1);
  });

  it('不选性别可正常注册成功（BUG-05 回归：性别为可选字段）', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      data: { data: { accessToken: 'at', user: { id: 1, username: 'newuser', displayName: '测试用户', realName: null, gender: null, region: null, role: 'USER', createdAt: '2026-01-01T00:00:00Z' } } },
    } as never);

    renderPage();
    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: '注册' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });
    const payload = vi.mocked(authApi.register).mock.calls[0]?.[0];
    expect(payload?.gender).toBeUndefined();
    expect(screen.queryByText('注册失败，请重试')).not.toBeInTheDocument();
  });

  it('选择「男」时提交 gender=MALE 枚举值（BUG-09 口径统一）', async () => {
    vi.mocked(authApi.register).mockResolvedValue({
      data: { data: { accessToken: 'at', user: { id: 1, username: 'newuser', displayName: '测试用户', realName: null, gender: null, region: null, role: 'USER', createdAt: '2026-01-01T00:00:00Z' } } },
    } as never);

    renderPage();
    await fillValidForm();
    await userEvent.click(screen.getByLabelText('男'));
    await userEvent.click(screen.getByRole('button', { name: '注册' }));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });
    const payload = vi.mocked(authApi.register).mock.calls[0]?.[0];
    expect(payload?.gender).toBe('MALE');
  });
});