import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SignupForm from './SignupForm';
import type { Activity } from '../types/activity';

const baseActivity: Activity = {
  id: 1,
  eventId: 1,
  eventName: '测试事件',
  name: '测试活动',
  description: '',
  templateType: 'BASIC',
  startTime: '2026-04-15T00:00:00Z',
  endTime: '2026-04-16T00:00:00Z',
  maxParticipants: 50,
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

describe('SignupForm 家属同行', () => {
  it('activity.allowFamily=false 时不渲染家属区块', () => {
    render(
      <SignupForm
        templateType="BASIC"
        formSchemaJson={null}
        onSubmit={vi.fn()}
        activity={baseActivity}
      />
    );
    expect(screen.queryByText('携带家属（可选）')).not.toBeInTheDocument();
  });

  it('activity.allowFamily=true 时渲染家属区块', () => {
    const activity: Activity = { ...baseActivity, allowFamily: true, maxFamilyPerUser: 3 };
    render(
      <SignupForm
        templateType="BASIC"
        formSchemaJson={null}
        onSubmit={vi.fn()}
        activity={activity}
      />
    );
    expect(screen.getByText('携带家属（可选）')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('initialFamilyMembers 正确回填', () => {
    const activity: Activity = { ...baseActivity, allowFamily: true, maxFamilyPerUser: 3 };
    render(
      <SignupForm
        templateType="BASIC"
        formSchemaJson={null}
        onSubmit={vi.fn()}
        activity={activity}
        initialFamilyMembers={[
          { name: '张三', relation: 'SPOUSE' },
          { name: '李四', relation: 'CHILD' },
        ]}
      />
    );
    expect(screen.getByDisplayValue('张三')).toBeInTheDocument();
    expect(screen.getByDisplayValue('李四')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });
});
