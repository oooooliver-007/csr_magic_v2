import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ChatBubble from './ChatBubble';
import type { ChatMessage } from '../../types/chat';

function makeMessage(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'm1',
    role: 'AI',
    content: 'hello',
    createdAt: '2026-04-19T00:00:00Z',
    typewriter: false,
    ...overrides,
  };
}

describe('ChatBubble', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('用户消息右对齐 + 绿色背景文字', () => {
    const { container } = render(
      <ChatBubble message={makeMessage({ id: 'u1', role: 'USER', content: '你好' })} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-role', 'user');
    expect(root.className).toContain('justify-end');
    expect(screen.getByText('你好')).toBeInTheDocument();
  });

  it('AI 消息左对齐', () => {
    const { container } = render(
      <ChatBubble message={makeMessage({ content: '欢迎' })} />,
    );
    const root = container.firstChild as HTMLElement;
    expect(root).toHaveAttribute('data-role', 'ai');
    expect(root.className).toContain('justify-start');
  });

  it('AI 消息启用 typewriter 时逐字显示并在结束时触发回调', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(
      <ChatBubble
        message={makeMessage({ content: 'abc', typewriter: true })}
        onTypewriterDone={onDone}
        typewriterSpeedMs={10}
      />,
    );

    // 初始没有文本
    expect(screen.queryByText('abc')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10);
    });
    expect(screen.getByText('a')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(20);
    });
    expect(screen.getByText('abc')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledWith('m1');
  });
});
