import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t, getCurrentLocale } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import { LocalizedLitElement } from '../localized-element';
import {
  getWebSocketService,
  type ServerMessage,
  type WebSocketService,
  type FileTypeInfo
} from '../../common/websocket-service';

type CreationState = 'initializing' | 'input' | 'creating' | 'preview' | 'complete' | 'error';

@customElement('create-page')
export class CreatePage extends LocalizedLitElement {
  static styles = css`
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      background: var(--surface, white);
      color: var(--primary, #333);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .back-button:hover {
      background-color: var(--surface-hover, #f0f0f0);
    }
    .back-button svg {
      width: 1rem;
      height: 1rem;
      stroke: var(--primary, currentColor);
    }
    .create-container {
      max-width: 800px;
      margin: 0 auto;
    }
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-group label {
      font-weight: 600;
      color: var(--text, #333);
    }
    .form-group select,
    .form-group textarea {
      padding: 0.75rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      background: var(--surface, #fff);
      color: var(--text, #333);
      font-size: 1rem;
      font-family: inherit;
    }
    .form-group select:focus,
    .form-group textarea:focus {
      outline: 2px solid var(--accent, #0066cc);
      outline-offset: -1px;
    }
    .form-group textarea {
      min-height: 150px;
      resize: vertical;
    }
    .form-hint {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }
    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
    }
    .btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }
    .btn-primary {
      background: var(--accent, #0066cc);
      color: var(--text-inverse, #fff);
      border-color: var(--accent, #0066cc);
    }
    .btn-primary:hover:not(:disabled) {
      background: var(--accent-hover, #0052a3);
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-secondary {
      background: var(--surface, #fff);
      color: var(--text, #333);
    }
    .btn-secondary:hover {
      background: var(--surface-hover, #f0f0f0);
    }
    .progress-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
    }
    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: var(--surface, #f0f0f0);
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background: var(--accent, #0066cc);
      transition: width 0.3s ease;
    }
    .progress-message {
      color: var(--text-muted, #666);
      font-size: 0.875rem;
    }
    .preview-container {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .preview-header h3 {
      margin: 0;
      color: var(--text, #333);
    }
    .preview-content {
      padding: 1rem;
      background: var(--code-background, #f4f4f4);
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-wrap: break-word;
      max-height: 400px;
      overflow-y: auto;
      color: var(--code-text, #333);
    }
    .preview-actions {
      display: flex;
      gap: 1rem;
    }
    .complete-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 2rem;
      text-align: center;
    }
    .complete-icon {
      width: 64px;
      height: 64px;
      color: var(--success, #28a745);
    }
    .complete-message {
      font-size: 1.25rem;
      color: var(--text, #333);
    }
    .complete-filename {
      font-weight: 600;
      color: var(--accent, #0066cc);
    }
    .complete-actions {
      display: flex;
      gap: 1rem;
    }
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }
    .error-icon {
      width: 64px;
      height: 64px;
      color: var(--error, #dc3545);
    }
    .error-message {
      color: var(--error, #dc3545);
    }
    .connection-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-size: 0.875rem;
    }
    .connection-status.connected {
      background: var(--success-light, #d4edda);
      color: var(--success, #28a745);
    }
    .connection-status.disconnected {
      background: var(--error-light, #f8d7da);
      color: var(--error, #dc3545);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .status-dot.connected {
      background: var(--success, #28a745);
    }
    .status-dot.disconnected {
      background: var(--error, #dc3545);
    }
    .customize-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border, #ddd);
    }
    .customize-section h4 {
      margin: 0 0 1rem 0;
      color: var(--text, #333);
    }
    .initializing-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
    }
    .initializing-message {
      color: var(--text-muted, #666);
    }
  `;

  @state()
  private creationState: CreationState = 'initializing';

  @state()
  private fileTypes: FileTypeInfo[] = [];

  @state()
  private selectedFileType = '';

  @state()
  private prompt = '';

  @state()
  private customizePrompt = '';

  @state()
  private progress = 0;

  @state()
  private progressMessage = '';

  @state()
  private previewContent = '';

  @state()
  private fileName = '';

  @state()
  private fileData = '';

  @state()
  private fileMimeType = '';

  @state()
  private errorMessage = '';

  @state()
  private wsConnected = false;

  private wsService: WebSocketService | null = null;
  private unsubscribeMessage: (() => void) | null = null;
  private unsubscribeConnection: (() => void) | null = null;
  private sessionInitialized = false;

