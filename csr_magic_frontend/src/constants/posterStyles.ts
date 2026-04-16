import type { StyleOption } from '../types/poster';

export const POSTER_STYLES: StyleOption[] = [
  { value: 'minimalist', label: 'Minimalist', labelZh: '简约现代' },
  { value: 'watercolor', label: 'Watercolor', labelZh: '水彩手绘' },
  { value: '3d', label: '3D Render', labelZh: '3D 立体' },
  { value: 'cartoon', label: 'Cartoon', labelZh: '卡通插画' },
  { value: 'chinese', label: 'Chinese', labelZh: '国潮' },
  { value: 'realistic', label: 'Realistic', labelZh: '写实摄影' },
];

/** 轮询间隔（毫秒） */
export const POLL_INTERVAL_MS = 3000;

/** 轮询超时（毫秒）— 2 分钟 */
export const POLL_TIMEOUT_MS = 120000;
