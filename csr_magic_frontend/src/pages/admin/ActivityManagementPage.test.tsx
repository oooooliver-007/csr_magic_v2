import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ActivityManagementPage from './ActivityManagementPage';
import { activityApi } from '../../services/activityApi';
import { eventApi } from '../../services/eventApi';
import type { Activity } from '../../types/activity';

vi.mock('../../services/activityApi', () => ({
  activityApi: { list: vi.fn(), delete: vi.fn() },
}));

vi.mock('../../services/eventApi', () => ({
  eventApi: { list: vi.fn() },
}));

const activity: Activity = {
  id: 1,
  eventId: 1,
  eventName: '测试事件',
  name: '春季植树活动',
  description: null,
  templateType: 'BASIC',
  startTime: null,
  endTime: null,
  maxParticipants: 100,
  coverImage: null,
  status: 'UPCOMING',
  formSchema: null,
  currentParticipants: 0,
  currentOccupiedSlots: 0,
  allowFamily: false,
  maxFamilyPerUser: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ActivityManagementPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(eventApi.list).mockResolvedValue({ data: { data: { content: [] } } } as never);
  vi.mocked(activityApi.list).mockResolvedValue({
    data: { data: { content: [activity], totalPages: 1, totalElements: 1 } },
  } as never);
});

describe('ActivityManagementPage 删除活动', () => {
  it('删除含报名记录的活动失败时展示后端明确文案且模态不关闭（BUG-11）', async () => {
    const user = userEvent.setup();
    const backendMsg = '该活动下还有 2 条报名记录，请先处理后再删除';
    vi.mocked(activityApi.delete).mockRejectedValueOnce(
      Object.assign(new Error('Request failed'), { response: { data: { message: backendMsg } } })
    );

    renderPage();
    expect((await screen.findAllByText('春季植树活动')).length).toBeGreaterThan(0);

    await user.click(screen.getByTitle('删除'));
    await user.click(screen.getByRole('button', { name: '确认删除' }));

    expect((await screen.findAllByText(backendMsg)).length).toBeGreaterThan(0);
    // 模态保持打开且确认按钮仍在
    expect(screen.getByRole('button', { name: '确认删除' })).toBeInTheDocument();
  });

  it('删除无关联记录的活动成功并关闭模态（回归）', async () => {
    const user = userEvent.setup();
    vi.mocked(activityApi.delete).mockResolvedValueOnce({ data: { code: 200, data: undefined } } as never);

    renderPage();
    expect((await screen.findAllByText('春季植树活动')).length).toBeGreaterThan(0);

    await user.click(screen.getByTitle('删除'));
    await user.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: '确认删除' })).not.toBeInTheDocument()
    );
    expect(screen.getByText('删除成功')).toBeInTheDocument();
  });
});