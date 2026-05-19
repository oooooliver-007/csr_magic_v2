import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ActivityListPage from './ActivityListPage';
import { activityApi } from '../services/activityApi';
import { eventApi } from '../services/eventApi';
import type { Activity } from '../types/activity';

vi.mock('../services/activityApi', () => ({
  activityApi: {
    list: vi.fn(),
  },
}));

vi.mock('../services/eventApi', () => ({
  eventApi: {
    list: vi.fn(),
  },
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
    currentOccupiedSlots: 12,
    allowFamily: false,
    maxFamilyPerUser: null,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: null,
  },
  {
    id: 2,
    eventId: 1,
    eventName: '2026春季CSR月',
    name: '海滩清理行动',
    description: '清理海滩垃圾',
    templateType: 'VOLUNTEER',
    startTime: '2026-04-22T00:00:00Z',
    endTime: '2026-04-23T00:00:00Z',
    maxParticipants: 120,
    coverImage: null,
    status: 'ONGOING',
    formSchema: null,
    currentParticipants: 45,
    currentOccupiedSlots: 45,
    allowFamily: false,
    maxFamilyPerUser: null,
    createdAt: '2026-04-10T00:00:00Z',
    updatedAt: null,
  },
];

const mockActivityResponse = {
  data: {
    code: 200,
    message: 'success',
    data: {
      content: mockActivities,
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 9,
    },
  },
} as unknown as Awaited<ReturnType<typeof activityApi.list>>;

const mockEventResponse = {
  data: {
    code: 200,
    message: 'success',
    data: {
      content: [
        { id: 1, name: '2026春季CSR月', description: null, type: null, startDate: null, endDate: null, coverImage: null, visible: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
      ],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 100,
    },
  },
} as unknown as Awaited<ReturnType<typeof eventApi.list>>;

describe('ActivityListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(activityApi.list).mockResolvedValue(mockActivityResponse);
    vi.mocked(eventApi.list).mockResolvedValue(mockEventResponse);
  });

  it('加载后渲染活动卡片', async () => {
    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('春季植树活动')).toBeInTheDocument();
      expect(screen.getByText('海滩清理行动')).toBeInTheDocument();
    });
  });

  it('调用 activityApi.list 获取数据', async () => {
    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(activityApi.list).toHaveBeenCalledWith({
        page: 0,
        size: 9,
        keyword: undefined,
        templateType: undefined,
        status: undefined,
        eventId: undefined,
      });
    });
  });

  it('加载事件列表用于筛选', async () => {
    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(eventApi.list).toHaveBeenCalledWith({ size: 100 });
    });
  });

  it('API 失败时显示错误提示', async () => {
    vi.mocked(activityApi.list).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('加载活动列表失败，请稍后重试')).toBeInTheDocument();
    });
  });

  it('无数据时显示空状态', async () => {
    vi.mocked(activityApi.list).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: { content: [], totalElements: 0, totalPages: 0, page: 0, size: 9 },
      },
    } as unknown as Awaited<ReturnType<typeof activityApi.list>>);

    render(
      <MemoryRouter>
        <ActivityListPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('暂无可参与的活动')).toBeInTheDocument();
    });
  });
});
