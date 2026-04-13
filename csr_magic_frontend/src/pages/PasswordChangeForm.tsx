import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { userApi } from '../services/userApi';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(6, '新密码长度不能少于6位'),
  confirmPassword: z.string().min(1, '请确认新密码'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function PasswordChangeForm() {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    setSaving(true);
    try {
      await userApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();
      setToast({ type: 'success', message: '密码修改成功' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '密码修改失败，请重试';
      setToast({ type: 'error', message: msg });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#1A2E22] mb-6">修改密码</h2>

      {/* Toast 提示 */}
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-[#2EB87A]/10 text-[#2EB87A]'
              : 'bg-red-50 text-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 当前密码 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">当前密码</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              {...register('currentPassword')}
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
              placeholder="请输入当前密码"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A2E22]/40 hover:text-[#1A2E22]/60"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* 新密码 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">新密码</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              {...register('newPassword')}
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
              placeholder="至少6位"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A2E22]/40 hover:text-[#1A2E22]/60"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>
          )}
        </div>

        {/* 确认新密码 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">确认新密码</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
              placeholder="再次输入新密码"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A2E22]/40 hover:text-[#1A2E22]/60"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2EB87A] text-white rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
          修改密码
        </button>
      </form>
    </div>
  );
}
