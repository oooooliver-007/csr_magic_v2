import { useState } from 'react';
import { X } from 'lucide-react';

interface ResetPasswordDialogProps {
  open: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: (newPassword: string) => void;
}

export default function ResetPasswordDialog({ open, userName, onClose, onConfirm }: ResetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setError('');
    onConfirm(password);
    setPassword('');
    setConfirmPassword('');
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-[#1A2E22]/20 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#1A2E22]">重置密码</h3>
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#1A2E22]/60" />
            </button>
          </div>
          <p className="text-sm text-[#1A2E22]/70">
            为用户 <span className="font-medium text-[#1A2E22]">{userName}</span> 设置新密码
          </p>

          <div className="space-y-3">
            <input
              type="password"
              placeholder="输入新密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
            <input
              type="password"
              placeholder="确认新密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-gray-50 transition-colors text-sm"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] font-medium text-white hover:bg-[#2EB87A]/90 transition-colors text-sm"
            >
              确认重置
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
