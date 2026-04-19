import { AlertCircle } from 'lucide-react';
import type { FormFieldSchema } from '../../types/activity';
import type { ChatStage } from '../../types/chat';
import ConfirmationCard from './ConfirmationCard';
import SuccessCard from './SuccessCard';

interface ChatFooterProps {
  stage: ChatStage;
  submitted: boolean;
  submitting: boolean;
  error: string | null;
  schema: FormFieldSchema[];
  collectedFields: Record<string, unknown>;
  activityName: string;
  onConfirm: () => void;
  onEdit: () => void;
  onViewDetail: () => void;
  onBackHome: () => void;
}

/**
 * 对话下方的动态 footer：
 * - submitted：SuccessCard
 * - CONFIRMING：ConfirmationCard
 * - 存在 error：红色提示
 * - 其他：null
 */
export default function ChatFooter({
  stage,
  submitted,
  submitting,
  error,
  schema,
  collectedFields,
  activityName,
  onConfirm,
  onEdit,
  onViewDetail,
  onBackHome,
}: ChatFooterProps) {
  if (submitted) {
    return (
      <SuccessCard
        activityName={activityName}
        onViewDetail={onViewDetail}
        onBackHome={onBackHome}
      />
    );
  }
  if (stage === 'CONFIRMING') {
    return (
      <ConfirmationCard
        schema={schema}
        collectedFields={collectedFields}
        onConfirm={onConfirm}
        onEdit={onEdit}
        submitting={submitting}
      />
    );
  }
  if (error) {
    return (
      <div
        role="alert"
        className="max-w-md mx-auto flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-2.5"
      >
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }
  return null;
}
