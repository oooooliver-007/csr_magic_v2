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

  // 自动启动前后端服务（dev profile），测试结束自动关闭
  webServer: [
    {
      // 前端 Vite 开发服务器（端口 3000）
      command: 'npx vite --port 3000',
      port: 3000,
      timeout: 30_000,
      reuseExistingServer: true,
    },
    {
      // 后端 Spring Boot（dev profile，端口 8080）
      command: 'cd ../csr_magic_backend && mvn spring-boot:run -Dspring-boot.profiles.active=dev',
      port: 8080,
      timeout: 120_000,
      reuseExistingServer: true,
    },
  ],
});