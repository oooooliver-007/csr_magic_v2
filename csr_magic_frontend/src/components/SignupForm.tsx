import { useState, useCallback } from 'react';
import type { TemplateType, FormFieldSchema, Activity } from '../types/activity';
import type { FamilyMember } from '../types/participation';
import DynamicForm from './DynamicForm';
import FamilyMembersInput from './FamilyMembersInput';
import { getFormSchemaByType, TEMPLATE_TYPE_LABELS } from '../constants/templateSchemas';

interface SignupFormProps {
  templateType: TemplateType;
  formSchemaJson: string | null;
  onSubmit: (formData: Record<string, unknown>, familyMembers: FamilyMember[]) => Promise<void>;
  disabled?: boolean;
  activity?: Activity;
  initialFamilyMembers?: FamilyMember[];
}

/**
 * 员工端活动报名表单
 * 根据活动的 templateType 和 formSchema 动态渲染报名字段
 * 用于 ActivityDetailPage 中的报名流程
 */
export default function SignupForm({
  templateType,
  formSchemaJson,
  onSubmit,
  disabled = false,
  activity,
  initialFamilyMembers,
}: SignupFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialFamilyMembers ?? []
  );

  const schema: FormFieldSchema[] = (() => {
    if (templateType === 'CUSTOM' && formSchemaJson) {
      try {
        return JSON.parse(formSchemaJson) as FormFieldSchema[];
      } catch {
        return [];
      }
    }
    return getFormSchemaByType(templateType);
  })();

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const field of schema) {
      if (field.required) {
        const val = values[field.name];
        if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
          newErrors[field.name] = `${field.label}不能为空`;
        }
        if (field.type === 'number' && typeof val === 'number' && val <= 0) {
          newErrors[field.name] = `${field.label}必须大于0`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const validMembers = familyMembers.filter((m) => m.name.trim() !== '');
      await onSubmit(values, validMembers);
    } finally {
      setSubmitting(false);
    }
  };

  const isCheckin = templateType === 'CHECKIN';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#2EB87A]/10 text-[#2EB87A]">
          {TEMPLATE_TYPE_LABELS[templateType]}
        </span>
      </div>

      <DynamicForm
        schema={schema}
        values={values}
        onChange={handleChange}
        errors={errors}
        disabled={disabled || submitting}
        showCheckinTime={isCheckin}
      />

      {activity?.allowFamily && (
        <FamilyMembersInput
          value={familyMembers}
          onChange={setFamilyMembers}
          maxCount={activity.maxFamilyPerUser}
          disabled={disabled || submitting}
        />
      )}

      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full py-3 rounded-xl bg-[#2EB87A] text-white font-medium hover:bg-[#2EB87A]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '提交中...' : isCheckin ? '确认签到' : '提交报名'}
      </button>
    </form>
  );
}
