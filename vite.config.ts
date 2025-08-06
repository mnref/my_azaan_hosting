import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg'],
    exclude: ['faye-websocket'],
  },
  ssr: {
    noExternal: ['@ffmpeg/ffmpeg'],
  },
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      'ws': './src/utils/ws-polyfill.ts',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      external: ['ws'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    // Development proxy - only used in development
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'http://172.184.138.18:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    } : undefined,
  },
});
