import { useState, useEffect, useCallback } from 'react';
import { Search, Shield } from 'lucide-react';
import { userApi } from '../../services/userApi';
import type { UserInfo, UserDetail } from '../../types/user';
import UserTable from '../../components/admin/UserTable';
import UserDetailPanel from '../../components/admin/UserDetailPanel';
import ResetPasswordDialog from '../../components/admin/ResetPasswordDialog';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 筛选
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  // 选中状态
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 重置密码
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null);
  const [resetPasswordUserName, setResetPasswordUserName] = useState('');

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.list({
        page,
        size: 20,
        keyword: keyword || undefined,
        region: regionFilter || undefined,
      });
      setUsers(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch (error) {
      showToast('获取用户列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, regionFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 地区筛选
  const handleRegionChange = (region: string) => {
    setRegionFilter(region);
    setPage(0);
  };

  // 多选
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedUsers(next);
  };

  // 选中用户查看详情
  const handleSelectUser = async (user: UserInfo) => {
    try {
      const res = await userApi.getById(user.id);
      setSelectedUserDetail(res.data.data);
    } catch (error) {
      showToast('获取用户详情失败', 'error');
    }
  };

  // 关闭详情面板
  const handleCloseDetail = () => {
    setSelectedUserDetail(null);
  };

  // 角色切换
  const handleToggleRole = async (userId: number, newRole: string) => {
    try {
      await userApi.update(userId, { role: newRole });
      showToast(newRole === 'ADMIN' ? '已设为管理员' : '已取消管理员权限');
      fetchUsers();
      // 刷新详情
      const res = await userApi.getById(userId);
      setSelectedUserDetail(res.data.data);
    } catch (error) {
      showToast('角色切换失败', 'error');
    }
  };

  // 保存用户信息
  const handleSaveUser = async (userId: number, data: { displayName: string; realName: string; region: string }) => {
    try {
      await userApi.update(userId, data);
      showToast('用户信息已更新');
      fetchUsers();
      const res = await userApi.getById(userId);
      setSelectedUserDetail(res.data.data);
    } catch (error) {
      showToast('更新失败', 'error');
    }
  };

  // 删除用户
  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      showToast('删除成功');
      setDeleteConfirmId(null);
      if (selectedUserDetail?.id === id) {
        setSelectedUserDetail(null);
      }
      fetchUsers();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  // 重置密码
  const handleOpenResetPassword = (userId: number) => {
    const user = users.find((u) => u.id === userId);
    setResetPasswordUserId(userId);
    setResetPasswordUserName(user?.displayName || user?.username || '');
  };

  const handleResetPassword = async (newPassword: string) => {
    if (resetPasswordUserId === null) return;
    try {
      await userApi.resetPassword(resetPasswordUserId, { newPassword });
      showToast('密码已重置');
      setResetPasswordUserId(null);
    } catch (error) {
      showToast('密码重置失败', 'error');
    }
  };

  // 获取所有不重复地区（用于筛选下拉）
  const regions = [...new Set(users.map((u) => u.region).filter(Boolean))] as string[];

  return (
    <div className="flex h-full gap-6 relative">
      {/* 主内容区 */}
      <div className={`flex-1 space-y-6 transition-all duration-300 ${selectedUserDetail ? 'mr-[400px]' : ''}`}>
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A2E22]">用户管理</h1>
            <p className="text-[#1A2E22]/60 text-sm mt-1">管理员工账户、角色和权限。共 {totalElements} 位用户</p>
          </div>
          {selectedUsers.size > 0 && (
            <button
              onClick={() => {
                selectedUsers.forEach((id) => setDeleteConfirmId(id));
              }}
              className="bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              已选 {selectedUsers.size} 位
            </button>
          )}
        </div>

        {/* 筛选栏 */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索用户名或姓名..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={regionFilter}
              onChange={(e) => handleRegionChange(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[120px]"
            >
              <option value="">全部地区</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 桌面端：表格 */}
        <div className="hidden md:block">
          <UserTable
            users={users}
            loading={loading}
            selectedUsers={selectedUsers}
            selectedUserId={selectedUserDetail?.id ?? null}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelect={toggleSelect}
            onSelectUser={handleSelectUser}
            onDeleteUser={setDeleteConfirmId}
          />

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between text-sm text-[#1A2E22]/60">
              <p>第 {page + 1} / {totalPages} 页</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i;
                  if (pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        page === pageNum
                          ? 'bg-[#2EB87A] text-white'
                          : 'border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 移动端：卡片列表 */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[#1A2E22]/50">加载中...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-[#1A2E22]/50">暂无用户数据</div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectUser(user)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#2EB87A]/20 to-[#FFB347]/20 flex items-center justify-center text-[#1A2E22] font-bold text-sm">
                    {(user.displayName || user.username).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1A2E22]">{user.displayName || user.username}</p>
                    <p className="text-xs text-[#1A2E22]/50">{user.username}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                    {user.role === 'ADMIN' ? '管理员' : '员工'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#1A2E22]/50">
                  <span>{user.region || '未设置地区'}</span>
                  <span>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            ))
          )}

          {/* 移动端分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-[#1A2E22]/60">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm rounded-xl border border-gray-200 disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右侧用户详情面板 */}
      {selectedUserDetail && (
        <UserDetailPanel
          user={selectedUserDetail}
          onClose={handleCloseDetail}
          onToggleRole={handleToggleRole}
          onResetPassword={handleOpenResetPassword}
          onSave={handleSaveUser}
        />
      )}

      {/* 删除确认弹窗 */}
      {deleteConfirmId !== null && (
        <>
          <div
            className="fixed inset-0 bg-[#1A2E22]/20 backdrop-blur-sm z-40"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
              <h3 className="text-lg font-bold text-[#1A2E22]">确认删除</h3>
              <p className="text-sm text-[#1A2E22]/70">确定要删除该用户吗？此操作不可撤销。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-gray-50 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 font-medium text-white hover:bg-red-600 transition-colors text-sm"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 重置密码弹窗 */}
      <ResetPasswordDialog
        open={resetPasswordUserId !== null}
        userName={resetPasswordUserName}
        onClose={() => setResetPasswordUserId(null)}
        onConfirm={handleResetPassword}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'success' ? 'bg-[#2EB87A]' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
