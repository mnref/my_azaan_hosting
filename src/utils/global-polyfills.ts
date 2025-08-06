// Global polyfills for browser environment
// This file should be imported early in the application lifecycle

// WebSocket polyfill
if (typeof window !== 'undefined') {
  // Make WebSocket available globally for any modules that expect it
  (window as any).WebSocket = window.WebSocket;
  
  // Create a comprehensive ws module polyfill
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

  // Make it available globally
  (window as any).ws = {
    WebSocket: WebSocketPolyfill,
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
  };
}

// Other potential polyfills can be added here
export {}; 