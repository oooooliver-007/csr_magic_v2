import React from 'react';
import { cn } from '../lib/utils';

type BadgeType = 'donation' | 'volunteer' | 'check-in' | 'general';

interface BadgeProps {
  type: BadgeType;
  className?: string;
}

export function Badge({ type, className }: BadgeProps) {
  const badgeConfig = {
    'donation': { icon: '🌱', text: 'Donation', classes: 'bg-[#2EB87A]/10 text-[#2EB87A]' },
    'volunteer': { icon: '🧡', text: 'Volunteer', classes: 'bg-[#FFB347]/10 text-[#FFB347]' },
    'check-in': { icon: '✅', text: 'Check-in', classes: 'bg-blue-500/10 text-blue-600' },
    'general': { icon: '📋', text: 'General', classes: 'bg-gray-500/10 text-gray-600' },
  };

  const config = badgeConfig[type];

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", config.classes, className)}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}
