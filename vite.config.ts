import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to handle WebSocket polyfill
const wsPolyfillPlugin = () => {
  return {
    name: 'ws-polyfill',
    resolveId(id: string) {
      if (id === 'ws') {
        return 'virtual:ws-polyfill';
      }
    },
    load(id: string) {
      if (id === 'virtual:ws-polyfill') {
        return `
          // WebSocket polyfill for browser environment
          class WebSocketPolyfill {
            constructor(url, protocols) {
              this.ws = new WebSocket(url, protocols);
            }
            
            on(event, callback) {
              if (!this.ws) return;
              
              switch (event) {
                case 'open':
                  this.ws.onopen = callback;
                  break;
                case 'message':
                  this.ws.onmessage = (e) => callback(e.data);
                  break;
                case 'close':
                  this.ws.onclose = callback;
                  break;
                case 'error':
                  this.ws.onerror = callback;
                  break;
              }
            }
            
            addEventListener(event, callback) {
              this.on(event, callback);
            }
            
            removeEventListener(event, callback) {
              if (!this.ws) return;
              
              switch (event) {
                case 'open':
                  this.ws.onopen = null;
                  break;
                case 'message':
                  this.ws.onmessage = null;
                  break;
                case 'close':
                  this.ws.onclose = null;
                  break;
                case 'error':
                  this.ws.onerror = null;
                  break;
              }
            }
            
            send(data) {
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(data);
              }
            }
            
            close(code, reason) {
              if (this.ws) {
                this.ws.close(code, reason);
              }
            }
            
            get readyState() {
              return this.ws ? this.ws.readyState : WebSocket.CLOSED;
            }
            
            get url() {
              return this.url;
            }
            
            get protocol() {
              return this.ws ? this.ws.protocol : '';
            }
            
            get extensions() {
              return this.ws ? this.ws.extensions : '';
            }
            
            get bufferedAmount() {
              return this.ws ? this.ws.bufferedAmount : 0;
            }
          }
          
          // Add static properties
          WebSocketPolyfill.CONNECTING = WebSocket.CONNECTING;
          WebSocketPolyfill.OPEN = WebSocket.OPEN;
          WebSocketPolyfill.CLOSING = WebSocket.CLOSING;
          WebSocketPolyfill.CLOSED = WebSocket.CLOSED;
          
          // Export both default and named exports
          export default WebSocketPolyfill;
          export { WebSocketPolyfill as WebSocket };
        `;
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), wsPolyfillPlugin()],
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg'],
    exclude: ['faye-websocket'],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
  },
  ssr: {
    noExternal: ['@ffmpeg/ffmpeg'],
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  resolve: {
    alias: {
      'ws': 'virtual:ws-polyfill',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ffmpeg: ['@ffmpeg/ffmpeg', '@ffmpeg/core'],
        },
      },
      external: [],
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
