import type { FamilyRelation } from '../types/participation';

export const FAMILY_RELATION_LABELS: Record<FamilyRelation, string> = {
  SPOUSE: '配偶',
  CHILD: '子女',
  PARENT: '父母',
  OTHER: '其他',
};

export const FAMILY_RELATION_OPTIONS: Array<{ value: FamilyRelation; label: string }> = [
  { value: 'SPOUSE', label: '配偶' },
  { value: 'CHILD', label: '子女' },
  { value: 'PARENT', label: '父母' },
  { value: 'OTHER', label: '其他' },
];
