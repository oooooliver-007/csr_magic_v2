import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivityFilters from './ActivityFilters';

const defaultProps = {
  keyword: '',
  onKeywordChange: vi.fn(),
  activeTemplateType: null,
  onTemplateTypeChange: vi.fn(),
  activeStatus: null,
  onStatusChange: vi.fn(),
  activeEventId: null,
  onEventIdChange: vi.fn(),
  events: [] as { id: number; name: string; description: null; type: null; startDate: null; endDate: null; coverImage: null; visible: true; createdAt: string; updatedAt: null }[],
};

describe('ActivityFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('渲染标题"探索活动"', () => {
    render(<ActivityFilters {...defaultProps} />);
    expect(screen.getByText('探索活动')).toBeInTheDocument();
  });

  it('渲染搜索框', () => {
    render(<ActivityFilters {...defaultProps} />);
    expect(screen.getByPlaceholderText('搜索活动...')).toBeInTheDocument();
  });

  it('搜索框输入触发 onKeywordChange', async () => {
    const user = userEvent.setup();
    render(<ActivityFilters {...defaultProps} />);

    const input = screen.getByPlaceholderText('搜索活动...');
    await user.type(input, '植树');

    expect(defaultProps.onKeywordChange).toHaveBeenCalled();
  });

  it('渲染模板类型筛选按钮', () => {
    render(<ActivityFilters {...defaultProps} />);

    expect(screen.getByText('全部类型')).toBeInTheDocument();
    expect(screen.getByText(/志愿者/)).toBeInTheDocument();
    expect(screen.getByText(/捐赠/)).toBeInTheDocument();
    expect(screen.getByText(/签到/)).toBeInTheDocument();
  });

  it('点击模板类型筛选按钮触发回调', async () => {
    const user = userEvent.setup();
    render(<ActivityFilters {...defaultProps} />);

    await user.click(screen.getByText(/志愿者/));
    expect(defaultProps.onTemplateTypeChange).toHaveBeenCalledWith('VOLUNTEER');
  });

  it('渲染状态筛选按钮', () => {
    render(<ActivityFilters {...defaultProps} />);

    expect(screen.getByText('全部状态')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('即将开始')).toBeInTheDocument();
    expect(screen.getByText('已结束')).toBeInTheDocument();
  });

  it('点击状态筛选按钮触发回调', async () => {
    const user = userEvent.setup();
    render(<ActivityFilters {...defaultProps} />);

    await user.click(screen.getByText('进行中'));
    expect(defaultProps.onStatusChange).toHaveBeenCalledWith('ONGOING');
  });

  it('有事件列表时渲染下拉选择框', () => {
    const events = [
      { id: 1, name: '2026春季CSR月', description: null, type: null, startDate: null, endDate: null, coverImage: null, visible: true as const, createdAt: '2026-01-01T00:00:00Z', updatedAt: null },
    ];
    render(<ActivityFilters {...defaultProps} events={events} />);

    expect(screen.getByText('全部事件')).toBeInTheDocument();
    expect(screen.getByText('2026春季CSR月')).toBeInTheDocument();
  });
});
