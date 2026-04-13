import { useState, useEffect } from 'react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { userApi } from '../services/userApi';
import { useAuthStore } from '../stores/authStore';
import type { UserInfo } from '../types/user';
import ProfileInfoForm from './ProfileInfoForm';
import PasswordChangeForm from './PasswordChangeForm';

export default function MyProfilePage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getMe();
      setUser(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '获取个人信息失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const handleUpdateSuccess = (updatedUser: UserInfo) => {
    setUser(updatedUser);
    // 同步更新 authStore 中的用户信息
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (accessToken && refreshToken && authUser) {
      setAuth(accessToken, refreshToken, {
        ...authUser,
        displayName: updatedUser.displayName,
        realName: updatedUser.realName,
        gender: updatedUser.gender,
        region: updatedUser.region,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-red-500">{error ?? '获取个人信息失败'}</p>
        <button
          onClick={fetchMe}
          className="px-4 py-2 bg-[#2EB87A] text-white rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2E22]">个人中心</h1>
        <p className="text-[#1A2E22]/60 mt-1">管理你的个人信息和账号安全</p>
      </div>

      {/* 个人信息卡 */}
      <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#2EB87A] to-[#FFB347] p-[3px] flex-shrink-0">
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
            <UserIcon className="w-7 h-7 text-[#2EB87A]" />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1A2E22]">
            {user.displayName || user.username}
          </h2>
          <p className="text-[#1A2E22]/60 text-sm">
            @{user.username} · {user.role === 'ADMIN' ? '管理员' : '员工'}
            {user.region ? ` · ${user.region}` : ''}
          </p>
        </div>
      </div>

      {/* 表单区域：桌面端双列，移动端单列 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileInfoForm user={user} onUpdateSuccess={handleUpdateSuccess} />
        <PasswordChangeForm />
      </div>
    </div>
  );
}
