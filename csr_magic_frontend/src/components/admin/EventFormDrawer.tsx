import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, Trash2 } from 'lucide-react';
import { eventApi } from '../../services/eventApi';
import type { Event } from '../../types/event';

const eventSchema = z.object({
  name: z.string().min(1, '事件名称不能为空').max(200, '事件名称不能超过200字'),
  description: z.string().optional(),
  type: z.enum(['OFFLINE', 'ONLINE', 'HYBRID']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().optional(),
  visible: z.boolean().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormDrawerProps {
  open: boolean;
  event: Event | null;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export default function EventFormDrawer({ open, event, onClose, onSuccess, showToast }: EventFormDrawerProps) {
  const isEdit = event !== null;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      type: undefined,
      startDate: '',
      endDate: '',
      coverImage: '',
      visible: true,
    },
  });

  const coverImage = watch('coverImage');

  useEffect(() => {
    if (open) {
      if (event) {
        reset({
          name: event.name,
          description: event.description ?? '',
          type: (event.type as 'OFFLINE' | 'ONLINE' | 'HYBRID') ?? undefined,
          startDate: event.startDate ? event.startDate.slice(0, 10) : '',
          endDate: event.endDate ? event.endDate.slice(0, 10) : '',
          coverImage: event.coverImage ?? '',
          visible: event.visible,
        });
      } else {
        reset({
          name: '',
          description: '',
          type: undefined,
          startDate: '',
          endDate: '',
          coverImage: '',
          visible: true,
        });
      }
    }
  }, [open, event, reset]);

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

  const onSubmit = async (data: EventFormData) => {
    try {
      const payload = {
        name: data.name,
        description: data.description || undefined,
        type: data.type || undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        coverImage: data.coverImage || undefined,
        visible: data.visible,
      };

      if (isEdit) {
        await eventApi.update(event.id, payload);
        showToast('更新成功');
      } else {
        await eventApi.create(payload);
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
          <h2 className="text-xl font-bold">{isEdit ? '编辑事件' : '新建事件'}</h2>
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
            {/* 事件名称 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">
                事件名称 <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="例如：2026春季CSR月"
                className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none text-sm ${
                  errors.name ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#2EB87A]'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* 描述 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">描述</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="描述事件内容..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm resize-none"
              />
            </div>

            {/* 类型 */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-[#1A2E22]">类型</label>
              <select
                {...register('type')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none bg-white text-sm"
              >
                <option value="">请选择类型...</option>
                <option value="OFFLINE">线下</option>
                <option value="ONLINE">线上</option>
                <option value="HYBRID">混合</option>
              </select>
            </div>

            {/* 时间范围 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">开始时间</label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#1A2E22]">结束时间</label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#2EB87A] focus:outline-none text-sm"
                />
              </div>
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

            {/* 显示开关 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-[#1A2E22]">是否在用户端展示</label>
              <button
                type="button"
                onClick={() => setValue('visible', !watch('visible'))}
                className="transition-colors"
              >
                {watch('visible') ? (
                  <div className="w-11 h-6 bg-[#2EB87A] rounded-full flex items-center px-0.5">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm ml-auto" />
                  </div>
                ) : (
                  <div className="w-11 h-6 bg-gray-300 rounded-full flex items-center px-0.5">
                    <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                )}
              </button>
            </div>
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
