import { X } from 'lucide-react';
import type { Event } from '../../types/event';

interface EventViewDrawerProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
}

export default function EventViewDrawer({ open, event, onClose }: EventViewDrawerProps) {
  if (!open || !event) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getTypeLabel = (type: string | null) => {
    switch (type) {
      case 'OFFLINE': return '线下';
      case 'ONLINE': return '线上';
      case 'HYBRID': return '混合';
      default: return '-';
    }
  };

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-[#1A2E22]/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold">事件详情</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#1A2E22]/40 hover:text-[#1A2E22] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 封面图 */}
          {event.coverImage && (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <img src={event.coverImage} alt={event.name} className="w-full h-40 object-cover" />
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">事件名称</label>
              <p className="text-[#1A2E22] font-medium mt-1">{event.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">描述</label>
              <p className="text-sm text-[#1A2E22]/70 mt-1">{event.description || '暂无描述'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">类型</label>
                <p className="text-sm text-[#1A2E22] mt-1">{getTypeLabel(event.type)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">展示状态</label>
                <p className="text-sm mt-1">
                  {event.visible ? (
                    <span className="text-[#2EB87A] font-medium">已显示</span>
                  ) : (
                    <span className="text-gray-400 font-medium">已隐藏</span>
                  )}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">开始时间</label>
                <p className="text-sm text-[#1A2E22] mt-1">{formatDate(event.startDate)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">结束时间</label>
                <p className="text-sm text-[#1A2E22] mt-1">{formatDate(event.endDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">创建时间</label>
                <p className="text-sm text-[#1A2E22]/70 mt-1">{formatDate(event.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">更新时间</label>
                <p className="text-sm text-[#1A2E22]/70 mt-1">{formatDate(event.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-white transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </>
  );
}
