import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventViewDrawer from './EventViewDrawer';
import type { Event } from '../../types/event';

const mockEvent: Event = {
  id: 1,
  name: '2026春季CSR月',
  description: '春季CSR活动集合',
  type: 'OFFLINE',
  startDate: '2026-04-01T00:00:00Z',
  endDate: '2026-04-30T00:00:00Z',
  coverImage: null,
  visible: true,
  createdAt: '2026-03-15T00:00:00Z',
  updatedAt: null,
};

describe('EventViewDrawer', () => {
  it('open=false 时不渲染内容', () => {
    const { container } = render(
      <EventViewDrawer open={false} event={mockEvent} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('open=true 时显示事件详情', () => {
    render(<EventViewDrawer open={true} event={mockEvent} onClose={vi.fn()} />);

    expect(screen.getByText('事件详情')).toBeInTheDocument();
    expect(screen.getByText('2026春季CSR月')).toBeInTheDocument();
    expect(screen.getByText('春季CSR活动集合')).toBeInTheDocument();
    expect(screen.getByText('线下')).toBeInTheDocument();
    expect(screen.getByText('已显示')).toBeInTheDocument();
  });

  it('隐藏事件显示"已隐藏"', () => {
    const hiddenEvent = { ...mockEvent, visible: false };
    render(<EventViewDrawer open={true} event={hiddenEvent} onClose={vi.fn()} />);

    expect(screen.getByText('已隐藏')).toBeInTheDocument();
  });

  it('点击关闭按钮调用 onClose', () => {
    const onClose = vi.fn();
    render(<EventViewDrawer open={true} event={mockEvent} onClose={onClose} />);

    fireEvent.click(screen.getByText('关闭'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('event=null 时不渲染', () => {
    const { container } = render(
      <EventViewDrawer open={true} event={null} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });
});
