import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AIPosterStudioPage from './AIPosterStudioPage';
import { posterApi } from '../services/posterApi';
import { participationApi } from '../services/participationApi';
import type { MyParticipation } from '../types/participation';

vi.mock('../services/posterApi', () => ({
  posterApi: {
    generate: vi.fn(),
    getStatus: vi.fn(),
    getMyPosters: vi.fn(),
  },
}));

vi.mock('../services/participationApi', () => ({
  participationApi: { getMyParticipations: vi.fn() },
}));

// 缩短轮询间隔，避免测试等待真实 3s
vi.mock('../constants/posterStyles', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../constants/posterStyles')>();
  return { ...actual, POLL_INTERVAL_MS: 10 };
});

const approvedParticipation: MyParticipation = {
  id: 1,
  activityId: 1,
  activityName: '春季植树活动',
  templateType: 'BASIC',
  state: 'APPROVED',
  rejectReason: null,
  createdAt: '2026-04-10T00:00:00Z',
  updatedAt: null,
  familyMembers: [],
};

function mockNavigatorShare(fn: unknown | undefined) {
  if (fn === undefined) {
    // @ts-expect-error jsdom 下删除 share 以模拟不支持
    delete navigator.share;
  } else {
    Object.defineProperty(navigator, 'share', { value: fn, configurable: true });
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(participationApi.getMyParticipations).mockResolvedValue({
    data: { data: { content: [approvedParticipation], totalElements: 1, totalPages: 1 } },
  } as never);
  vi.mocked(posterApi.getMyPosters).mockResolvedValue({
    data: { data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 12 } },
  } as never);
});

afterEach(() => {
  // @ts-expect-error 清理模拟能力
  delete navigator.share;
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AIPosterStudioPage />
    </MemoryRouter>
  );
}

describe('AIPosterStudioPage 海报生成防重复与分享', () => {
  it('生成进行中重复点击只发起一次生成任务（P05 防重复）', async () => {
    const user = userEvent.setup();
    // 永不 resolve 的生成请求：保持「生成中」状态
    vi.mocked(posterApi.generate).mockReturnValue(new Promise(() => {}));

    renderPage();
    await screen.findByText('春季植树活动');
    await user.selectOptions(screen.getByRole('combobox'), '1');

    const btn = screen.getByRole('button', { name: '生成海报' });
    await user.click(btn);
    await user.click(btn);

    expect(posterApi.generate).toHaveBeenCalledTimes(1);
  });

  it('支持系统分享时调用 navigator.share 并携带海报图片，不复用复制链接（BUG-12）', async () => {
    const user = userEvent.setup();
    const shareMock = vi.fn().mockResolvedValue(undefined);
    mockNavigatorShare(shareMock);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ blob: async () => new Blob(['x'], { type: 'image/png' }) }));
    vi.mocked(posterApi.generate).mockResolvedValue({ data: { code: 200, message: 'ok', data: { taskId: 't1' } } } as never);
    vi.mocked(posterApi.getStatus).mockResolvedValue({
      data: { code: 200, message: 'ok', data: { taskId: 't1', status: 'COMPLETED', posterUrl: '/api/v2/posters/1/image', errorMessage: null } },
    } as never);

    renderPage();
    await screen.findByText('春季植树活动');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '生成海报' }));

    await screen.findByRole('button', { name: '分享到动态' });
    await user.click(screen.getByRole('button', { name: '分享到动态' }));

    await waitFor(() =>
      expect(shareMock).toHaveBeenCalledWith(
        expect.objectContaining({ files: [expect.any(File)] })
      )
    );
    expect(writeText).not.toHaveBeenCalled();
  });

  it('用户取消系统分享（AbortError）时静默，不复制不报错', async () => {
    const user = userEvent.setup();
    mockNavigatorShare(vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.mocked(posterApi.generate).mockResolvedValue({ data: { code: 200, message: 'ok', data: { taskId: 't1' } } } as never);
    vi.mocked(posterApi.getStatus).mockResolvedValue({
      data: { code: 200, message: 'ok', data: { taskId: 't1', status: 'COMPLETED', posterUrl: '/api/v2/posters/1/image', errorMessage: null } },
    } as never);

    renderPage();
    await screen.findByText('春季植树活动');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '生成海报' }));
    await screen.findByRole('button', { name: '分享到动态' });
    await user.click(screen.getByRole('button', { name: '分享到动态' }));

    await new Promise((r) => setTimeout(r, 50));
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByText('分享失败，请稍后重试')).not.toBeInTheDocument();
  });

  it('不支持系统分享时降级复制海报链接并 toast（BUG-12 降级路径）', async () => {
    const user = userEvent.setup();
    mockNavigatorShare(undefined);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.mocked(posterApi.generate).mockResolvedValue({ data: { code: 200, message: 'ok', data: { taskId: 't1' } } } as never);
    vi.mocked(posterApi.getStatus).mockResolvedValue({
      data: { code: 200, message: 'ok', data: { taskId: 't1', status: 'COMPLETED', posterUrl: '/api/v2/posters/1/image', errorMessage: null } },
    } as never);

    renderPage();
    await screen.findByText('春季植树活动');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '生成海报' }));
    await screen.findByRole('button', { name: '分享到动态' });
    await user.click(screen.getByRole('button', { name: '分享到动态' }));

    expect(await screen.findByText('海报链接已复制')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('http://localhost:3000/api/v2/posters/1/image');
  });

  it('分享与复制均失败时展示错误 toast', async () => {
    const user = userEvent.setup();
    mockNavigatorShare(vi.fn().mockRejectedValue(new Error('not allowed')));
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard blocked'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    vi.mocked(posterApi.generate).mockResolvedValue({ data: { code: 200, message: 'ok', data: { taskId: 't1' } } } as never);
    vi.mocked(posterApi.getStatus).mockResolvedValue({
      data: { code: 200, message: 'ok', data: { taskId: 't1', status: 'COMPLETED', posterUrl: '/api/v2/posters/1/image', errorMessage: null } },
    } as never);

    renderPage();
    await screen.findByText('春季植树活动');
    await user.selectOptions(screen.getByRole('combobox'), '1');
    await user.click(screen.getByRole('button', { name: '生成海报' }));
    await screen.findByRole('button', { name: '分享到动态' });
    await user.click(screen.getByRole('button', { name: '分享到动态' }));

    expect(await screen.findByText('分享失败，请稍后重试')).toBeInTheDocument();
  });
});