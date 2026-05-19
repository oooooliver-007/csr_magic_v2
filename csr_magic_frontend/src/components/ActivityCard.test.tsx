import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ActivityCard from './ActivityCard';
import type { Activity } from '../types/activity';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const sampleActivity: Activity = {
  id: 1,
  eventId: 1,
  eventName: '2026春季CSR月',
  name: '春季植树活动',
  description: '参与植树造林',
  templateType: 'VOLUNTEER',
  startTime: '2026-04-15T00:00:00Z',
  endTime: '2026-04-16T00:00:00Z',
  maxParticipants: 50,
  coverImage: null,
  status: 'UPCOMING',
  formSchema: null,
  currentParticipants: 12,
  currentOccupiedSlots: 12,
  allowFamily: false,
  maxFamilyPerUser: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: null,
};

describe('ActivityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染活动名称和事件名称', () => {
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    expect(screen.getByText('春季植树活动')).toBeInTheDocument();
    expect(screen.getByText('2026春季CSR月')).toBeInTheDocument();
  });

  it('渲染模板类型 Badge', () => {
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    expect(screen.getByText('志愿者')).toBeInTheDocument();
  });

  it('渲染状态标签', () => {
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    expect(screen.getByText('即将开始')).toBeInTheDocument();
  });

  it('渲染参与人数', () => {
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    expect(screen.getByText('12 / 50 人参与')).toBeInTheDocument();
  });

  it('无 maxParticipants 时不显示上限', () => {
    const activity = { ...sampleActivity, maxParticipants: null };
    render(
      <MemoryRouter>
        <ActivityCard activity={activity} />
      </MemoryRouter>
    );

    expect(screen.getByText('12 人参与')).toBeInTheDocument();
  });

  it('点击查看详情按钮导航到详情页', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    await user.click(screen.getByText('查看详情'));
    expect(mockNavigate).toHaveBeenCalledWith('/activities/1');
  });

  it('无封面图时显示占位符', () => {
    render(
      <MemoryRouter>
        <ActivityCard activity={sampleActivity} />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('有封面图时显示图片', () => {
    const activity = { ...sampleActivity, coverImage: 'https://example.com/image.jpg' };
    render(
      <MemoryRouter>
        <ActivityCard activity={activity} />
      </MemoryRouter>
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    expect(img).toHaveAttribute('alt', '春季植树活动');
  });
});
