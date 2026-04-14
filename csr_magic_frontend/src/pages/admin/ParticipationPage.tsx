import { useState, useEffect, useCallback, Fragment } from 'react';
import { Search, Check, X, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { participationApi } from '../../services/participationApi';
import { activityApi } from '../../services/activityApi';
import type { Participation, ParticipationState, ReviewAction } from '../../types/participation';
import type { PageResponse } from '../../types/common';
import type { Activity } from '../../types/activity';

/** 状态徽章配色 */
const STATE_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING: { label: '待审核', cls: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { label: '已通过', cls: 'bg-green-100 text-green-800' },
  REJECTED: { label: '已驳回', cls: 'bg-red-100 text-red-800' },
  RE_SUBMITTED: { label: '已重提', cls: 'bg-blue-100 text-blue-800' },
};

export default function ParticipationPage() {
  /* ─── 筛选状态 ─── */
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ParticipationState | ''>('');
  const [activityFilter, setActivityFilter] = useState<number | ''>('');

  /* ─── 数据状态 ─── */
  const [records, setRecords] = useState<Participation[]>([]);
  const [pageData, setPageData] = useState<PageResponse<Participation> | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ─── 筛选下拉数据 ─── */
  const [activities, setActivities] = useState<Activity[]>([]);

  /* ─── 交互状态 ─── */
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [pendingRejectId, setPendingRejectId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ─── 获取参与列表 ─── */
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await participationApi.list({
        page,
        size: 20,
        keyword: keyword || undefined,
        state: statusFilter || undefined,
        activityId: activityFilter || undefined,
      });
      const data = res.data.data;
      setRecords(data.content);
      setPageData(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '获取参与列表失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, keyword, statusFilter, activityFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  /* ─── 加载筛选下拉数据 ─── */
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const actRes = await activityApi.list({ size: 200 });
        setActivities(actRes.data.data.content);
      } catch {
        // 筛选下拉加载失败不阻断页面
      }
    };
    loadFilters();
  }, []);

  /* ─── 审核操作 ─── */
  const handleReview = async (id: number, action: ReviewAction, reason?: string) => {
    setActionLoading(true);
    try {
      await participationApi.review(id, { action, rejectReason: reason });
      await fetchRecords();
      setSelectedRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '操作失败';
      alert(msg);
    } finally {
      setActionLoading(false);
      setShowRejectDialog(false);
      setRejectReason('');
      setPendingRejectId(null);
    }
  };

  const openRejectDialog = (id: number) => {
    setPendingRejectId(id);
    setRejectReason('');
    setShowRejectDialog(true);
  };

  /* ─── 批量操作 ─── */
  const handleBatchApprove = async () => {
    setActionLoading(true);
    try {
      for (const id of selectedRows) {
        const record = records.find((r) => r.id === id);
        if (record && (record.state === 'PENDING' || record.state === 'RE_SUBMITTED')) {
          await participationApi.review(id, { action: 'APPROVE' });
        }
      }
      setSelectedRows(new Set());
      await fetchRecords();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '批量操作失败';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  /* ─── Checkbox 操作 ─── */
  const toggleSelectAll = () => {
    if (selectedRows.size === records.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(records.map((r) => r.id)));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── 用户头像首字母 ─── */
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  /* ─── 分页可审核数（用于批量按钮统计） ─── */
  const reviewableSelected = [...selectedRows].filter((id) => {
    const r = records.find((rec) => rec.id === id);
    return r && (r.state === 'PENDING' || r.state === 'RE_SUBMITTED');
  });

  return (
    <div className="space-y-6">
      {/* 标题 + 批量操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2E22]">参与审核</h1>
          <p className="text-[#1A2E22]/60 text-sm mt-1">审核和管理员工的活动报名记录</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {reviewableSelected.length > 0 && (
            <button
              onClick={handleBatchApprove}
              disabled={actionLoading}
              className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-green-600" />
              批量通过 ({reviewableSelected.length})
            </button>
          )}
          <button className="flex-1 sm:flex-none bg-white border border-gray-200 text-[#1A2E22] px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索员工姓名或活动名称..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ParticipationState | ''); setPage(0); }}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[120px]"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待审核</option>
            <option value="APPROVED">已通过</option>
            <option value="REJECTED">已驳回</option>
            <option value="RE_SUBMITTED">已重提</option>
          </select>
          <select
            value={activityFilter}
            onChange={(e) => { setActivityFilter(e.target.value ? Number(e.target.value) : ''); setPage(0); }}
            className="px-4 py-2 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm bg-white min-w-[140px]"
          >
            <option value="">全部活动</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 加载/错误/空状态 */}
      {loading && records.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-2xl text-red-600 text-sm">
          {error}
          <button onClick={fetchRecords} className="ml-2 underline">重试</button>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center text-[#1A2E22]/60">
          <p className="text-lg font-medium">暂无参与记录</p>
          <p className="text-sm mt-2">等待员工报名活动后，记录将显示在这里</p>
        </div>
      )}

      {/* ═══ 桌面端：数据表格 ═══ */}
      {records.length > 0 && (
        <>
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[#1A2E22]/60 font-medium">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                        checked={selectedRows.size === records.length && records.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4">员工</th>
                    <th className="p-4">活动</th>
                    <th className="p-4">报名时间</th>
                    <th className="p-4">状态</th>
                    <th className="p-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((rec) => (
                    <Fragment key={rec.id}>
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-[#2EB87A] focus:ring-[#2EB87A]"
                            checked={selectedRows.has(rec.id)}
                            onChange={() => toggleSelectRow(rec.id)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2EB87A]/10 flex items-center justify-center text-[#2EB87A] font-bold text-xs">
                              {getInitials(rec.userDisplayName)}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A2E22]">{rec.userDisplayName || rec.userName}</p>
                              <p className="text-xs text-[#1A2E22]/50">{rec.userName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#1A2E22]/80">{rec.activityName}</td>
                        <td className="p-4 text-[#1A2E22]/80">
                          {new Date(rec.createdAt).toLocaleDateString('zh-CN')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATE_BADGE[rec.state]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATE_BADGE[rec.state]?.label ?? '未知'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(rec.state === 'PENDING' || rec.state === 'RE_SUBMITTED') && (
                              <>
                                <button
                                  onClick={() => handleReview(rec.id, 'APPROVE')}
                                  disabled={actionLoading}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="通过"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openRejectDialog(rec.id)}
                                  disabled={actionLoading}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="驳回"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setExpandedRow(expandedRow === rec.id ? null : rec.id)}
                              className="p-1.5 text-gray-400 hover:text-[#1A2E22] hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {expandedRow === rec.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === rec.id && (
                        <tr className="bg-gray-50/30">
                          <td colSpan={6} className="p-0">
                            <ExpandedDetail record={rec} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {pageData && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-[#1A2E22]/60">
                <p>共 {pageData.totalElements} 条记录</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  {Array.from({ length: Math.min(pageData.totalPages, 5) }, (_, i) => i).map((i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-1 rounded-lg ${page === i ? 'bg-[#2EB87A] text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min((pageData.totalPages || 1) - 1, p + 1))}
                    disabled={page >= (pageData.totalPages || 1) - 1}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ═══ 移动端：卡片列表 ═══ */}
          <div className="md:hidden space-y-3">
            {records.map((rec) => {
              const badge = STATE_BADGE[rec.state] ?? { label: '未知', cls: 'bg-gray-100 text-gray-600' };
              const canReview = rec.state === 'PENDING' || rec.state === 'RE_SUBMITTED';
              const isExpanded = expandedRow === rec.id;

              return (
                <div key={rec.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#2EB87A]/10 flex items-center justify-center text-[#2EB87A] font-bold text-sm">
                        {getInitials(rec.userDisplayName)}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A2E22]">{rec.userDisplayName || rec.userName}</p>
                        <p className="text-xs text-[#1A2E22]/50">{rec.userName}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="text-sm text-[#1A2E22]/80">
                    <p><span className="text-[#1A2E22]/50">活动：</span>{rec.activityName}</p>
                    <p><span className="text-[#1A2E22]/50">报名时间：</span>{new Date(rec.createdAt).toLocaleDateString('zh-CN')}</p>
                  </div>

                  <button
                    onClick={() => setExpandedRow(isExpanded ? null : rec.id)}
                    className="text-xs text-[#2EB87A] font-medium flex items-center gap-1"
                  >
                    {isExpanded ? '收起详情' : '查看详情'}
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isExpanded && <ExpandedDetail record={rec} />}

                  {canReview && (
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleReview(rec.id, 'APPROVE')}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        通过
                      </button>
                      <button
                        onClick={() => openRejectDialog(rec.id)}
                        disabled={actionLoading}
                        className="flex-1 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        驳回
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 移动端分页 */}
            {pageData && pageData.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-40"
                >
                  上一页
                </button>
                <span className="text-sm text-[#1A2E22]/60">{page + 1} / {pageData.totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
                  disabled={page >= pageData.totalPages - 1}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 disabled:opacity-40"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ 驳回弹窗 ═══ */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-[#1A2E22]/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#1A2E22]">驳回报名</h3>
            <p className="text-sm text-[#1A2E22]/60">请填写驳回原因（必填），员工将收到通知。</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="请输入驳回原因..."
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowRejectDialog(false); setPendingRejectId(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => pendingRejectId && handleReview(pendingRejectId, 'REJECT', rejectReason)}
                disabled={!rejectReason.trim() || actionLoading}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {actionLoading ? '提交中...' : '确认驳回'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 展开详情子组件 */
function ExpandedDetail({ record }: { record: Participation }) {
  const parsed = parseFormDataSafe(record.formData);

  return (
    <div className="p-4 md:pl-16 border-l-2 border-[#2EB87A] m-2 rounded-r-xl bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs font-bold text-[#1A2E22]/50 uppercase tracking-wider mb-1">报名信息</h4>
          {parsed && Object.keys(parsed).length > 0 ? (
            <div className="space-y-1">
              {Object.entries(parsed).filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-[#1A2E22]/60">{k}</span>
                  <span className="font-medium text-[#1A2E22]">
                    {Array.isArray(v) ? `${v.length} 项` : String(v)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">无额外报名信息</p>
          )}
        </div>
        <div>
          <h4 className="text-xs font-bold text-[#1A2E22]/50 uppercase tracking-wider mb-1">审核信息</h4>
          {record.reviewedByName ? (
            <div className="space-y-1 text-sm">
              <p><span className="text-[#1A2E22]/60">审核人：</span>{record.reviewedByName}</p>
              <p><span className="text-[#1A2E22]/60">审核时间：</span>{record.reviewedAt ? new Date(record.reviewedAt).toLocaleString('zh-CN') : '-'}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">尚未审核</p>
          )}
          {record.rejectReason && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg text-sm text-red-600">
              <span className="font-medium">驳回原因：</span>{record.rejectReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function parseFormDataSafe(formData: string | null): Record<string, unknown> | null {
  if (!formData) return null;
  try {
    return JSON.parse(formData) as Record<string, unknown>;
  } catch {
    return null;
  }
}
