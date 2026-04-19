import { useEffect, useRef, useState, type UIEvent } from 'react';
import type { ChatMessage } from '../../types/chat';
import ChatBubble from './ChatBubble';

interface ChatWindowProps {
  messages: ChatMessage[];
  /** 底部额外渲染区域（例如确认卡片、成功卡片、网络错误重试提示） */
  footer?: React.ReactNode;
  onTypewriterDone?: (messageId: string) => void;
  typewriterSpeedMs?: number;
}

const STICK_TO_BOTTOM_THRESHOLD_PX = 100;

/**
 * 对话消息列表 + 智能滚动
 *
 * 规则：
 * - 当用户已经滚动到接近底部（< 100px）时，新消息到达自动滚到底；
 * - 当用户向上回滚查看历史时，不强制抢滚，避免跳读。
 */
export default function ChatWindow({
  messages,
  footer,
  onTypewriterDone,
  typewriterSpeedMs,
}: ChatWindowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);

  useEffect(() => {
    if (!stickToBottom) return;
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, footer, stickToBottom]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setStickToBottom(distanceFromBottom < STICK_TO_BOTTOM_THRESHOLD_PX);
  };

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      onScroll={handleScroll}
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
