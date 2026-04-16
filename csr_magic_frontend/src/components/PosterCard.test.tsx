import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PosterCard from './PosterCard';
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

describe('PosterCard', () => {
  it('渲染海报缩略图', () => {
    render(<PosterCard poster={samplePoster} onClick={vi.fn()} />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', samplePoster.posterUrl);
    expect(img).toHaveAttribute('alt', '春季植树活动');
  });

  it('渲染活动名称', () => {
    render(<PosterCard poster={samplePoster} onClick={vi.fn()} />);

    expect(screen.getByText('春季植树活动')).toBeInTheDocument();
  });

  it('渲染格式化的生成时间', () => {
    render(<PosterCard poster={samplePoster} onClick={vi.fn()} />);

    // 日期格式化后应包含 2026 年 4 月
    const dateEl = screen.getByText(/2026/);
    expect(dateEl).toBeInTheDocument();
  });

  it('activityName 为 null 时显示"未知活动"', () => {
    const poster = { ...samplePoster, activityName: null };
    render(<PosterCard poster={poster} onClick={vi.fn()} />);

    expect(screen.getByText('未知活动')).toBeInTheDocument();
  });

  it('posterUrl 为 null 时显示占位符', () => {
    const poster = { ...samplePoster, posterUrl: null };
    render(<PosterCard poster={poster} onClick={vi.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('点击卡片触发 onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PosterCard poster={samplePoster} onClick={onClick} />);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
