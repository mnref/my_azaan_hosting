// Build-time polyfills for browser environment
// This ensures compatibility with Node.js modules in the browser

// WebSocket polyfill
const WebSocketPolyfill = class {
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

  addEventListener(event: string, callback: (data: any) => void) {
    this.on(event, callback);
  }

  removeEventListener(event: string, callback: (data: any) => void) {
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
};

// Static properties
WebSocketPolyfill.CONNECTING = WebSocket.CONNECTING;
WebSocketPolyfill.OPEN = WebSocket.OPEN;
WebSocketPolyfill.CLOSING = WebSocket.CLOSING;
WebSocketPolyfill.CLOSED = WebSocket.CLOSED;

// Export the polyfill
export default WebSocketPolyfill;
export { WebSocketPolyfill as WebSocket }; 