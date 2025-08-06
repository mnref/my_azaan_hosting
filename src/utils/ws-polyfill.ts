// WebSocket polyfill for browser environment
// This replaces the Node.js 'ws' module with browser WebSocket

export default class WebSocketPolyfill {
  private ws: WebSocket | null = null;
  private url: string;

  constructor(url: string) {
    this.url = url;
    this.ws = new WebSocket(url);
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

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}

// Export as default and named export
export { WebSocketPolyfill as WebSocket }; 