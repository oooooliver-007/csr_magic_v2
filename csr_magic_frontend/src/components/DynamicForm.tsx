import { useState } from 'react';
import { Upload, Trash2, Clock } from 'lucide-react';
import type { FormFieldSchema } from '../types/activity';

interface DynamicFormProps {
  schema: FormFieldSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showCheckinTime?: boolean;
}

function TextFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: FormFieldSchema;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-[#1A2E22]">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={3}
        placeholder={`请输入${field.label}`}
        className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none text-sm resize-none ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#2EB87A]'
        } ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function NumberFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: FormFieldSchema;
  value: number | '';
  onChange: (val: number | '') => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-[#1A2E22]">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? '' : Number(v));
        }}
        disabled={disabled}
        placeholder={`请输入${field.label}`}
        min={0}
        className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none text-sm ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-[#2EB87A]'
        } ${disabled ? 'bg-gray-50 text-gray-400' : ''}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function ImageFieldInput({
  field,
  value,
  onChange,
  error,
  disabled,
}: {
  field: FormFieldSchema;
  value: string[];
  onChange: (val: string[]) => void;
  error?: string;
  disabled?: boolean;
}) {
  const maxCount = field.max ?? 1;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChange([...value, result].slice(0, maxCount));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold text-[#1A2E22]">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
        <span className="text-xs text-[#1A2E22]/40 ml-1">（最多{maxCount}张）</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {value.map((img, idx) => (
          <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
            <img src={img} alt="" className="w-full h-full object-cover" />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 p-0.5 bg-white/90 rounded-md hover:bg-white transition-colors"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </div>
        ))}
        {value.length < maxCount && !disabled && (
          <label className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-[#2EB87A] hover:bg-[#2EB87A]/5 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-gray-400" />
            <span className="text-[10px] text-gray-400 mt-1">上传</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function BooleanFieldInput({
  field,
  value,
  onChange,
  disabled,
}: {
  field: FormFieldSchema;
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <button
        type="button"
        onClick={() => !disabled && onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${
          value ? 'bg-[#2EB87A]' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <label className="text-sm font-medium text-[#1A2E22]">{field.label}</label>
    </div>
  );
}

/**
 * 动态表单渲染器：根据 FormFieldSchema 数组动态生成表单字段
 * 支持 text / number / image / boolean 四种字段类型
 */
export default function DynamicForm({
  schema,
  values,
  onChange,
  errors = {},
  disabled = false,
  showCheckinTime = false,
}: DynamicFormProps) {
  const [checkinTime] = useState(() => new Date().toISOString());

  if (schema.length === 0) {
    return (
      <p className="text-sm text-[#1A2E22]/40 text-center py-4">
        暂无报名字段
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {showCheckinTime && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2EB87A]/5 rounded-xl border border-[#2EB87A]/20">
          <Clock className="w-4 h-4 text-[#2EB87A]" />
          <span className="text-sm text-[#1A2E22]">
            签到时间：{new Date(checkinTime).toLocaleString('zh-CN')}
          </span>
        </div>
      )}
      {schema.map((field) => {
        switch (field.type) {
          case 'text':
            return (
              <TextFieldInput
                key={field.name}
                field={field}
                value={(values[field.name] as string) ?? ''}
                onChange={(val) => onChange(field.name, val)}
                error={errors[field.name]}
                disabled={disabled}
              />
            );
          case 'number':
            return (
              <NumberFieldInput
                key={field.name}
                field={field}
                value={(values[field.name] as number | '') ?? ''}
                onChange={(val) => onChange(field.name, val)}
                error={errors[field.name]}
                disabled={disabled}
              />
            );
          case 'image':
            return (
              <ImageFieldInput
                key={field.name}
                field={field}
                value={(values[field.name] as string[]) ?? []}
                onChange={(val) => onChange(field.name, val)}
                error={errors[field.name]}
                disabled={disabled}
              />
            );
          case 'boolean':
            return (
              <BooleanFieldInput
                key={field.name}
                field={field}
                value={(values[field.name] as boolean) ?? false}
                onChange={(val) => onChange(field.name, val)}
                disabled={disabled}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
