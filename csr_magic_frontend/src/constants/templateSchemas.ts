import type { TemplateType, FormFieldSchema } from '../types/activity';

/**
 * 模板类型元数据：名称、描述、图标标识、颜色
 */
export interface TemplateMetadata {
  type: TemplateType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * 5 种模板类型的元数据列表
 */
export const TEMPLATE_METADATA: TemplateMetadata[] = [
  {
    type: 'BASIC',
    name: '基础活动',
    description: '签名承诺、简单参与确认',
    icon: 'ClipboardCheck',
    color: '#2EB87A',
  },
  {
    type: 'DONATION',
    name: '捐赠活动',
    description: '慈善捐赠、公益募资',
    icon: 'Heart',
    color: '#F87171',
  },
  {
    type: 'VOLUNTEER',
    name: '志愿者活动',
    description: '社区服务、环保行动',
    icon: 'Users',
    color: '#60A5FA',
  },
  {
    type: 'CHECKIN',
    name: '签到活动',
    description: '活动现场签到、打卡',
    icon: 'MapPin',
    color: '#FBBF24',
  },
  {
    type: 'CUSTOM',
    name: '自定义活动',
    description: '按需配置表单字段',
    icon: 'Settings',
    color: '#A78BFA',
  },
];

/**
 * 预设模板的默认 formSchema（与后端 resolveFormSchema 保持一致）
 */
export const PRESET_FORM_SCHEMAS: Record<Exclude<TemplateType, 'CUSTOM'>, FormFieldSchema[]> = {
  BASIC: [
    { name: 'note', type: 'text', required: false, label: '文字说明' },
  ],
  DONATION: [
    { name: 'amount', type: 'number', required: true, label: '捐赠金额' },
    { name: 'message', type: 'text', required: false, label: '留言' },
  ],
  VOLUNTEER: [
    { name: 'hours', type: 'number', required: true, label: '服务时长(小时)' },
    { name: 'photos', type: 'image', required: false, max: 5, label: '活动照片' },
  ],
  CHECKIN: [
    { name: 'photo', type: 'image', required: false, max: 1, label: '签到照片' },
  ],
};

/**
 * 根据模板类型获取对应的 formSchema
 * 预设模板返回硬编码 schema，CUSTOM 模板返回空数组（需管理员配置）
 */
export function getFormSchemaByType(templateType: TemplateType): FormFieldSchema[] {
  if (templateType === 'CUSTOM') {
    return [];
  }
  return PRESET_FORM_SCHEMAS[templateType];
}

/**
 * 模板类型名称映射
 */
export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  BASIC: '基础',
  DONATION: '捐赠',
  VOLUNTEER: '志愿者',
  CHECKIN: '签到',
  CUSTOM: '自定义',
};
