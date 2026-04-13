import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    channel: 'msedge',
    storageState: './e2e/.auth/storage-state.json',
    trace: 'on-first-retry',
  },
});
