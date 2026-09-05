import { describe, it, expect } from 'vitest';
import { getAvatarInitial } from './avatar';

describe('getAvatarInitial 头像取字净化', () => {
  it('HTML 标签开头的显示名取首个有效字符，不显示「<」', () => {
    expect(getAvatarInitial('<b>加粗姓名</b>')).toBe('b');
  });

  it('特殊符号开头时跳过符号取下一个有效字符', () => {
    expect(getAvatarInitial('*星号姓名')).toBe('星');
  });

  it('纯特殊字符回退到默认字符', () => {
    expect(getAvatarInitial('<<>>')).toBe('U');
  });

  it('空值回退到默认字符', () => {
    expect(getAvatarInitial(null)).toBe('U');
    expect(getAvatarInitial(undefined)).toBe('U');
    expect(getAvatarInitial('')).toBe('U');
  });

  it('支持自定义回退字符', () => {
    expect(getAvatarInitial(null, '?')).toBe('?');
  });

  it('普通中文名取第一个汉字', () => {
    expect(getAvatarInitial('张三')).toBe('张');
  });
});