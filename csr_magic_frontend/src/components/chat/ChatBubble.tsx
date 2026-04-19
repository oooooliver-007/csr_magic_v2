import { useEffect, useState } from 'react';
import { Sparkles, User } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  /** 打字机动画完成后回调，用于清除 typewriter 标志，避免再次渲染时重复动画 */
  onTypewriterDone?: (messageId: string) => void;
  /** 打字机速度（毫秒/字），默认 30ms */
  typewriterSpeedMs?: number;
}

/**
 * 单条聊天消息气泡
 *
 * - USER 消息：右对齐，绿色背景，白色文字
 * - AI   消息：左对齐，白色卡片 + 绿色 Sparkles 图标，支持打字机动画
 * - 遵循原型 UI_UX_prototype/src/components/EmployeeApp.tsx 第 487-518 行
 */
export default function ChatBubble({
  message,
  onTypewriterDone,
  typewriterSpeedMs = 30,
}: ChatBubbleProps) {
  const isUser = message.role === 'USER';
  const isTypewriting = message.role === 'AI' && message.typewriter === true;
  const [displayText, setDisplayText] = useState(isTypewriting ? '' : message.content);

  useEffect(() => {
    if (!isTypewriting) {
      setDisplayText(message.content);
      return;
    }

    let idx = 0;
    setDisplayText('');
    const timer = window.setInterval(() => {
      idx += 1;
      setDisplayText(message.content.slice(0, idx));
      if (idx >= message.content.length) {
        window.clearInterval(timer);
        onTypewriterDone?.(message.id);
      }
    }, typewriterSpeedMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [message.id, message.content, isTypewriting, onTypewriterDone, typewriterSpeedMs]);

  return (
    <div
      data-role={message.role.toLowerCase()}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            isUser ? 'bg-gray-200' : 'bg-[#2EB87A]/10'
          }`}
          aria-hidden
        >
          {isUser ? (
            <User className="w-4 h-4 text-[#1A2E22]/70" />
          ) : (
            <Sparkles className="w-4 h-4 text-[#2EB87A]" />
          )}
        </div>
        <div
          className={`p-4 rounded-2xl whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-[#2EB87A] text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 shadow-sm text-[#1A2E22] rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed">
            {displayText}
            {isTypewriting && displayText.length < message.content.length && (
              <span
                aria-hidden
                className="inline-block w-1.5 h-4 align-[-2px] ml-0.5 bg-current animate-pulse"
              />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
