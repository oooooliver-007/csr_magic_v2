import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ActivityDetailPage from './ActivityDetailPage';
import { activityApi } from '../services/activityApi';
import { participationApi } from '../services/participationApi';
import { surveyApi } from '../services/surveyApi';
import type { ActivityDetail, Participation } from '../types/participation';

vi.mock('../services/activityApi', () => ({
  activityApi: { getById: vi.fn() },
}));

vi.mock('../services/participationApi', () => ({
  participationApi: { signup: vi.fn(), withdraw: vi.fn(), resubmit: vi.fn() },
}));

vi.mock('../services/surveyApi', () => ({
  surveyApi: { getByActivityId: vi.fn(), hasUserSubmitted: vi.fn() },
}));

const pendingParticipation: Participation = {
  id: 5,
  userId: 1,
  userName: 'tester_boundary',
  userDisplayName: '测试用户',
  activityId: 1,
  activityName: '春季植树活动',
  state: 'PENDING',
  formData: null,
  rejectReason: null,
  reviewedById: null,
  reviewedByName: null,
  reviewedAt: null,
  createdAt: '2026-04-10T00:00:00Z',
  updatedAt: null,
  familyMembers: [],
};

const baseActivity: ActivityDetail = {
  id: 1,
  eventId: 1,
  eventName: '测试事件',
  name: '春季植树活动',
  description: '',
  templateType: 'BASIC',
  startTime: null,
  endTime: null,
  maxParticipants: 100,
  coverImage: null,
  status: 'UPCOMING',
  formSchema: null,
  currentParticipants: 1,
  currentOccupiedSlots: 1,
  allowFamily: false,
  maxFamilyPerUser: null,
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: null,
  currentUserParticipation: pendingParticipation,
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/activities/1']}>
      <Routes>
        <Route path="/activities/:id" element={<ActivityDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(surveyApi.getByActivityId).mockRejectedValue(new Error('无问卷'));
  vi.mocked(activityApi.getById).mockResolvedValue({ data: { data: baseActivity } } as never);
});

describe('ActivityDetailPage 退出确认与驳回重提', () => {
  it('退出活动弹出自定义确认框，确认后调用退出接口（BUG-02）', async () => {
    const user = userEvent.setup();
    vi.mocked(participationApi.withdraw).mockResolvedValue({ data: { code: 200, data: undefined } } as never);

    renderDetail();
    expect((await screen.findAllByText('报名状态')).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '退出活动' })[0]!);
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: '确认退出' }));

    await waitFor(() => expect(participationApi.withdraw).toHaveBeenCalledWith(5));
    expect(await screen.findByText('退出活动成功')).toBeInTheDocument();
  });

  it('取消退出时不调用接口且关闭确认框（BUG-02）', async () => {
    const user = userEvent.setup();
    renderDetail();
    expect((await screen.findAllByText('报名状态')).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '退出活动' })[0]!);
    await screen.findByRole('alertdialog');
    await user.click(screen.getByRole('button', { name: '取消' }));

    expect(participationApi.withdraw).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('驳回状态「修改后重新提交」走 resubmit 而非 signup（BUG-13）', async () => {
    const user = userEvent.setup();
    vi.mocked(activityApi.getById).mockResolvedValue({
      data: {
        data: {
          ...baseActivity,
          currentUserParticipation: {
            ...pendingParticipation,
            state: 'REJECTED' as const,
            rejectReason: '信息不完整',
          },
        },
      },
    } as never);
    vi.mocked(participationApi.resubmit).mockResolvedValue({
      data: { code: 200, data: { ...pendingParticipation, state: 'RE_SUBMITTED' as const } },
    } as never);

    renderDetail();
    expect((await screen.findAllByText('已驳回')).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '修改后重新提交' })[0]!);
    expect(screen.getAllByText('重新提交报名').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '提交报名' })[0]!);

    await waitFor(() => expect(participationApi.resubmit).toHaveBeenCalledTimes(1));
    expect(participationApi.signup).not.toHaveBeenCalled();
    expect(await screen.findByText('重新提交成功，请等待审核')).toBeInTheDocument();
  });

  it('正常报名仍走 signup 接口（回归）', async () => {
    const user = userEvent.setup();
    vi.mocked(activityApi.getById).mockResolvedValue({
      data: { data: { ...baseActivity, currentUserParticipation: null } },
    } as never);
    vi.mocked(participationApi.signup).mockResolvedValue({
      data: { code: 200, data: pendingParticipation },
    } as never);

    renderDetail();
    expect((await screen.findAllByText('立即报名')).length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: '提交报名' })[0]!);

    await waitFor(() => expect(participationApi.signup).toHaveBeenCalledTimes(1));
    expect(participationApi.resubmit).not.toHaveBeenCalled();
  });
});