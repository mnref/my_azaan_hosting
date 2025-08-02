import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg'],
  },
  ssr: {
    noExternal: ['@ffmpeg/ffmpeg'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://172.184.138.18:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
});
