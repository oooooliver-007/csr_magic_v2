/**
 * 头像取字：取显示名/用户名中首个字母、数字或汉字字符，
 * 过滤 HTML 标签等特殊字符（如 `<b>加粗姓名</b>` 不应显示为「<」）。
 */
export function getAvatarInitial(name?: string | null, fallback = 'U'): string {
  if (!name) return fallback;
  const match = name.match(/[\p{L}\p{N}]/u);
  return match ? match[0] : fallback;
}