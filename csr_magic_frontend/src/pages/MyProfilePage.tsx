import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { userApi } from '../services/userApi';
import { participationApi } from '../services/participationApi';
import { useAuthStore } from '../stores/authStore';
import type { UserInfo } from '../types/user';
import type { MyParticipation } from '../types/participation';
import ProfileInfoForm from './ProfileInfoForm';
import PasswordChangeForm from './PasswordChangeForm';
import ContributionStats from '../components/ContributionStats';
import ParticipationList from '../components/ParticipationList';
import MyPosterGallery from '../components/MyPosterGallery';

type TabKey = 'settings' | 'participations' | 'posters';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'settings', label: '个人设置' },
  { key: 'participations', label: '参与记录' },
  { key: 'posters', label: '我的海报' },
];

export default function MyProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<TabKey>('settings');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (initialTab === 'participations' || initialTab === 'posters' || initialTab === 'settings') {
      setActiveTab(initialTab as TabKey);
    }
  }, [initialTab]);

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

  const handleExportCsv = useCallback(async () => {
    try {
      // 获取所有记录（最多1000条）用于导出
      const res = await participationApi.getMyParticipations({ page: 0, size: 1000 });
      const records = res.data.data.content;
      if (records.length === 0) return;

      const stateLabels: Record<string, string> = {
        PENDING: '待审核',
        APPROVED: '已通过',
        REJECTED: '已驳回',
        RE_SUBMITTED: '已重提',
      };

      const header = '活动名称,活动类型,参与时间,状态,驳回原因';
      const rows = records.map((r: MyParticipation) =>
        [
          `"${r.activityName}"`,
          r.templateType,
          new Date(r.createdAt).toLocaleString('zh-CN'),
          stateLabels[r.state] ?? r.state,
          r.rejectReason ? `"${r.rejectReason}"` : '',
        ].join(',')
      );

      const bom = '\uFEFF';
      const csv = bom + [header, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `我的参与记录_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '导出失败';
      alert(msg);
    }
  }, []);

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
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A2E22]">
          Hi, {user.displayName || user.username} 👋
        </h1>
      </div>

      {/* 贡献统计卡片 */}
      <ContributionStats />

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

      {/* Tab 栏 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setSearchParams(tab.key === 'settings' ? {} : { tab: tab.key });
              }}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#2EB87A] text-[#2EB87A]'
                  : 'border-transparent text-[#1A2E22]/60 hover:text-[#1A2E22]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProfileInfoForm user={user} onUpdateSuccess={handleUpdateSuccess} />
          <PasswordChangeForm />
        </div>
      )}

      {activeTab === 'participations' && (
        <ParticipationList onExport={handleExportCsv} />
      )}

      {activeTab === 'posters' && (
        <MyPosterGallery />
      )}
    </div>
  );
}
