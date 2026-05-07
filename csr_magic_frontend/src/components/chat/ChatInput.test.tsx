import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from './ChatInput';

describe('ChatInput', () => {
  it('按 Enter 发送并清空输入框', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByLabelText('聊天输入框') as HTMLTextAreaElement;
    await user.type(textarea, 'hello world');
    await user.keyboard('{Enter}');

    expect(onSend).toHaveBeenCalledWith('hello world');
    expect(textarea.value).toBe('');
  });

  it('Shift+Enter 不发送，仅换行', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const textarea = screen.getByLabelText('聊天输入框') as HTMLTextAreaElement;
    await user.type(textarea, 'line1');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    await user.type(textarea, 'line2');

    expect(onSend).not.toHaveBeenCalled();
    expect(textarea.value).toBe('line1\nline2');
  });

  it('disabled / sending 时禁用输入与按钮', () => {
    render(<ChatInput onSend={vi.fn()} sending />);
    expect(screen.getByLabelText('聊天输入框')).toBeDisabled();
    expect(screen.getByLabelText('发送消息')).toBeDisabled();
  });

  it('空白内容不会触发 onSend', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    await user.type(screen.getByLabelText('聊天输入框'), '   ');
    await user.keyboard('{Enter}');
    expect(onSend).not.toHaveBeenCalled();
  });
});
