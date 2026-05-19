import { useState, useEffect } from 'react';
import { Loader2, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { participationApi } from '../services/participationApi';
import ActivityBadge from './ActivityBadge';
import type { MyParticipation } from '../types/participation';
import type { PageResponse } from '../types/common';

interface ParticipationListProps {
  onExport: () => void;
}

const stateConfig: Record<string, { label: string; classes: string }> = {
  PENDING: { label: '待审核', classes: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: '已通过', classes: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已驳回', classes: 'bg-orange-100 text-orange-700' },
  RE_SUBMITTED: { label: '已重提', classes: 'bg-blue-100 text-blue-700' },
};

export default function ParticipationList({ onExport }: ParticipationListProps) {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState<PageResponse<MyParticipation> | null>(null);

  const fetchRecords = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await participationApi.getMyParticipations({ page: p, size: 10 });
      const data = res.data.data;
      setRecords(data.content);
      setPageData(data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? '获取参与记录失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(page);
  }, [page]);

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 text-[#2EB87A] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-2xl text-red-600 text-sm">
        {error}
        <button onClick={() => fetchRecords(page)} className="ml-2 underline">重试</button>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-[#1A2E22]/60">
        <p className="text-lg font-medium">暂无参与记录</p>
        <p className="text-sm mt-2">去活动列表看看吧</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 导出按钮 */}
      <div className="flex justify-end">
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 border-2 border-[#E5E7EB] rounded-xl font-medium text-[#1A2E22] hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          导出记录
        </button>
      </div>

      {/* 时间线列表 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          {records.map((record, i) => {
            const stateInfo = stateConfig[record.state] ?? { label: '未知', classes: 'bg-gray-100 text-gray-600' };
            const dateStr = new Date(record.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={record.id} className="flex gap-4 relative">
                {/* 时间线连接线 */}
                {i !== records.length - 1 && (
                  <div className="absolute left-[19px] top-10 bottom-[-24px] w-0.5 bg-gray-100" />
                )}
                {/* 活动类型图标 */}
                <div className="w-10 h-10 rounded-full bg-[#F7FAF8] flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm">
                  <ActivityBadge
                    templateType={record.templateType}
                    className="px-0 py-0 bg-transparent w-full h-full flex items-center justify-center [&>span:last-child]:hidden [&>span:first-child]:text-lg"
                  />
                </div>
                {/* 内容 */}
                <div className="flex-1 pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h4
                        className="font-bold truncate cursor-pointer hover:text-[#2EB87A] transition-colors"
                        onClick={() => navigate(`/activities/${record.activityId}`)}
                      >
                        {record.activityName}
                      </h4>
                      {record.familyMembers && record.familyMembers.length > 0 && (
                        <p className="text-xs text-[#1A2E22]/50 mt-0.5">
                          携带 {record.familyMembers.length} 名家属
                        </p>
                      )}
                      <p className="text-sm text-[#1A2E22]/60 mt-1">{dateStr}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-lg ${stateInfo.classes}`}>
                      {stateInfo.label}
                    </span>
                  </div>
                  {/* 驳回原因 + 查看链接 */}
                  {record.state === 'REJECTED' && record.rejectReason && (
                    <div className="mt-2 text-sm text-orange-600 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      <button
                        onClick={() => navigate(`/activities/${record.activityId}`)}
                        className="underline hover:no-underline"
                      >
                        查看原因并重新提交
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 分页 */}
      {pageData && pageData.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-[#1A2E22]/60">
            {page + 1} / {pageData.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageData.totalPages - 1, p + 1))}
            disabled={page >= pageData.totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 disabled:opacity-40 hover:border-[#2EB87A] hover:text-[#2EB87A] transition-colors"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
