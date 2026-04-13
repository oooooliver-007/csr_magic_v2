import { Edit, Lock, Shield } from 'lucide-react';
import type { UserInfo } from '../../types/user';

interface UserTableProps {
  users: UserInfo[];
  loading: boolean;
  selectedUsers: Set<number>;
  selectedUserId: number | null;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: number) => void;
  onSelectUser: (user: UserInfo) => void;
  onDeleteUser: (id: number) => void;
}

export default function UserTable({
  users,
  loading,
  selectedUsers,
  selectedUserId,
  onToggleSelectAll,
  onToggleSelect,
  onSelectUser,
  onDeleteUser,
}: UserTableProps) {
  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
          <Shield className="w-3 h-3 mr-1" />
          管理员
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
        员工
      </span>
    );
  };

  const getInitials = (user: UserInfo) => {
    const name = user.displayName || user.username;
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-[#1A2E22]/60 font-medium">
            <tr>
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={onToggleSelectAll}
                />
              </th>
              <th className="p-4">用户</th>
              <th className="p-4">角色</th>
              <th className="p-4">地区</th>
              <th className="p-4">注册时间</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#1A2E22]/50">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[#1A2E22]/50">
                  暂无用户数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    selectedUserId === user.id ? 'bg-[#2EB87A]/5' : ''
                  }`}
                  onClick={() => onSelectUser(user)}
                >
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => onToggleSelect(user.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2EB87A]/20 to-[#FFB347]/20 flex items-center justify-center text-[#1A2E22] font-bold text-xs">
                        {getInitials(user)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A2E22]">{user.displayName || user.username}</p>
                        <p className="text-xs text-[#1A2E22]/50">{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4 text-[#1A2E22]/70">{user.region || '-'}</td>
                  <td className="p-4 text-[#1A2E22]/70">
                    {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="p-1.5 text-gray-400 hover:text-[#2EB87A] hover:bg-green-50 rounded-lg transition-colors"
                        title="编辑"
                        onClick={() => onSelectUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        <Lock className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
