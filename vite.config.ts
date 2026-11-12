import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 本地优先：不使用任何运行时 CDN；基址 './' 使构建产物可在本地静态服务器下直接访问。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, strictPort: true, host: '127.0.0.1' },
  preview: { port: 4173, strictPort: true, host: '127.0.0.1' },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1500 },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
