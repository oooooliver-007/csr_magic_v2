import type { TemplateType } from '../types/activity';

interface ActivityBadgeProps {
  templateType: TemplateType;
  className?: string;
}

const badgeConfig: Record<TemplateType, { icon: string; text: string; classes: string }> = {
  DONATION: { icon: '🌱', text: '捐赠', classes: 'bg-[#2EB87A]/10 text-[#2EB87A]' },
  VOLUNTEER: { icon: '🧡', text: '志愿者', classes: 'bg-[#FFB347]/10 text-[#FFB347]' },
  CHECKIN: { icon: '✅', text: '签到', classes: 'bg-blue-500/10 text-blue-600' },
  BASIC: { icon: '📋', text: '基础', classes: 'bg-gray-500/10 text-gray-600' },
  CUSTOM: { icon: '⚙️', text: '自定义', classes: 'bg-purple-500/10 text-purple-600' },
};

export default function ActivityBadge({ templateType, className = '' }: ActivityBadgeProps) {
  const config = badgeConfig[templateType] ?? badgeConfig.BASIC;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.classes} ${className}`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}
