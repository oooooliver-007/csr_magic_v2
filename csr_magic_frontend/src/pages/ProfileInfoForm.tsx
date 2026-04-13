import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Loader2 } from 'lucide-react';
import { userApi } from '../services/userApi';
import type { UserInfo } from '../types/user';

const profileSchema = z.object({
  displayName: z.string().max(100, '昵称最多100个字符').optional(),
  realName: z.string().max(100, '真名最多100个字符').optional(),
  gender: z.string().optional(),
  region: z.string().max(100, '地区最多100个字符').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileInfoFormProps {
  user: UserInfo;
  onUpdateSuccess: (user: UserInfo) => void;
}

const GENDER_OPTIONS = [
  { value: '', label: '不设置' },
  { value: 'MALE', label: '男' },
  { value: 'FEMALE', label: '女' },
];

const REGION_OPTIONS = [
  { value: '', label: '请选择地区' },
  { value: '北京', label: '北京' },
  { value: '上海', label: '上海' },
  { value: '广州', label: '广州' },
  { value: '深圳', label: '深圳' },
  { value: '杭州', label: '杭州' },
  { value: '成都', label: '成都' },
  { value: '武汉', label: '武汉' },
  { value: '南京', label: '南京' },
  { value: '西安', label: '西安' },
  { value: '重庆', label: '重庆' },
];

export default function ProfileInfoForm({ user, onUpdateSuccess }: ProfileInfoFormProps) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user.displayName ?? '',
      realName: user.realName ?? '',
      gender: user.gender ?? '',
      region: user.region ?? '',
    },
  });

  useEffect(() => {
    reset({
      displayName: user.displayName ?? '',
      realName: user.realName ?? '',
      gender: user.gender ?? '',
      region: user.region ?? '',
    });
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setSaving(true);
    try {
      const res = await userApi.updateMe({
        displayName: data.displayName || undefined,
        realName: data.realName || undefined,
        gender: data.gender || undefined,
        region: data.region || undefined,
      });
      onUpdateSuccess(res.data.data);
      setToast('个人信息更新成功');
      setTimeout(() => setToast(null), 3000);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '更新失败，请重试';
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-[#1A2E22] mb-6">个人信息</h2>

      {/* Toast 提示 */}
      {toast && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#2EB87A]/10 text-[#2EB87A] text-sm font-medium">
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* 用户名（只读） */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">用户名</label>
          <input
            type="text"
            value={user.username}
            disabled
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[#1A2E22]/50 cursor-not-allowed"
          />
        </div>

        {/* 昵称 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">昵称</label>
          <input
            type="text"
            {...register('displayName')}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
            placeholder="请输入昵称"
          />
          {errors.displayName && (
            <p className="text-red-500 text-xs mt-1">{errors.displayName.message}</p>
          )}
        </div>

        {/* 真名 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">真名</label>
          <input
            type="text"
            {...register('realName')}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors"
            placeholder="请输入真名"
          />
          {errors.realName && (
            <p className="text-red-500 text-xs mt-1">{errors.realName.message}</p>
          )}
        </div>

        {/* 性别 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">性别</label>
          <select
            {...register('gender')}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors bg-white"
          >
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 地区 */}
        <div>
          <label className="block text-sm font-medium text-[#1A2E22]/70 mb-1.5">地区</label>
          <select
            {...register('region')}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2EB87A]/30 focus:border-[#2EB87A] transition-colors bg-white"
          >
            {REGION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 提交按钮 */}
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2EB87A] text-white rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          保存
        </button>
      </form>
    </div>
  );
}
