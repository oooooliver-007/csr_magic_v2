import { X, Edit } from 'lucide-react';
import type { Activity, TemplateType, ActivityStatus } from '../../types/activity';

interface ActivityViewDrawerProps {
  open: boolean;
  activity: Activity | null;
  onClose: () => void;
  onEdit: () => void;
}

export default function ActivityViewDrawer({ open, activity, onClose, onEdit }: ActivityViewDrawerProps) {
  if (!open || !activity) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const getTemplateLabel = (type: TemplateType) => {
    const map: Record<TemplateType, string> = {
      BASIC: '基础',
      DONATION: '捐赠',
      VOLUNTEER: '志愿者',
      CHECKIN: '签到',
      CUSTOM: '自定义',
    };
    return map[type] || type;
  };

  const getStatusLabel = (status: ActivityStatus) => {
    const map: Record<ActivityStatus, string> = {
      UPCOMING: '即将开始',
      ONGOING: '进行中',
      ENDED: '已结束',
    };
    return map[status] || status;
  };

  const getStatusClass = (status: ActivityStatus) => {
    const map: Record<ActivityStatus, string> = {
      UPCOMING: 'text-[#FFB347]',
      ONGOING: 'text-[#2EB87A]',
      ENDED: 'text-gray-500',
    };
    return map[status] || 'text-gray-500';
  };

  // 参与人数进度条
  const participationPercent = activity.maxParticipants
    ? Math.min(100, Math.round((activity.currentParticipants / activity.maxParticipants) * 100))
    : 0;

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
          <h2 className="text-xl font-bold">活动详情</h2>
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
          {activity.coverImage && (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <img src={activity.coverImage} alt={activity.name} className="w-full h-48 object-cover" />
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">活动名称</label>
              <p className="text-[#1A2E22] font-medium mt-1">{activity.name}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">所属事件</label>
              <p className="text-sm text-[#1A2E22] mt-1">{activity.eventName}</p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">描述</label>
              <p className="text-sm text-[#1A2E22]/70 mt-1">{activity.description || '暂无描述'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">模板类型</label>
                <p className="text-sm text-[#1A2E22] mt-1">{getTemplateLabel(activity.templateType)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">状态</label>
                <p className={`text-sm font-medium mt-1 ${getStatusClass(activity.status)}`}>
                  {getStatusLabel(activity.status)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">开始时间</label>
                <p className="text-sm text-[#1A2E22] mt-1">{formatDate(activity.startTime)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">结束时间</label>
                <p className="text-sm text-[#1A2E22] mt-1">{formatDate(activity.endTime)}</p>
              </div>
            </div>

            {/* 参与人数进度条 */}
            <div>
              <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">参与人数</label>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-[#1A2E22]">{activity.currentParticipants} 人已报名</span>
                  <span className="text-[#1A2E22]/50">
                    {activity.maxParticipants ? `上限 ${activity.maxParticipants} 人` : '不限人数'}
                  </span>
                </div>
                {activity.maxParticipants && (
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-[#2EB87A] h-2 rounded-full transition-all"
                      style={{ width: `${participationPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">创建时间</label>
                <p className="text-sm text-[#1A2E22]/70 mt-1">{formatDate(activity.createdAt)}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-[#1A2E22]/50 uppercase tracking-wider">更新时间</label>
                <p className="text-sm text-[#1A2E22]/70 mt-1">{formatDate(activity.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-white transition-colors text-sm"
          >
            关闭
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] font-medium text-white hover:bg-[#2EB87A]/90 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Edit className="w-4 h-4" />
            去编辑
          </button>
        </div>
      </div>
    </>
  );
}
