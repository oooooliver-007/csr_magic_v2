import { Plus, Trash2 } from 'lucide-react';
import type { FamilyMember, FamilyRelation } from '../types/participation';
import { FAMILY_RELATION_OPTIONS } from '../constants/familyRelation';

interface FamilyMembersInputProps {
  value: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
  maxCount: number | null;
  disabled?: boolean;
}

export default function FamilyMembersInput({
  value,
  onChange,
  maxCount,
  disabled = false,
}: FamilyMembersInputProps) {
  const effectiveMax = maxCount ?? 10;
  const currentCount = value.filter((m) => m.name.trim() !== '').length;

  const handleAdd = () => {
    if (currentCount >= effectiveMax) return;
    onChange([...value, { name: '', relation: 'SPOUSE' }]);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleNameChange = (index: number, name: string) => {
    const next = value.map((m, i) => (i === index ? { ...m, name } : m));
    onChange(next);
  };

  const handleRelationChange = (index: number, relation: FamilyRelation) => {
    const next = value.map((m, i) => (i === index ? { ...m, relation } : m));
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[#1A2E22]">携带家属（可选）</p>
        <span className="text-xs text-[#1A2E22]/50">
          {currentCount}/{effectiveMax}
        </span>
      </div>
      <p className="text-xs text-[#1A2E22]/50 -mt-1">
        本活动允许携带家属，家属将与您一起占用活动名额
      </p>

      <div className="space-y-2">
        {value.map((member, index) => (
          <div
            key={index}
            className="flex items-center gap-2 flex-wrap md:flex-nowrap"
          >
            <input
              type="text"
              value={member.name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              disabled={disabled}
              placeholder="家属姓名"
              className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2EB87A] disabled:bg-gray-50 disabled:text-gray-400"
            />
            <select
              value={member.relation}
              onChange={(e) =>
                handleRelationChange(index, e.target.value as FamilyRelation)
              }
              disabled={disabled}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:border-[#2EB87A] disabled:bg-gray-50 disabled:text-gray-400"
            >
              {FAMILY_RELATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 text-[#1A2E22]/30 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {currentCount < effectiveMax && !disabled && (
        <button
          type="button"
          onClick={handleAdd}
          className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-sm text-[#1A2E22]/50 hover:border-[#2EB87A] hover:text-[#2EB87A] hover:bg-[#2EB87A]/5 transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          添加家属
        </button>
      )}
    </div>
  );
}
