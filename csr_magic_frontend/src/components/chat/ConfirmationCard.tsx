import { Loader2 } from 'lucide-react';
import type { FormFieldSchema } from '../../types/activity';

interface ConfirmationCardProps {
  schema: FormFieldSchema[];
  collectedFields: Record<string, unknown>;
  onConfirm: () => void;
  onEdit: () => void;
  submitting?: boolean;
}

/**
 * Agent 收集完成后的确认摘要卡片
 * - 列出已收集的字段 + 值
 * - 「确认提交」触发 participationApi.signup
 * - 「继续修改」回到对话继续收集
 */
export default function ConfirmationCard({
  schema,
  collectedFields,
  onConfirm,
  onEdit,
  submitting = false,
}: ConfirmationCardProps) {
  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl border border-[#2EB87A]/40 shadow-sm p-5 space-y-4">
      <div>
        <h3 className="font-bold text-[#1A2E22] text-base">确认报名信息</h3>
        <p className="text-xs text-[#1A2E22]/60 mt-0.5">
          请核对以下信息，确认无误后即可提交。
        </p>
      </div>

      <dl className="space-y-2">
        {schema.length === 0 ? (
          <p className="text-sm text-[#1A2E22]/60">无需额外信息。</p>
        ) : (
          schema.map((field) => {
            const val = collectedFields[field.name];
            const display =
              val === null || val === undefined || val === ''
                ? '（跳过）'
                : typeof val === 'boolean'
                  ? val
                    ? '是'
                    : '否'
                  : String(val);
            return (
              <div
                key={field.name}
                className="flex items-start justify-between text-sm border-b border-dashed border-gray-100 pb-1.5 last:border-0"
              >
                <dt className="text-[#1A2E22]/60">{field.label}</dt>
                <dd className="font-medium text-[#1A2E22] text-right max-w-[60%] break-words">
                  {display}
                </dd>
              </div>
            );
          })
        )}
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-[#1A2E22] font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          继续修改
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl bg-[#2EB87A] text-white font-bold hover:bg-[#2EB87A]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? '提交中' : '确认提交'}
        </button>
      </div>
    </div>
  );
}
