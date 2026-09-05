import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParticipationStatus from './ParticipationStatus';
import type { Participation } from '../types/participation';

const baseParticipation: Participation = {
  id: 1,
  userId: 1,
  userName: 'tester_boundary',
  userDisplayName: '测试用户',
  activityId: 1,
  activityName: 'Running1',
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

function renderStatus(participation: Participation) {
  return render(
    <ParticipationStatus
      participation={participation}
      onWithdraw={vi.fn()}
      onResubmit={vi.fn()}
      withdrawing={false}
      activityEnded={false}
    />
  );
}

describe('ParticipationStatus 家属回显', () => {
  it('携带家属时回显家属姓名与关系（BUG-08）', () => {
    renderStatus({
      ...baseParticipation,
      familyMembers: [
        { name: '张三', relation: 'SPOUSE' },
        { name: '李四', relation: 'CHILD' },
      ],
    });

    expect(screen.getByText('携带家属')).toBeInTheDocument();
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('配偶')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('子女')).toBeInTheDocument();
  });

  it('无家属时不渲染携带家属区块', () => {
    renderStatus(baseParticipation);

    expect(screen.queryByText('携带家属')).not.toBeInTheDocument();
  });
});