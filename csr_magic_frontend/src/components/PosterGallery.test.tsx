import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PosterGallery from './PosterGallery';
import { posterApi } from '../services/posterApi';
import type { PosterRecord } from '../types/poster';

vi.mock('../services/posterApi');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const completedPoster: PosterRecord = {
  id: 1,
  activityId: 10,
  activityName: '春季植树活动',
  taskId: 'task123',
  style: 'cartoon',
  userPrompt: null,
  status: 'COMPLETED',
  posterUrl: 'http://localhost:8000/static/posters/test.png',
  errorMessage: null,
  createdAt: '2026-04-15T10:00:00Z',
  updatedAt: null,
};

const pendingPoster: PosterRecord = {
  id: 2,
  activityId: 11,
  activityName: '夏季公益跑',
  taskId: 'task456',
  style: 'watercolor',
  userPrompt: null,
  status: 'GENERATING',
  posterUrl: null,
  errorMessage: null,
  createdAt: '2026-04-16T10:00:00Z',
  updatedAt: null,
};

describe('PosterGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有海报时渲染卡片网格', async () => {
    vi.mocked(posterApi.getMyPosters).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: [completedPoster, pendingPoster],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 12,
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <PosterGallery />
      </MemoryRouter>
    );

    // 仅显示 COMPLETED 且有 posterUrl 的海报
    await waitFor(() => {
      expect(screen.getByText('春季植树活动')).toBeInTheDocument();
    });
    expect(screen.queryByText('夏季公益跑')).not.toBeInTheDocument();
  });

  it('无海报时显示空状态', async () => {
    vi.mocked(posterApi.getMyPosters).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: 12,
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <PosterGallery />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('暂无海报')).toBeInTheDocument();
    });
    expect(screen.getByText('去生成海报')).toBeInTheDocument();
  });

  it('空状态点击"去生成海报"跳转到 /poster', async () => {
    const user = userEvent.setup();
    vi.mocked(posterApi.getMyPosters).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 12 },
      },
    } as never);

    render(
      <MemoryRouter>
        <PosterGallery />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('去生成海报')).toBeInTheDocument();
    });

    await user.click(screen.getByText('去生成海报'));
    expect(mockNavigate).toHaveBeenCalledWith('/poster');
  });

  it('点击卡片打开 Lightbox', async () => {
    const user = userEvent.setup();
    vi.mocked(posterApi.getMyPosters).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: [completedPoster],
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 12,
        },
      },
    } as never);

    render(
      <MemoryRouter>
        <PosterGallery />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('春季植树活动')).toBeInTheDocument();
    });

    // 点击卡片按钮
    await user.click(screen.getByRole('button'));

    // Lightbox 应该出现，包含大图和下载按钮
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('下载')).toBeInTheDocument();
    });
  });

  it('API 错误时显示错误状态和重试按钮', async () => {
    vi.mocked(posterApi.getMyPosters).mockRejectedValue({
      response: { data: { message: '服务异常' } },
    });

    render(
      <MemoryRouter>
        <PosterGallery />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('服务异常')).toBeInTheDocument();
    });
    expect(screen.getByText('重试')).toBeInTheDocument();
  });
});
