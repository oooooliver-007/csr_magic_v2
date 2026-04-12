import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { eventApi } from '../../services/eventApi';
import type { Event } from '../../types/event';
import EventFormDrawer from '../../components/admin/EventFormDrawer';
import EventViewDrawer from '../../components/admin/EventViewDrawer';

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // 抽屉状态
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  // 删除确认
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await eventApi.list({ page, size: 20, keyword: keyword || undefined });
      setEvents(res.data.data.content);
      setTotalPages(res.data.data.totalPages);
      setTotalElements(res.data.data.totalElements);
    } catch (error) {
      showToast('获取事件列表失败', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, keyword, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // 搜索防抖
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setKeyword(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleCreate = () => {
    setEditingEvent(null);
    setFormDrawerOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormDrawerOpen(true);
  };

  const handleView = (event: Event) => {
    setViewingEvent(event);
    setViewDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await eventApi.delete(id);
      showToast('删除成功');
      setDeleteConfirmId(null);
      fetchEvents();
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  const handleToggleVisible = async (event: Event) => {
    try {
      await eventApi.update(event.id, { visible: !event.visible });
      showToast(event.visible ? '已隐藏' : '已显示');
      fetchEvents();
    } catch (error) {
      showToast('切换显示状态失败', 'error');
    }
  };

  const handleFormSuccess = () => {
    setFormDrawerOpen(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'OFFLINE': return '线下';
      case 'ONLINE': return '线上';
      case 'HYBRID': return '混合';
      default: return '-';
    }
  };

  const getTypeBadgeClass = (type: string | null) => {
    switch (type) {
      case 'OFFLINE': return 'bg-[#FFB347]/10 text-[#FFB347]';
      case 'ONLINE': return 'bg-[#2EB87A]/10 text-[#2EB87A]';
      case 'HYBRID': return 'bg-blue-500/10 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">事件管理</h1>
        <span className="text-sm text-[#1A2E22]/60">共 {totalElements} 个事件</span>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2E22]/40" />
          <input
            type="text"
            placeholder="搜索事件名称..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
          />
        </div>
        <button
          onClick={handleCreate}
          className="bg-[#2EB87A] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#2EB87A]/90 transition-colors flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          新建事件
        </button>
      </div>

      {/* 桌面端：表格 */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-[#1A2E22]/50 border-b border-gray-100">
                <th className="px-6 py-4 font-medium">事件名称</th>
                <th className="px-6 py-4 font-medium">类型</th>
                <th className="px-6 py-4 font-medium">时间范围</th>
                <th className="px-6 py-4 font-medium">显示</th>
                <th className="px-6 py-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#1A2E22]/50">
                    加载中...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#1A2E22]/50">
                    暂无事件数据
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1A2E22]">{event.name}</div>
                      <div className="text-xs text-[#1A2E22]/50 mt-0.5">ID: {event.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(event.type)}`}>
                        {getTypeLabel(event.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#1A2E22]/70">
                      {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleVisible(event)}
                        className="transition-colors"
                        title={event.visible ? '点击隐藏' : '点击显示'}
                      >
                        {event.visible ? (
                          <ToggleRight className="w-6 h-6 text-[#2EB87A]" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleView(event)}
                          className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10"
                          title="查看"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] transition-colors rounded-lg hover:bg-[#2EB87A]/10"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(event.id)}
                          className="p-1.5 text-[#1A2E22]/40 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-[#1A2E22]/50">暂无事件数据</div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-[#1A2E22]">{event.name}</h3>
                  <p className="text-xs text-[#1A2E22]/50 mt-0.5">
                    {formatDate(event.startDate)} ~ {formatDate(event.endDate)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(event.type)}`}>
                  {getTypeLabel(event.type)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleToggleVisible(event)}
                  className="flex items-center gap-1.5 text-xs"
                >
                  {event.visible ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-[#2EB87A]" />
                      <span className="text-[#2EB87A]">已显示</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-400">已隐藏</span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleView(event)}
                    className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-1.5 text-[#1A2E22]/40 hover:text-[#2EB87A] rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(event.id)}
                    className="p-1.5 text-[#1A2E22]/40 hover:text-red-500 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
              <p className="text-sm text-[#1A2E22]/70">确定要删除该事件吗？此操作不可撤销。</p>
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
      <EventFormDrawer
        open={formDrawerOpen}
        event={editingEvent}
        onClose={() => { setFormDrawerOpen(false); setEditingEvent(null); }}
        onSuccess={handleFormSuccess}
        showToast={showToast}
      />
      <EventViewDrawer
        open={viewDrawerOpen}
        event={viewingEvent}
        onClose={() => { setViewDrawerOpen(false); setViewingEvent(null); }}
      />
    </div>
  );
}
