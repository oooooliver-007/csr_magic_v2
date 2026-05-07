import { useRef, useState, type CompositionEvent, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
}

/**
 * 对话底部输入框
 * - Enter 发送，Shift+Enter 换行
 * - 中文 IME：拼音候选阶段 Enter 只提交候选，不触发 send
 * - 发送中：输入框禁用 + loading 图标
 */
export default function ChatInput({
  onSend,
  disabled = false,
  sending = false,
  placeholder = '输入消息...',
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const composingRef = useRef(false);

  const isDisabled = disabled || sending;
  const canSend = !isDisabled && value.trim().length > 0;

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter' || e.shiftKey) return;
    // IME 候选阶段：浏览器在 keydown 上通过 isComposing / keyCode 229 表示未完成输入
    if (composingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }
    e.preventDefault();
    handleSend();
  };

  const handleCompositionStart = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = true;
  };
  const handleCompositionEnd = (_e: CompositionEvent<HTMLTextAreaElement>) => {
    composingRef.current = false;
  };

  return (
    <div className="p-4 bg-white border-t border-gray-100">
      <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          placeholder={placeholder}
          disabled={isDisabled}
          aria-label="聊天输入框"
          className="flex-1 resize-none pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:border-[#2EB87A] focus:bg-white focus:outline-none transition-all text-sm disabled:bg-gray-100 disabled:text-gray-400 max-h-32"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          aria-label="发送消息"
          className="absolute right-2 bottom-2 p-2 bg-[#2EB87A] text-white rounded-xl hover:bg-[#2EB87A]/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2EB87A] transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-label="发送中" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
