import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // 使用相对路径，方便部署到 GitHub Pages 子目录
    base: './',

    define: {
      // This is just generic value for the GEMINI API key.
      // This is not used at all, and can be ignored!
      'process.env.API_KEY': JSON.stringify(
        'api-key-this-is-not-used-can-be-ignored!'
      ),
    },

    server: {
      proxy: {
        // 本地开发时代理到 Node.js backend
        '/api-proxy': 'http://localhost:5000',
        '/ws-proxy': {
          target: 'ws://localhost:5000',
          ws: true,
        },
      },
    },

    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
  };
});