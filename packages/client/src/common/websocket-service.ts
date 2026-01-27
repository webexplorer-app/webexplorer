export type WebSocketMessage = {
  type: 'progress' | 'preview' | 'complete' | 'error' | 'init-success' | 'file-types';
  data: unknown;
};

export type ProgressMessage = {
  type: 'progress';
  data: {
    percent: number;
    message: string;
  };
};

export type PreviewMessage = {
  type: 'preview';
  data: {
    content: string;
    mimeType: string;
  };
};

export type CompleteMessage = {
  type: 'complete';
  data: {
    fileName: string;
    fileData: string; // base64 encoded
    mimeType: string;
  };
};

export type ErrorMessage = {
  type: 'error';
  data: {
    message: string;
  };
};

export type InitSuccessMessage = {
  type: 'init-success';
  data: {
    sessionId: string;
  };
};

export type FileTypeInfo = {
  value: string;
  label: string;
  extension: string;
};

export type FileTypesMessage = {
  type: 'file-types';
  data: {
    fileTypes: FileTypeInfo[];
  };
};

export type InitRequest = {
  type: 'init';
  locale: string;
  timezone: string;
  userAgent: string;
};

export type GetFileTypesRequest = {
  type: 'get-file-types';
};

export type FileCreationRequest = {
  type: 'create-file';
  fileType: string;
  prompt: string;
};

export type CustomizeRequest = {
  type: 'customize';
  prompt: string;
};

export type ClientRequest = InitRequest | GetFileTypesRequest | FileCreationRequest | CustomizeRequest;

export type ServerMessage = ProgressMessage | PreviewMessage | CompleteMessage | ErrorMessage | InitSuccessMessage | FileTypesMessage;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: ((message: ServerMessage) => void)[] = [];
  private connectionHandlers: ((connected: boolean) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string = 'ws://localhost:8080/ws') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.notifyConnectionHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as ServerMessage;
            this.notifyMessageHandlers(message);
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onclose = () => {
          this.notifyConnectionHandlers(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect().catch(() => {
          // Reconnection failed, will retry
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: ClientRequest) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  /**
   * Send initialization metadata to the server
   */
  sendInit(locale: string) {
    this.send({
      type: 'init',
      locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      userAgent: navigator.userAgent
    });
  }

  /**
   * Request supported file types from the server
   */
  getFileTypes() {
    this.send({
      type: 'get-file-types'
    });
  }

  createFile(fileType: string, prompt: string) {
    this.send({
      type: 'create-file',
      fileType,
      prompt
    });
  }

  customize(prompt: string) {
    this.send({
      type: 'customize',
      prompt
    });
  }

  onMessage(handler: (message: ServerMessage) => void) {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  onConnectionChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
    return () => {
      this.connectionHandlers = this.connectionHandlers.filter(h => h !== handler);
    };
  }

  private notifyMessageHandlers(message: ServerMessage) {
    this.messageHandlers.forEach(handler => handler(message));
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach(handler => handler(connected));
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let instance: WebSocketService | null = null;

export function getWebSocketService(url?: string): WebSocketService {
  if (!instance) {
    instance = new WebSocketService(url);
  }
  return instance;
}
