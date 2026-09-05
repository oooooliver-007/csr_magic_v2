import { defineConfig } from '@playwright/test';

/**
 * 线上黑盒回归配置（joy4giving.cn）
 * 运行：npx playwright test -c playwright.prod.config.ts
 * 注意：直接打生产环境，workers=1 串行执行，用例自带数据清理
 */
export default defineConfig({
  testDir: './e2e/prod',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://joy4giving.cn',
    headless: true,
    channel: 'msedge',
    locale: 'zh-CN',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
});
