// Runtime polyfills for browser environment
// This handles dynamic imports and module resolution

// Create a global module cache
const moduleCache = new Map();

// WebSocket polyfill
class WebSocketPolyfill {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.ws = new WebSocket(url, protocols);
  }

  on(event: string, callback: (data: any) => void) {
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

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close(code?: number, reason?: string) {
    if (this.ws) {
      this.ws.close(code, reason);
    }
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

// Add static properties
WebSocketPolyfill.CONNECTING = WebSocket.CONNECTING;
WebSocketPolyfill.OPEN = WebSocket.OPEN;
WebSocketPolyfill.CLOSING = WebSocket.CLOSING;
WebSocketPolyfill.CLOSED = WebSocket.CLOSED;

// Register the ws module
moduleCache.set('ws', {
  default: WebSocketPolyfill,
  WebSocket: WebSocketPolyfill,
  CONNECTING: WebSocket.CONNECTING,
  OPEN: WebSocket.OPEN,
  CLOSING: WebSocket.CLOSING,
  CLOSED: WebSocket.CLOSED,
});

// Override require if it exists (for compatibility)
if (typeof window !== 'undefined') {
  (window as any).require = (moduleName: string) => {
    if (moduleCache.has(moduleName)) {
      return moduleCache.get(moduleName);
    }
    throw new Error(`Module '${moduleName}' not found`);
  };
}

export { WebSocketPolyfill };
export default moduleCache; 