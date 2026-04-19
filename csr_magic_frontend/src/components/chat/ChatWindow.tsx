import { useEffect, useRef } from 'react';
import type { ChatMessage } from '../../types/chat';
import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  /** 底部额外渲染区域（例如确认卡片、成功卡片、网络错误重试提示） */
  footer?: React.ReactNode;
  onTypewriterDone?: (messageId: string) => void;
  typewriterSpeedMs?: number;
}

/**
 * 对话消息列表 + 自动滚动
 */
export default function ChatWindow({
  messages,
  footer,
  onTypewriterDone,
  typewriterSpeedMs,
}: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, footer]);

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#F7FAF8]/50"
    >
      {messages.map((msg) => (
        <ChatBubble
          key={msg.id}
          message={msg}
          onTypewriterDone={onTypewriterDone}
          typewriterSpeedMs={typewriterSpeedMs}
        />
      ))}
      {footer && <div className="pt-2">{footer}</div>}
      <div ref={endRef} />
    </div>
  );
}
