/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      // 将 /api 请求代理到后端，使 httpOnly Cookie 在同源下工作
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
    // Windows 下编辑器/工具的「临时文件 + 重命名」原子写会触发 chokidar
    // 对被锁临时文件的 EBUSY 并使 dev server 崩溃，这里忽略这些临时产物
    watch: {
      ignored: ['**/*.tmp', '**/*.tmpdir/**', '**/*.tmp/**'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
