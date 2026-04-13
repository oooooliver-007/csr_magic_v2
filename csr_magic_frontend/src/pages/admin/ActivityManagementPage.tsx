import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { activityApi } from '../../services/activityApi';
import { eventApi } from '../../services/eventApi';
import type { Activity, ActivityStatus, TemplateType } from '../../types/activity';
import type { Event } from '../../types/event';
import ActivityFormDrawer from '../../components/admin/ActivityFormDrawer';
import ActivityViewDrawer from '../../components/admin/ActivityViewDrawer';

export default function ActivityManagementPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 筛选
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterEventId, setFilterEventId] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // 抽屉状态
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [viewingActivity, setViewingActivity] = useState<Activity | null>(null);

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 获取事件列表（用于筛选下拉和表单）
  const fetchEvents = useCallback(async () => {
    try {
      const res = await eventApi.list({ page: 0, size: 100 });
      setEvents(res.data.data.content);
    } catch (error) {
      console.error('获取事件列表失败:', error);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await activityApi.list({
        page,
        size: 20,
        eventId: filterEventId,
        status: filterStatus || undefined,
        keyword: keyword || undefined,
      });
      setActivities(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch (error) {
      showToast('获取活动列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, filterEventId, filterStatus, keyword, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    setEditingActivity(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormDrawerOpen(true);
  };

  const handleView = (activity: Activity) => {
    setViewingActivity(activity);
    setViewDrawerOpen(true);
  };

  const handleViewToEdit = () => {
    if (viewingActivity) {
      setViewDrawerOpen(false);
      setEditingActivity(viewingActivity);
      setFormDrawerOpen(true);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await activityApi.delete(id);
      showToast('删除成功');
      setDeleteConfirmId(null);
      fetchActivities();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleFormSuccess = () => {
    setFormDrawerOpen(false);
    setEditingActivity(null);
    fetchActivities();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getTemplateBadge = (type: TemplateType) => {
    const map: Record<TemplateType, { label: string; className: string }> = {
      BASIC: { label: '基础', className: 'bg-gray-100 text-gray-600' },
      DONATION: { label: '捐赠', className: 'bg-[#2EB87A]/10 text-[#2EB87A]' },
      VOLUNTEER: { label: '志愿者', className: 'bg-[#FFB347]/10 text-[#FFB347]' },
      CHECKIN: { label: '签到', className: 'bg-blue-500/10 text-blue-600' },
      CUSTOM: { label: '自定义', className: 'bg-purple-500/10 text-purple-600' },
    };
    return map[type] || { label: type, className: 'bg-gray-100 text-gray-600' };
  };

  const getStatusBadge = (status: ActivityStatus) => {
    const map: Record<ActivityStatus, { label: string; className: string }> = {
      UPCOMING: { label: '即将开始', className: 'bg-[#FFB347]/10 text-[#FFB347]' },
      ONGOING: { label: '进行中', className: 'bg-[#2EB87A]/10 text-[#2EB87A]' },
      ENDED: { label: '已结束', className: 'bg-gray-100 text-gray-600' },
    };
    return map[status] || { label: status, className: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="space-y-6 relative">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">活动管理</h1>
        <span className="text-sm text-[#1A2E22]/60">共 {totalElements} 个活动</span>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2E22]/40" />
            <input
              type="text"
              placeholder="搜索活动名称..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
            />
          </div>
          <select
            value={filterEventId ?? ''}
            onChange={(e) => {
              setFilterEventId(e.target.value ? Number(e.target.value) : undefined);
              setPage(0);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EB87A] focus:outline-none bg-white"
          >
            <option value="">所有事件</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#2EB87A] focus:outline-none bg-white"
          >
            <option value="">所有状态</option>
            <option value="UPCOMING">即将开始</option>
            <option value="ONGOING">进行中</option>
            <option value="ENDED">已结束</option>
          </select>
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#2EB87A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          新建活动
        </button>
      </div>

      {/* 桌面端：表格 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-[#1A2E22]/50 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">活动名称</th>
                <th className="px-6 py-4 font-medium">所属事件</th>
                <th className="px-6 py-4 font-medium">类型</th>
                <th className="px-6 py-4 font-medium">时间</th>
                <th className="px-6 py-4 font-medium">参与人数</th>
                <th className="px-6 py-4 font-medium">状态</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#1A2E22]/50">
                    加载中...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#1A2E22]/50">
                    暂无活动数据
                  </td>
                </tr>
              ) : (
                activities.map((activity) => {
                  const templateBadge = getTemplateBadge(activity.templateType);
                  const statusBadge = getStatusBadge(activity.status);
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {activity.coverImage ? (
                            <img
                              src={activity.coverImage}
                              alt={activity.name}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-400">无图</span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-[#1A2E22]">{activity.name}</div>
                            <div className="text-xs text-[#1A2E22]/50 mt-0.5">ID: {activity.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#1A2E22]/70">{activity.eventName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${templateBadge.className}`}>
                          {templateBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#1A2E22]/70">
                        {formatDate(activity.startTime)} ~ {formatDate(activity.endTime)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="font-medium">{activity.currentParticipants}</span>
                        <span className="text-[#1A2E22]/50"> / {activity.maxParticipants ?? '∞'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleView(activity)}
                            className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10"
                            title="查看"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(activity)}
                            className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10"
                            title="编辑"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(activity.id)}
                            className="p-1.5 text-[#1A2E22]/40 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-[#1A2E22]/60">
              第 {page + 1} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    page === i
                      ? 'bg-[#2EB87A] text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-[#1A2E22]/50">暂无活动数据</div>
        ) : (
          activities.map((activity) => {
            const templateBadge = getTemplateBadge(activity.templateType);
            const statusBadge = getStatusBadge(activity.status);
            return (
              <div key={activity.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-start gap-3">
                  {activity.coverImage ? (
                    <img
                      src={activity.coverImage}
                      alt={activity.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-gray-400">无图</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#1A2E22] truncate">{activity.name}</h3>
                    <p className="text-xs text-[#1A2E22]/50 mt-0.5">{activity.eventName}</p>
                    <p className="text-xs text-[#1A2E22]/50 mt-0.5">
                      {formatDate(activity.startTime)} ~ {formatDate(activity.endTime)}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${templateBadge.className}`}>
                      {templateBadge.label}
                    </span>
                    <span className="text-xs text-[#1A2E22]/50">
                      {activity.currentParticipants} / {activity.maxParticipants ?? '∞'} 人
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(activity)}
                      className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] rounded-lg"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(activity.id)}
                      className="p-1.5 text-[#1A2E22]/40 hover:text-red-500 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
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
              <p className="text-sm text-[#1A2E22]/70">确定要删除该活动吗？此操作不可撤销。</p>
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

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all ${
          toast.type === 'success' ? 'bg-[#2EB87A]' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* 抽屉 */}
      <ActivityFormDrawer
        open={formDrawerOpen}
        activity={editingActivity}
        events={events}
        onClose={() => { setFormDrawerOpen(false); setEditingActivity(null); }}
        onSuccess={handleFormSuccess}
        showToast={showToast}
      />
      <ActivityViewDrawer
        open={viewDrawerOpen}
        activity={viewingActivity}
        onClose={() => { setViewDrawerOpen(false); setViewingActivity(null); }}
        onEdit={handleViewToEdit}
      />
    </div>
  );
}
