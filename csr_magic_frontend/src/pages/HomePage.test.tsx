import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import { activityApi } from '../services/activityApi';
import { participationApi } from '../services/participationApi';
import type { Activity } from '../types/activity';
import type { MyParticipation } from '../types/participation';

vi.mock('../services/activityApi', () => ({
  activityApi: {
    list: vi.fn(),
  },
}));

vi.mock('../services/participationApi', () => ({
  participationApi: {
    getMyParticipations: vi.fn(),
  },
}));

vi.mock('../components/ContributionStats', () => ({
  default: () => <div>统计卡片</div>,
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { displayName: string; username: string }; logout: () => void }) => unknown) =>
    selector({
      user: {
        displayName: 'Oliver',
        username: 'oliver',
      },
      logout: vi.fn(),
    }),
}));

const mockActivities: Activity[] = [
  {
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
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 2,
    eventId: 1,
    eventName: '2026春季CSR月',
    name: '公益义卖活动',
    description: '义卖募捐',
    templateType: 'DONATION',
    startTime: '2026-04-12T00:00:00Z',
    endTime: '2026-04-13T00:00:00Z',
    maxParticipants: 100,
    coverImage: null,
    status: 'ONGOING',
    formSchema: null,
    currentParticipants: 35,
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: null,
  },
];

const mockParticipations: MyParticipation[] = [
  {
    id: 11,
    activityId: 1,
    activityName: '春季植树活动',
    templateType: 'VOLUNTEER',
    state: 'APPROVED',
    rejectReason: null,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: null,
  },
];

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/activities" element={<div>活动列表页</div>} />
        <Route path="/my" element={<div>我的页面</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(activityApi.list).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: mockActivities,
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 12,
        },
      },
    } as Awaited<ReturnType<typeof activityApi.list>>);
    vi.mocked(participationApi.getMyParticipations).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: mockParticipations,
          totalElements: 1,
          totalPages: 1,
          page: 0,
          size: 5,
        },
      },
    } as Awaited<ReturnType<typeof participationApi.getMyParticipations>>);
  });

  it('渲染欢迎语、统计区、推荐活动和最近参与', async () => {
    renderHomePage();

    expect(screen.getByText('统计卡片')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Hi，Oliver/i)).toBeInTheDocument();
      expect(screen.getByText('推荐活动')).toBeInTheDocument();
      expect(screen.getByText('最近参与')).toBeInTheDocument();
      expect(screen.getByText('公益义卖活动')).toBeInTheDocument();
      expect(screen.getAllByText('春季植树活动').length).toBeGreaterThan(0);
    });
  });

  it('首次加载时调用活动和最近参与接口', async () => {
    renderHomePage();

    await waitFor(() => {
      expect(activityApi.list).toHaveBeenCalledWith({ page: 0, size: 12 });
      expect(participationApi.getMyParticipations).toHaveBeenCalledWith({ page: 0, size: 5 });
    });
  });

  it('活动接口失败时显示错误提示', async () => {
    vi.mocked(activityApi.list).mockRejectedValueOnce(new Error('network'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('加载推荐活动失败，请稍后重试')).toBeInTheDocument();
    });
  });

  it('最近参与接口失败时显示错误提示', async () => {
    vi.mocked(participationApi.getMyParticipations).mockRejectedValueOnce(new Error('network'));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('加载最近参与记录失败，请稍后重试')).toBeInTheDocument();
    });
  });

  it('点击查看全部跳转到活动列表页', async () => {
    const user = userEvent.setup();
    renderHomePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '查看全部' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '查看全部' }));

    await waitFor(() => {
      expect(screen.getByText('活动列表页')).toBeInTheDocument();
    });
  });
});
