import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, Settings } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface UserAvatarDropdownProps {
  /** 是否显示角色标签 */
  showRole?: boolean;
  /** 自定义头像尺寸 */
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-10 h-10 text-base',
};

export default function UserAvatarDropdown({ showRole = false, size = 'md' }: UserAvatarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const avatarInitial = user?.displayName?.charAt(0) ?? user?.username?.charAt(0) ?? 'U';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 头像按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-[#2EB87A] to-[#FFB347] p-[2px] hover:opacity-90 transition-opacity cursor-pointer`}
        aria-label="用户菜单"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[#2EB87A]">
          {avatarInitial}
        </div>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 用户信息头部 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-[#1A2E22] truncate">{user?.displayName || user?.username}</p>
            {showRole && (
              <p className="text-xs text-[#1A2E22]/60 mt-0.5">
                {user?.role === 'ADMIN' ? '系统管理员' : '员工'}
              </p>
            )}
            <p className="text-xs text-[#1A2E22]/40 mt-0.5 truncate">{user?.username}</p>
          </div>

          {/* 菜单项 */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my');
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="w-5 h-5 text-[#1A2E22]/50" />
              <span className="text-sm font-medium text-[#1A2E22]">个人中心</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my?tab=settings');
              }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5 text-[#1A2E22]/50" />
              <span className="text-sm font-medium text-[#1A2E22]">账号设置</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