  connectedCallback() {
    super.connectedCallback();
    this.initWebSocket();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeMessage) {
      this.unsubscribeMessage();
    }
    if (this.unsubscribeConnection) {
      this.unsubscribeConnection();
    }
  }

  private async initWebSocket() {
    this.wsService = getWebSocketService();
    
    this.unsubscribeConnection = this.wsService.onConnectionChange((connected) => {
      this.wsConnected = connected;
      if (connected && !this.sessionInitialized) {
        // Send metadata when connected
        const locale = getCurrentLocale();
        this.wsService?.sendInit(locale);
      }
    });

    this.unsubscribeMessage = this.wsService.onMessage((message) => {
      this.handleServerMessage(message);
    });

    try {
      await this.wsService.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.creationState = 'error';
      this.errorMessage = t('connection-failed', 'Failed to connect to server');
    }
  }

  private handleServerMessage(message: ServerMessage) {
    switch (message.type) {
      case 'init-success':
        // Server acknowledged our metadata, now request file types
        this.sessionInitialized = true;
        this.wsService?.getFileTypes();
        break;
      case 'file-types':
        // Server sent supported file types
        this.fileTypes = message.data.fileTypes;
        if (this.fileTypes.length > 0) {
          this.selectedFileType = this.fileTypes[0].value;
        }
        this.creationState = 'input';
        break;
      case 'progress':
        this.creationState = 'creating';
        this.progress = message.data.percent;
        this.progressMessage = message.data.message;
        break;
      case 'preview':
        this.creationState = 'preview';
        this.previewContent = message.data.content;
        break;
      case 'complete':
        this.creationState = 'complete';
        this.fileName = message.data.fileName;
        this.fileData = message.data.fileData;
        this.fileMimeType = message.data.mimeType;
        break;
      case 'error':
        this.creationState = 'error';
        this.errorMessage = message.data.message;
        break;
    }
  }

  private handleBackClick() {
    this.dispatchEvent(new CustomEvent('back-to-home', {
      bubbles: true,
      composed: true
    }));
  }

  private handleFileTypeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedFileType = select.value;
  }

  private handlePromptChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.prompt = textarea.value;
  }

  private handleCustomizePromptChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.customizePrompt = textarea.value;
  }

  private handleSubmit() {
    if (!this.wsService || !this.prompt.trim()) return;
    
    this.creationState = 'creating';
    this.progress = 0;
    this.progressMessage = t('starting-creation', 'Starting file creation...');
    
    this.wsService.createFile(this.selectedFileType, this.prompt);
  }

  private handleCustomize() {
    if (!this.wsService || !this.customizePrompt.trim()) return;
    
    this.creationState = 'creating';
    this.progress = 0;
    this.progressMessage = t('customizing-file', 'Customizing file...');
    
    this.wsService.customize(this.customizePrompt);
  }

  private handleDownload() {
    if (!this.fileData || !this.fileName) return;

    // Decode base64 and create blob
    const binaryString = atob(this.fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: this.fileMimeType });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private handleStartOver() {
    this.creationState = 'input';
    this.prompt = '';
    this.customizePrompt = '';
    this.progress = 0;
    this.progressMessage = '';
    this.previewContent = '';
    this.fileName = '';
    this.fileData = '';
    this.errorMessage = '';
  }

  private renderInitializingState() {
    return html`
      <div class="initializing-container">
        <loading-spinner></loading-spinner>
        <p class="initializing-message">${t('initializing', 'Connecting to server...')}</p>
      </div>
    `;
  }

  private renderInputState() {
    return html`
      <div class="create-form">
        <div class="form-group">
          <label for="file-type">${t('file-type', 'File Type')}</label>
          <select
            id="file-type"
            .value=${this.selectedFileType}
            @change=${this.handleFileTypeChange}
          >
            ${this.fileTypes.map(type => html`
              <option value=${type.value}>
                ${type.label} (${type.extension})
              </option>
            `)}
          </select>
        </div>
        
        <div class="form-group">
          <label for="prompt">${t('describe-file', 'Describe Your File')}</label>
          <textarea
            id="prompt"
            .value=${this.prompt}
            @input=${this.handlePromptChange}
            placeholder=${t('prompt-placeholder', 'Describe what should be included in the file, the layout/structure, or any specific requirements...')}
          ></textarea>
          <p class="form-hint">
            ${t('prompt-hint', 'Be as specific as possible about the content, structure, and formatting you want.')}
          </p>
        </div>

        <div class="form-actions">
          <button
            class="btn btn-primary"
            @click=${this.handleSubmit}
            ?disabled=${!this.prompt.trim() || !this.wsConnected || this.fileTypes.length === 0}
          >
            ${t('create-file', 'Create File')}
          </button>
        </div>
      </div>
    `;
  }

  private renderCreatingState() {
    return html`
      <div class="progress-container">
        <loading-spinner></loading-spinner>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${this.progress}%"></div>
        </div>
        <p class="progress-message">${this.progressMessage}</p>
      </div>
    `;
  }

  private renderPreviewState() {
    return html`
      <div class="preview-container">
        <div class="preview-header">
          <h3>${t('preview', 'Preview')}</h3>
        </div>
        <div class="preview-content">${this.previewContent}</div>
        
        <div class="customize-section">
          <h4>${t('customize', 'Customize')}</h4>
          <div class="form-group">
            <textarea
              .value=${this.customizePrompt}
              @input=${this.handleCustomizePromptChange}
              placeholder=${t('customize-placeholder', 'Enter additional instructions to modify the file...')}
            ></textarea>
          </div>
          <div class="preview-actions">
            <button class="btn btn-secondary" @click=${this.handleStartOver}>
              ${t('start-over', 'Start Over')}
            </button>
            <button
              class="btn btn-secondary"
              @click=${this.handleCustomize}
              ?disabled=${!this.customizePrompt.trim() || !this.wsConnected}
            >
              ${t('apply-changes', 'Apply Changes')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderCompleteState() {
    return html`
      <div class="complete-container">
        <svg class="complete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <p class="complete-message">
          ${t('file-created', 'Your file has been created!')}
        </p>
        <p class="complete-filename">${this.fileName}</p>
        
        <div class="complete-actions">
          <button class="btn btn-secondary" @click=${this.handleStartOver}>
            ${t('create-another', 'Create Another')}
          </button>
          <button class="btn btn-primary" @click=${this.handleDownload}>
            ${t('download', 'Download')}
          </button>
        </div>

        <div class="customize-section">
          <h4>${t('customize-further', 'Want to customize it?')}</h4>
          <div class="form-group">
            <textarea
              .value=${this.customizePrompt}
              @input=${this.handleCustomizePromptChange}
              placeholder=${t('customize-placeholder', 'Enter additional instructions to modify the file...')}
            ></textarea>
          </div>
          <div class="form-actions">
            <button
              class="btn btn-secondary"
              @click=${this.handleCustomize}
              ?disabled=${!this.customizePrompt.trim() || !this.wsConnected}
            >
              ${t('apply-changes', 'Apply Changes')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderErrorState() {
    return html`
      <div class="error-container">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p class="error-message">${this.errorMessage}</p>
        <button class="btn btn-primary" @click=${this.handleStartOver}>
          ${t('try-again', 'Try Again')}
        </button>
      </div>
    `;
  }

  private renderContent() {
    switch (this.creationState) {
      case 'initializing':
        return this.renderInitializingState();
      case 'creating':
        return this.renderCreatingState();
      case 'preview':
        return this.renderPreviewState();
      case 'complete':
        return this.renderCompleteState();
      case 'error':
        return this.renderErrorState();
      default:
        return this.renderInputState();
    }
  }

  render() {
    return html`
      <page-layout className="page--create">
        <page-header>
          <page-toolbar>
            <button slot="left" class="back-button" @click=${this.handleBackClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              ${t('back-to-home', 'Back to Home')}
            </button>
            <page-title slot="center" title=${t('create-new-file', 'Create New File')}></page-title>
            <span slot="right" class="toolbar-actions">
              <span class="connection-status ${this.wsConnected ? 'connected' : 'disconnected'}">
                <span class="status-dot ${this.wsConnected ? 'connected' : 'disconnected'}"></span>
                ${this.wsConnected ? t('connected', 'Connected') : t('disconnected', 'Disconnected')}
              </span>
              <theme-toggle></theme-toggle>
              <locale-selector></locale-selector>
            </span>
          </page-toolbar>
        </page-header>
        <page-content>
          <div class="create-container">
            ${this.renderContent()}
          </div>
        </page-content>
      </page-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-page': CreatePage;
  }
}
