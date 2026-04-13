import { ClipboardCheck, Heart, Users, MapPin, Settings } from 'lucide-react';
import type { TemplateType } from '../../types/activity';
import { TEMPLATE_METADATA } from '../../constants/templateSchemas';
import type { TemplateMetadata } from '../../constants/templateSchemas';

interface TemplateSelectorProps {
  value: TemplateType | undefined;
  onChange: (type: TemplateType) => void;
  error?: string;
}

const ICON_MAP: Record<string, React.FC<{ className?: string; style?: React.CSSProperties }>> = {
  ClipboardCheck,
  Heart,
  Users,
  MapPin,
  Settings,
};

function TemplateCard({
  meta,
  selected,
  onClick,
}: {
  meta: TemplateMetadata;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = ICON_MAP[meta.icon];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
        selected
          ? 'border-[#2EB87A] bg-[#2EB87A]/5 shadow-sm'
          : 'border-gray-200 hover:border-[#2EB87A]/50 hover:bg-gray-50'
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${meta.color}20` }}
      >
        {Icon && <Icon className="w-5 h-5" style={{ color: meta.color }} />}
      </div>
      <span className="text-sm font-medium text-[#1A2E22]">{meta.name}</span>
      <span className="text-xs text-[#1A2E22]/50 leading-tight">{meta.description}</span>
    </button>
  );
}

export default function TemplateSelector({ value, onChange, error }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-[#1A2E22]">
        活动模板 <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {TEMPLATE_METADATA.map((meta) => (
          <TemplateCard
            key={meta.type}
            meta={meta}
            selected={value === meta.type}
            onClick={() => onChange(meta.type)}
          />
        ))}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
