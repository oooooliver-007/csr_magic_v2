import { useState } from 'react';
import { X, Check, ClipboardList, Shield } from 'lucide-react';
import type { UserDetail } from '../../types/user';

interface UserDetailPanelProps {
  user: UserDetail;
  onClose: () => void;
  onToggleRole: (userId: number, newRole: string) => void;
  onResetPassword: (userId: number) => void;
  onSave: (userId: number, data: { displayName: string; realName: string; region: string }) => void;
}

export default function UserDetailPanel({
  user,
  onClose,
  onToggleRole,
  onResetPassword,
  onSave,
}: UserDetailPanelProps) {
  const [editDisplayName, setEditDisplayName] = useState(user.displayName || '');
  const [editRealName, setEditRealName] = useState(user.realName || '');
  const [editRegion, setEditRegion] = useState(user.region || '');
  const [roleConfirm, setRoleConfirm] = useState(false);

  const initials = (user.displayName || user.username)
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleRoleToggle = () => {
    if (!roleConfirm) {
      setRoleConfirm(true);
      return;
    }
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    onToggleRole(user.id, newRole);
    setRoleConfirm(false);
  };

  const handleSave = () => {
    onSave(user.id, {
      displayName: editDisplayName,
      realName: editRealName,
      region: editRegion,
    });
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'PENDING': return '待审核';
      case 'APPROVED': return '已通过';
      case 'REJECTED': return '已驳回';
      case 'RE_SUBMITTED': return '已重提';
      default: return state;
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'APPROVED':
        return (
          <div className="w-8 h-8 rounded-full bg-[#2EB87A]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4 text-[#2EB87A]" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
        );
    }
  };

  return (
    <div className="absolute top-0 right-0 w-[400px] h-full bg-white rounded-2xl border border-gray-100 shadow-xl flex flex-col z-10 animate-in slide-in-from-right-8">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
        <h2 className="text-lg font-bold text-[#1A2E22]">用户详情</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#1A2E22]/60" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* 用户头像和基本信息 */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#2EB87A]/20 to-[#FFB347]/20 flex items-center justify-center text-[#1A2E22] font-bold text-2xl mb-3">
            {initials}
          </div>
          <h3 className="text-xl font-bold text-[#1A2E22]">{user.displayName || user.username}</h3>
          <p className="text-[#1A2E22]/60 text-sm">{user.username}</p>
          <div className="flex gap-2 mt-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
              {user.role === 'ADMIN' ? '管理员' : '员工'}
            </span>
            {user.region && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                {user.region}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* 编辑信息 */}
          <div>
            <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">基本信息</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#1A2E22]/60 mb-1 block">显示昵称</label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#1A2E22]/60 mb-1 block">真实姓名</label>
                <input
                  type="text"
                  value={editRealName}
                  onChange={(e) => setEditRealName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-[#1A2E22]/60 mb-1 block">地区</label>
                <input
                  type="text"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* CSR 统计 */}
          <div>
            <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">CSR 统计</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-[#1A2E22]/60 mb-1">参与活动</p>
                <p className="text-xl font-bold text-[#2EB87A]">{user.participationCount}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-xs text-[#1A2E22]/60 mb-1">注册时间</p>
                <p className="text-sm font-bold text-[#1A2E22]">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* 权限设置 */}
          <div>
            <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">账户设置</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-100 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-[#1A2E22]">管理员权限</p>
                  <p className="text-xs text-[#1A2E22]/50">可管理活动和用户</p>
                </div>
                {roleConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#FFB347] font-medium">确认?</span>
                    <button
                      onClick={handleRoleToggle}
                      className="px-2 py-1 text-xs bg-[#2EB87A] text-white rounded-lg"
                    >
                      是
                    </button>
                    <button
                      onClick={() => setRoleConfirm(false)}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg"
                    >
                      否
                    </button>
                  </div>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer" onClick={handleRoleToggle}>
                    <input type="checkbox" className="sr-only peer" checked={user.role === 'ADMIN'} readOnly />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2EB87A]" />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* 最近活动 */}
          {user.recentParticipations.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-[#1A2E22] mb-3 uppercase tracking-wider">最近参与</h4>
              <div className="space-y-3">
                {user.recentParticipations.map((p) => (
                  <div key={p.id} className="flex items-start gap-3">
                    {getStateIcon(p.state)}
                    <div>
                      <p className="text-sm font-medium text-[#1A2E22]">{p.activityName}</p>
                      <p className="text-xs text-[#1A2E22]/50">
                        {getStateLabel(p.state)} · {new Date(p.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex gap-3">
        <button
          onClick={() => onResetPassword(user.id)}
          className="flex-1 py-2.5 bg-white border border-gray-200 text-[#1A2E22] rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          重置密码
        </button>
        <button
          onClick={handleSave}
          className="flex-1 py-2.5 bg-[#2EB87A] text-white rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors text-sm"
        >
          保存更改
        </button>
      </div>
    </div>
  );
}
