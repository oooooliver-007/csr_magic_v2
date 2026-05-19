import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FamilyMembersInput from './FamilyMembersInput';
import type { FamilyMember } from '../types/participation';

describe('FamilyMembersInput', () => {
  const onChange = vi.fn();
  beforeEach(() => vi.clearAllMocks());

  it('渲染空列表和添加按钮', () => {
    render(<FamilyMembersInput value={[]} onChange={onChange} maxCount={3} />);
    expect(screen.getByText('携带家属（可选）')).toBeInTheDocument();
    expect(screen.getByText('添加家属')).toBeInTheDocument();
    expect(screen.getByText('0/3')).toBeInTheDocument();
  });

  it('点击添加按钮新增一行', () => {
    render(<FamilyMembersInput value={[]} onChange={onChange} maxCount={3} />);
    fireEvent.click(screen.getByText('添加家属'));
    expect(onChange).toHaveBeenCalledWith([{ name: '', relation: 'SPOUSE' }]);
  });

  it('点击删除按钮移除对应家属', () => {
    const members: FamilyMember[] = [
      { name: '张三', relation: 'SPOUSE' },
      { name: '李四', relation: 'CHILD' },
    ];
    render(<FamilyMembersInput value={members} onChange={onChange} maxCount={3} />);
    fireEvent.click(screen.getAllByTitle('删除')[0]!);
    expect(onChange).toHaveBeenCalledWith([{ name: '李四', relation: 'CHILD' }]);
  });

  it('达到上限时隐藏添加按钮', () => {
    const members: FamilyMember[] = [
      { name: 'A', relation: 'SPOUSE' },
      { name: 'B', relation: 'CHILD' },
    ];
    render(<FamilyMembersInput value={members} onChange={onChange} maxCount={2} />);
    expect(screen.queryByText('添加家属')).not.toBeInTheDocument();
  });

  it('disabled 时隐藏删除和添加按钮', () => {
    const members: FamilyMember[] = [{ name: '张三', relation: 'SPOUSE' }];
    render(<FamilyMembersInput value={members} onChange={onChange} maxCount={3} disabled />);
    expect(screen.queryByTitle('删除')).not.toBeInTheDocument();
    expect(screen.queryByText('添加家属')).not.toBeInTheDocument();
  });

  it('输入姓名触发 onChange', () => {
    const members: FamilyMember[] = [{ name: '', relation: 'SPOUSE' }];
    render(<FamilyMembersInput value={members} onChange={onChange} maxCount={3} />);
    fireEvent.change(screen.getByPlaceholderText('家属姓名'), { target: { value: '张三' } });
    expect(onChange).toHaveBeenCalledWith([{ name: '张三', relation: 'SPOUSE' }]);
  });

  it('切换关系触发 onChange', () => {
    const members: FamilyMember[] = [{ name: '张三', relation: 'SPOUSE' }];
    render(<FamilyMembersInput value={members} onChange={onChange} maxCount={3} />);
    fireEvent.change(screen.getByDisplayValue('配偶'), { target: { value: 'CHILD' } });
    expect(onChange).toHaveBeenCalledWith([{ name: '张三', relation: 'CHILD' }]);
  });
});
