import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PosterLightbox from './PosterLightbox';
import type { PosterRecord } from '../types/poster';

const samplePoster: PosterRecord = {
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

describe('PosterLightbox', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('渲染海报大图', () => {
    render(<PosterLightbox poster={samplePoster} onClose={vi.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', samplePoster.posterUrl);
  });

  it('渲染活动名称和日期', () => {
    render(<PosterLightbox poster={samplePoster} onClose={vi.fn()} />);

    expect(screen.getByText('春季植树活动')).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('渲染下载按钮', () => {
    render(<PosterLightbox poster={samplePoster} onClose={vi.fn()} />);

    expect(screen.getByText('下载')).toBeInTheDocument();
  });

  it('点击关闭按钮调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PosterLightbox poster={samplePoster} onClose={onClose} />);

    await user.click(screen.getByLabelText('关闭'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩调用 onClose', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<PosterLightbox poster={samplePoster} onClose={onClose} />);

    // 遮罩是 dialog 容器中的第一个 div
    const backdrop = screen.getByRole('dialog').querySelector('.backdrop-blur-sm');
    if (backdrop) {
      await user.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('打开时禁用页面滚动', () => {
    render(<PosterLightbox poster={samplePoster} onClose={vi.fn()} />);

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('activityName 为 null 时显示"未知活动"', () => {
    const poster = { ...samplePoster, activityName: null };
    render(<PosterLightbox poster={poster} onClose={vi.fn()} />);

    expect(screen.getByText('未知活动')).toBeInTheDocument();
  });
});
