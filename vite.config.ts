import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Mặc định kết nối thẳng Backend Local (http://localhost:8080) để tốc độ phản hồi <10ms, không bị delay do Render ngủ (cold start)
  const target = env.VITE_PROXY_TARGET || env.VITE_API_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
})