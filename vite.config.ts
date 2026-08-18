import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Mặc định kết nối thẳng Backend Local (http://localhost:8080) để tốc độ phản hồi <10ms, không bị delay do Render ngủ (cold start)
  // Chỉ dùng VITE_PROXY_TARGET/VITE_API_URL làm proxy target nếu là URL tuyệt đối (http/https),
  // vì VITE_API_URL có thể là đường dẫn tương đối (vd: "/api") dùng cho fetch phía client.
  const target = [env.VITE_PROXY_TARGET, env.VITE_API_URL].find(isAbsoluteUrl) || 'https://greenslot-backend-llqv.onrender.com';

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