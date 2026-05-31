import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminReviewTodoBell from './AdminReviewTodoBell';
import { participationApi } from '../services/participationApi';
import type { Participation } from '../types/participation';

vi.mock('../services/participationApi', () => ({
  participationApi: {
    getReviewTodos: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockTodos: Participation[] = [
  {
    id: 1,
    userId: 10,
    userName: 'test1',
    userDisplayName: '张三',
    activityId: 100,
    activityName: '环保植树',
    state: 'PENDING',
    formData: null,
    rejectReason: null,
    reviewedById: null,
    reviewedByName: null,
    reviewedAt: null,
    createdAt: '2026-05-31T12:00:00Z',
    updatedAt: null,
    familyMembers: [],
  },
  {
    id: 2,
    userId: 11,
    userName: 'test2',
    userDisplayName: '李四',
    activityId: 101,
    activityName: '爱心捐赠',
    state: 'RE_SUBMITTED',
    formData: null,
    rejectReason: null,
    reviewedById: null,
    reviewedByName: null,
    reviewedAt: null,
    createdAt: '2026-05-31T12:30:00Z',
    updatedAt: null,
    familyMembers: [],
  },
];

describe('AdminReviewTodoBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(participationApi.getReviewTodos).mockResolvedValue({
      data: {
        code: 200,
        message: 'success',
        data: {
          content: mockTodos,
          totalElements: 2,
          totalPages: 1,
          page: 0,
          size: 5,
        },
      },
    } as any);
  });

  it('初始加载并显示代办徽章数量', async () => {
    render(
      <MemoryRouter>
        <AdminReviewTodoBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(participationApi.getReviewTodos).toHaveBeenCalledWith({ page: 0, size: 5 });
    });

    // 徽章数量为 2
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('点击铃铛打开下拉列表，并显示待办列表内容', async () => {
    render(
      <MemoryRouter>
        <AdminReviewTodoBell />
      </MemoryRouter>
    );

    // 触发点击
    const bellButton = screen.getByTestId('admin-todo-bell');
    fireEvent.click(bellButton);

    // 等待加载
    await waitFor(() => {
      expect(screen.getByText('审批待办')).toBeInTheDocument();
    });

    expect(screen.getByText('2 项待处理')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('申请报名活动「环保植树」')).toBeInTheDocument();
    expect(screen.getByText('新提交')).toBeInTheDocument();

    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('申请报名活动「爱心捐赠」')).toBeInTheDocument();
    expect(screen.getByText('重新提交')).toBeInTheDocument();
  });

  it('点击待办行跳转到参与审核页并关闭下拉', async () => {
    render(
      <MemoryRouter>
        <AdminReviewTodoBell />
      </MemoryRouter>
    );

    const bellButton = screen.getByTestId('admin-todo-bell');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('张三')).toBeInTheDocument();
    });

    // 点击张三的待办
    fireEvent.click(screen.getByText('张三'));

    // 期待跳转
    expect(mockNavigate).toHaveBeenCalledWith('/admin/participations?state=PENDING');
    
    // 下拉应被关闭（在组件中 open 变为 false）
    expect(screen.queryByText('审批待办')).not.toBeInTheDocument();
  });

  it('点击“查看全部”按钮跳转到参与审核页', async () => {
    render(
      <MemoryRouter>
        <AdminReviewTodoBell />
      </MemoryRouter>
    );

    const bellButton = screen.getByTestId('admin-todo-bell');
    fireEvent.click(bellButton);

    await waitFor(() => {
      expect(screen.getByText('查看全部')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('查看全部'));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/participations?state=PENDING');
    expect(screen.queryByText('审批待办')).not.toBeInTheDocument();
  });
});
