import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Trash2 } from 'lucide-react';
import { activityApi } from '../../services/activityApi';
import type { Activity, TemplateType, FormFieldSchema } from '../../types/activity';
import type { Event } from '../../types/event';
import TemplateSelector from './TemplateSelector';
import { getFormSchemaByType, TEMPLATE_TYPE_LABELS } from '../../constants/templateSchemas';

const activitySchema = z.object({
  eventId: z.number({ required_error: '请选择所属事件' }).min(1, '请选择所属事件'),
  name: z.string().min(1, '活动名称不能为空').max(200, '活动名称不能超过200字'),
  templateType: z.enum(['BASIC', 'DONATION', 'VOLUNTEER', 'CHECKIN', 'CUSTOM'], {
    required_error: '请选择活动模板',
  }),
  description: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxParticipants: z.union([z.number().min(1, '人数上限至少为1'), z.nan(), z.undefined()]).optional(),
  coverImage: z.string().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'ENDED']).optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormDrawerProps {
  open: boolean;
  activity: Activity | null;
  events: Event[];
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function ActivityFormDrawer({ open, activity, events, onClose, onSuccess, showToast }: ActivityFormDrawerProps) {
  const isEdit = activity !== null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      eventId: 0,
      name: '',
      templateType: undefined,
      description: '',
      startTime: '',
      endTime: '',
      maxParticipants: undefined,
      coverImage: '',
      status: 'UPCOMING',
    },
  });

  const coverImage = watch('coverImage');
  const watchedTemplateType = watch('templateType');
  const [customSchema, setCustomSchema] = useState<FormFieldSchema[]>([]);

  useEffect(() => {
    if (open) {
      if (activity) {
        reset({
          eventId: activity.eventId,
          name: activity.name,
          templateType: activity.templateType,
          description: activity.description ?? '',
          startTime: activity.startTime ? activity.startTime.slice(0, 10) : '',
          endTime: activity.endTime ? activity.endTime.slice(0, 10) : '',
          maxParticipants: activity.maxParticipants ?? undefined,
          coverImage: activity.coverImage ?? '',
          status: activity.status,
        });
      } else {
        reset({
          eventId: 0,
          name: '',
          templateType: undefined,
          description: '',
          startTime: '',
          endTime: '',
          maxParticipants: undefined,
          coverImage: '',
          status: 'UPCOMING',
        });
      }
    }
  }, [open, activity, reset]);

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      showToast('封面图不能超过500KB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setValue('coverImage', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ActivityFormData) => {
    try {
      const payload = {
        eventId: data.eventId,
        name: data.name,
        templateType: data.templateType as TemplateType,
        description: data.description || undefined,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
        endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
        maxParticipants: data.maxParticipants && !isNaN(data.maxParticipants) ? data.maxParticipants : undefined,
        coverImage: data.coverImage || undefined,
        status: data.status as 'UPCOMING' | 'ONGOING' | 'ENDED' | undefined,
        formSchema: data.templateType === 'CUSTOM' && customSchema.length > 0
          ? JSON.stringify(customSchema)
          : undefined,
      };

      if (isEdit) {
        await activityApi.update(activity.id, payload);
        showToast('更新成功');
      } else {
        await activityApi.create(payload);
        showToast('创建成功');
      }
      onSuccess();
    } catch (error) {
      showToast(isEdit ? '更新失败' : '创建失败', 'error');
    }
  };

  if (!open) return null;

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
          <h2 className="text-xl font-bold">{isEdit ? '编辑活动' : '新建活动'}</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#1A2E22]/40 hover:text-[#1A2E22] hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* 所属事件 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">
                所属事件 <span className="text-red-500">*</span>
              </label>
              <select
                {...register('eventId', { valueAsNumber: true })}
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none bg-white text-sm ${
                  errors.eventId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#2EB87A]'
                }`}
              >
                <option value={0}>请选择事件...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
              {errors.eventId && (
                <p className="text-xs text-red-500">{errors.eventId.message}</p>
              )}
            </div>

            {/* 活动名称 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">
                活动名称 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="例如：春季植树活动"
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none text-sm ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#2EB87A]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 模板类型 — 卡片选择器 */}
            <TemplateSelector
              value={watchedTemplateType as TemplateType | undefined}
              onChange={(type) => {
                setValue('templateType', type, { shouldValidate: true });
                setCustomSchema([]);
              }}
              error={errors.templateType?.message}
            />

            {/* 模板字段预览 */}
            {watchedTemplateType && watchedTemplateType !== 'CUSTOM' && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-[#1A2E22]/60 mb-2">
                  📋 {TEMPLATE_TYPE_LABELS[watchedTemplateType as TemplateType]}模板 — 员工报名时需填写：
                </p>
                <ul className="space-y-1">
                  {getFormSchemaByType(watchedTemplateType as TemplateType).map((f) => (
                    <li key={f.name} className="text-xs text-[#1A2E22]/50">
                      • {f.label}（{f.required ? '必填' : '选填'}，{f.type === 'text' ? '文本' : f.type === 'number' ? '数字' : f.type === 'image' ? `图片${f.max ? `×${f.max}` : ''}` : '开关'}）
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CUSTOM 模板 — 自定义字段配置提示 */}
            {watchedTemplateType === 'CUSTOM' && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs text-purple-600">
                  ⚙️ 自定义模板的字段配置将在创建后通过 formSchema JSON 配置。
                </p>
              </div>
            )}

            {/* 时间范围 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">开始时间</label>
                <input
                  {...register('startTime')}
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">结束时间</label>
                <input
                  {...register('endTime')}
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* 人数上限 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">人数上限</label>
              <input
                {...register('maxParticipants', { valueAsNumber: true })}
                type="number"
                placeholder="留空表示不限"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
              />
              {errors.maxParticipants && (
                <p className="text-xs text-red-500">{errors.maxParticipants.message}</p>
              )}
            </div>

            {/* 描述 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">描述</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="描述活动内容..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm resize-none"
              />
            </div>

            {/* 封面图 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">封面图</label>
              {coverImage ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200">
                  <img src={coverImage} alt="封面预览" className="w-full h-40 object-cover" />
                  <button
                    type="button"
                    onClick={() => setValue('coverImage', '')}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg hover:bg-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-[#2EB87A] hover:bg-[#2EB87A]/5 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-[#1A2E22]">点击上传封面图</p>
                  <p className="text-xs text-[#1A2E22]/50 mt-1">支持 JPG、PNG（≤500KB）</p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleCoverUpload}
                  />
                </label>
              )}
            </div>

            {/* 状态 */}
            {isEdit && (
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">状态</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none bg-white text-sm"
                >
                  <option value="UPCOMING">即将开始</option>
                  <option value="ONGOING">进行中</option>
                  <option value="ENDED">已结束</option>
                </select>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 font-medium text-[#1A2E22] hover:bg-white transition-colors text-sm"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] font-medium text-white hover:bg-[#2EB87A]/90 transition-colors text-sm disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
