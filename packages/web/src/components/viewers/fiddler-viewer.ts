import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import { createArchiveWorker } from '../../common/archive-worker';

interface FiddlerSession {
  id: number;
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
  };
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body?: Uint8Array;
    bodyText?: string;
  };
  timers?: {
    ClientConnected?: string;
    ClientBeginRequest?: string;
    GotRequestHeaders?: string;
    ClientDoneRequest?: string;
    ServerConnected?: string;
    FiddlerBeginRequest?: string;
    ServerGotRequest?: string;
    ServerBeginResponse?: string;
    GotResponseHeaders?: string;
    ServerDoneResponse?: string;
    ClientBeginResponse?: string;
    ClientDoneResponse?: string;
  };
}

@customElement('fiddler-viewer')
export class FiddlerViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .sessions-list {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      overflow: hidden;
    }

    .session-header {
      display: grid;
      grid-template-columns: 60px 80px 1fr 100px;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted, #666);
    }

    .session-row {
      display: grid;
      grid-template-columns: 60px 80px 1fr 100px;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-bottom: 1px solid var(--border-light, #eee);
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text, #333);
    }

    .session-row:hover {
      background: var(--surface-hover, #f9f9f9);
    }

    .session-row.selected {
      background: var(--primary-light, #e3f2fd);
    }

    .session-row:last-child {
      border-bottom: none;
    }

    .session-id {
      color: var(--text-muted, #666);
    }

    .session-method {
      font-weight: 600;
    }

    .session-method.get { color: #4caf50; }
    .session-method.post { color: #2196f3; }
    .session-method.put { color: #ff9800; }
    .session-method.delete { color: #f44336; }
    .session-method.patch { color: #9c27b0; }

    .session-url {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-status {
      text-align: right;
    }

    .status-2xx { color: #4caf50; }
    .status-3xx { color: #2196f3; }
    .status-4xx { color: #ff9800; }
    .status-5xx { color: #f44336; }

    .session-detail {
      margin-top: 1rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      overflow: hidden;
    }

    .detail-tabs {
      display: flex;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
    }

    .detail-tab {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-muted, #666);
      border-bottom: 2px solid transparent;
    }

    .detail-tab:hover {
      color: var(--text, #333);
    }

    .detail-tab.active {
      color: var(--primary, #0066CC);
      border-bottom-color: var(--primary, #0066CC);
    }

    .detail-content {
      padding: 1rem;
    }

    .headers-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }

    .headers-table th,
    .headers-table td {
      padding: 0.25rem 0.5rem;
      text-align: left;
      border-bottom: 1px solid var(--border-light, #eee);
    }

    .headers-table th {
      font-weight: 600;
      color: var(--text-muted, #666);
      width: 200px;
    }

    .headers-table td {
      font-family: var(--font-mono, monospace);
      word-break: break-all;
    }

    .body-content {
      font-family: var(--font-mono, monospace);
      font-size: 0.8125rem;
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--surface-alt, #f5f5f5);
      padding: 1rem;
      border-radius: 4px;
      max-height: 400px;
      overflow: auto;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
    }

    .error {
      color: var(--error, #d32f2f);
    }

    .stats {
      margin-bottom: 1rem;
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private sessions: FiddlerSession[] = [];

  @state()
  private selectedSession: FiddlerSession | null = null;

  @state()
  private activeTab: 'request' | 'response' | 'timers' = 'request';

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  private worker = createArchiveWorker();

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadSazFile();
    }
  }

  private async loadSazFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.sessions = [];
    this.selectedSession = null;

    try {
      await this.worker.init();
      await this.worker.open(this.file, '');
      const entries = await this.worker.entries();

      // Parse SAZ structure - sessions are in raw/ folder
      const sessionMap = new Map<number, Partial<FiddlerSession>>();

      for (const entry of entries) {
        const match = entry.path.match(/raw\/(\d+)_(c|s|m)\.txt$/);
        if (!match) continue;

        const sessionId = parseInt(match[1], 10);
        const type = match[2]; // c = client request, s = server response, m = metadata

        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, { id: sessionId });
        }

        const session = sessionMap.get(sessionId)!;
        const uint8Data = new Uint8Array(entry.data.buffer, entry.data.byteOffset, entry.data.byteLength);
        const textDecoder = new TextDecoder('utf-8');
        const text = textDecoder.decode(uint8Data);

        if (type === 'c') {
          session.request = this.parseRequest(text);
        } else if (type === 's') {
          session.response = this.parseResponse(uint8Data);
        } else if (type === 'm') {
          session.timers = this.parseMetadata(text);
        }
      }

      // Convert to array and sort by session ID
      this.sessions = Array.from(sessionMap.values())
        .filter(s => s.request && s.response)
        .sort((a, b) => (a.id || 0) - (b.id || 0)) as FiddlerSession[];

    } catch (err) {
      this.error = 'Failed to parse Fiddler archive';
      console.error('Fiddler parse error:', err);
    } finally {
      this.loading = false;
    }
  }

  private parseRequest(text: string): FiddlerSession['request'] {
    const lines = text.split('\r\n');
    const [method, url] = lines[0].split(' ');
    const headers: Record<string, string> = {};
    
    let i = 1;
    for (; i < lines.length; i++) {
      if (lines[i] === '') break;
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx > 0) {
        const key = lines[i].substring(0, colonIdx).trim();
        const value = lines[i].substring(colonIdx + 1).trim();
        headers[key] = value;
      }
    }

    const body = lines.slice(i + 1).join('\r\n');

    return { method, url, headers, body: body || undefined };
  }

  private parseResponse(data: Uint8Array): FiddlerSession['response'] {
    const textDecoder = new TextDecoder('utf-8');
    const text = textDecoder.decode(data);
    const lines = text.split('\r\n');
    
    const statusLine = lines[0].match(/HTTP\/[\d.]+ (\d+) (.+)/);
    const status = statusLine ? parseInt(statusLine[1], 10) : 0;
    const statusText = statusLine ? statusLine[2] : '';
    
    const headers: Record<string, string> = {};
    let i = 1;
    for (; i < lines.length; i++) {
      if (lines[i] === '') break;
      const colonIdx = lines[i].indexOf(':');
      if (colonIdx > 0) {
        const key = lines[i].substring(0, colonIdx).trim();
        const value = lines[i].substring(colonIdx + 1).trim();
        headers[key] = value;
      }
    }

    // Find body start position in bytes
    const headerText = lines.slice(0, i + 1).join('\r\n') + '\r\n';
    const headerBytes = new TextEncoder().encode(headerText).length;
    const bodyBytes = data.slice(headerBytes);

    // Try to decode as text
    let bodyText: string | undefined;
    const contentType = headers['Content-Type'] || '';
    if (contentType.includes('text') || 
        contentType.includes('json') || 
        contentType.includes('xml') ||
        contentType.includes('javascript')) {
      try {
        bodyText = new TextDecoder('utf-8').decode(bodyBytes);
      } catch {
        // Binary content
      }
    }

    return { 
      status, 
      statusText, 
      headers, 
      body: bodyBytes,
      bodyText 
    };
  }

  private parseMetadata(text: string): FiddlerSession['timers'] {
    const timers: Record<string, string> = {};
    const lines = text.split('\r\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        timers[match[1]] = match[2];
      }
    }
    
    return timers as FiddlerSession['timers'];
  }

  private selectSession(session: FiddlerSession) {
    this.selectedSession = session;
    this.activeTab = 'request';
  }

  private getStatusClass(status: number): string {
    if (status >= 200 && status < 300) return 'status-2xx';
    if (status >= 300 && status < 400) return 'status-3xx';
    if (status >= 400 && status < 500) return 'status-4xx';
    if (status >= 500) return 'status-5xx';
    return '';
  }

  private renderHeaders(headers: Record<string, string>) {
    return html`
      <table class="headers-table">
        <tbody>
          ${Object.entries(headers).map(([key, value]) => html`
            <tr>
              <th>${key}</th>
              <td>${value}</td>
            </tr>
          `)}
        </tbody>
      </table>
    `;
  }

  private renderSessionDetail() {
    if (!this.selectedSession) return null;

    const { request, response, timers } = this.selectedSession;

    return html`
      <div class="session-detail">
        <div class="detail-tabs">
          <button 
            class="detail-tab ${this.activeTab === 'request' ? 'active' : ''}"
            @click=${() => this.activeTab = 'request'}
          >
            ${t('request', 'Request')}
          </button>
          <button 
            class="detail-tab ${this.activeTab === 'response' ? 'active' : ''}"
            @click=${() => this.activeTab = 'response'}
          >
            ${t('response', 'Response')}
          </button>
          ${timers ? html`
            <button 
              class="detail-tab ${this.activeTab === 'timers' ? 'active' : ''}"
              @click=${() => this.activeTab = 'timers'}
            >
              ${t('timers', 'Timers')}
            </button>
          ` : null}
        </div>
        <div class="detail-content">
          ${this.activeTab === 'request' ? html`
            <h4>${request.method} ${request.url}</h4>
            ${this.renderHeaders(request.headers)}
            ${request.body ? html`
              <h4 style="margin-top: 1rem;">${t('body', 'Body')}</h4>
              <div class="body-content">${request.body}</div>
            ` : null}
          ` : null}
          ${this.activeTab === 'response' ? html`
            <h4>${response.status} ${response.statusText}</h4>
            ${this.renderHeaders(response.headers)}
            ${response.bodyText ? html`
              <h4 style="margin-top: 1rem;">${t('body', 'Body')}</h4>
              <div class="body-content">${response.bodyText}</div>
            ` : null}
          ` : null}
          ${this.activeTab === 'timers' && timers ? html`
            ${this.renderHeaders(timers as Record<string, string>)}
          ` : null}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<loading-spinner></loading-spinner>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (this.sessions.length === 0) {
      return html`<div class="loading">${t('no-sessions', 'No HTTP sessions found')}</div>`;
    }

    return html`
      <div class="fiddler-viewer">
        <div class="stats">
          ${this.sessions.length} ${t('sessions', 'sessions')}
        </div>
        <div class="sessions-list">
          <div class="session-header">
            <span>#</span>
            <span>${t('method', 'Method')}</span>
            <span>${t('url', 'URL')}</span>
            <span>${t('status', 'Status')}</span>
          </div>
          ${this.sessions.map(session => html`
            <div 
              class="session-row ${this.selectedSession?.id === session.id ? 'selected' : ''}"
              @click=${() => this.selectSession(session)}
            >
              <span class="session-id">${session.id}</span>
              <span class="session-method ${session.request.method.toLowerCase()}">${session.request.method}</span>
              <span class="session-url" title=${session.request.url}>${session.request.url}</span>
              <span class="session-status ${this.getStatusClass(session.response.status)}">${session.response.status}</span>
            </div>
          `)}
        </div>
        ${this.renderSessionDetail()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'fiddler-viewer': FiddlerViewer;
  }
}
