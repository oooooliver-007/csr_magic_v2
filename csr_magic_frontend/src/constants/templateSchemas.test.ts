import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_METADATA,
  PRESET_FORM_SCHEMAS,
  getFormSchemaByType,
  TEMPLATE_TYPE_LABELS,
} from './templateSchemas';
import type { TemplateType } from '../types/activity';

describe('templateSchemas', () => {
  it('TEMPLATE_METADATA 包含 5 种模板类型', () => {
    expect(TEMPLATE_METADATA).toHaveLength(5);
    const types = TEMPLATE_METADATA.map((m) => m.type);
    expect(types).toContain('BASIC');
    expect(types).toContain('DONATION');
    expect(types).toContain('VOLUNTEER');
    expect(types).toContain('CHECKIN');
    expect(types).toContain('CUSTOM');
  });

  it('PRESET_FORM_SCHEMAS 包含 4 种预设模板', () => {
    expect(Object.keys(PRESET_FORM_SCHEMAS)).toHaveLength(4);
    expect(PRESET_FORM_SCHEMAS.BASIC).toBeDefined();
    expect(PRESET_FORM_SCHEMAS.DONATION).toBeDefined();
    expect(PRESET_FORM_SCHEMAS.VOLUNTEER).toBeDefined();
    expect(PRESET_FORM_SCHEMAS.CHECKIN).toBeDefined();
  });

  it('BASIC 模板包含 note 字段', () => {
    const fields = PRESET_FORM_SCHEMAS.BASIC;
    expect(fields).toHaveLength(1);
    expect(fields[0]!.name).toBe('note');
    expect(fields[0]!.type).toBe('text');
    expect(fields[0]!.required).toBe(false);
  });

  it('DONATION 模板包含 amount（必填）和 message（选填）', () => {
    const fields = PRESET_FORM_SCHEMAS.DONATION;
    expect(fields).toHaveLength(2);
    const amount = fields.find((f) => f.name === 'amount');
    const message = fields.find((f) => f.name === 'message');
    expect(amount?.required).toBe(true);
    expect(amount?.type).toBe('number');
    expect(message?.required).toBe(false);
  });

  it('VOLUNTEER 模板包含 hours（必填）和 photos（选填，最多5张）', () => {
    const fields = PRESET_FORM_SCHEMAS.VOLUNTEER;
    expect(fields).toHaveLength(2);
    const hours = fields.find((f) => f.name === 'hours');
    const photos = fields.find((f) => f.name === 'photos');
    expect(hours?.required).toBe(true);
    expect(hours?.type).toBe('number');
    expect(photos?.type).toBe('image');
    expect(photos?.max).toBe(5);
  });

  it('CHECKIN 模板包含 photo（选填，最多1张）', () => {
    const fields = PRESET_FORM_SCHEMAS.CHECKIN;
    expect(fields).toHaveLength(1);
    expect(fields[0]!.name).toBe('photo');
    expect(fields[0]!.type).toBe('image');
    expect(fields[0]!.max).toBe(1);
  });

  it('getFormSchemaByType 返回预设模板的 schema', () => {
    const presetTypes: TemplateType[] = ['BASIC', 'DONATION', 'VOLUNTEER', 'CHECKIN'];
    for (const type of presetTypes) {
      const schema = getFormSchemaByType(type);
      expect(schema.length).toBeGreaterThan(0);
    }
  });

  it('getFormSchemaByType CUSTOM 返回空数组', () => {
    expect(getFormSchemaByType('CUSTOM')).toEqual([]);
  });

  it('TEMPLATE_TYPE_LABELS 包含所有 5 种类型的中文标签', () => {
    expect(TEMPLATE_TYPE_LABELS.BASIC).toBe('基础');
    expect(TEMPLATE_TYPE_LABELS.DONATION).toBe('捐赠');
    expect(TEMPLATE_TYPE_LABELS.VOLUNTEER).toBe('志愿者');
    expect(TEMPLATE_TYPE_LABELS.CHECKIN).toBe('签到');
    expect(TEMPLATE_TYPE_LABELS.CUSTOM).toBe('自定义');
  });
});
