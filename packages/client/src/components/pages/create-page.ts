import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import { LocalizedLitElement } from '../localized-element';
import {
  getDocumentService,
  generateRequestId,
  type DocumentService,
  type DocumentGenerationSession,
  type AIProvider,
  type DocumentRequest,
  type ProgressMessage,
  type ErrorMessage,
  type CompleteMessage,
} from '../../common/document-service';
import type { Document, DocumentMode } from '@webexplorer/document';

type CreationState = 'initializing' | 'input' | 'creating' | 'preview' | 'complete' | 'error';

interface AIModelOption {
  provider: AIProvider;
  model: string;
  label: string;
}

const AI_MODELS: AIModelOption[] = [
  { provider: 'openai', model: 'gpt-4', label: 'GPT-4 (OpenAI)' },
  { provider: 'openai', model: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
  { provider: 'openai', model: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (OpenAI)' },
  { provider: 'anthropic', model: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Anthropic)' },
  { provider: 'anthropic', model: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet (Anthropic)' },
  { provider: 'ollama', model: 'llama2', label: 'Llama 2 (Local)' },
  { provider: 'ollama', model: 'mistral', label: 'Mistral (Local)' },
];

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
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .form-row .form-group {
      flex: 1;
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
    .progress-parts {
      color: var(--text-muted, #666);
      font-size: 0.75rem;
      margin-top: 0.25rem;
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
      margin: 0;
    }
    pre.preview-content {
      border: 1px solid var(--border, #ddd);
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
    .complete-info {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
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
  private selectedModel: AIModelOption = AI_MODELS[0];

  @state()
  private documentMode: 'structure' | 'content' = 'content';

  @state()
  private prompt = '';



  @state()
  private progress = 0;

  @state()
  private progressMessage = '';

  @state()
  private partsReceived = 0;

  @state()
  private generatedDocument: Document<DocumentMode> | null = null;

  @state()
  private previewContent = '';

  @state()
  private errorMessage = '';

  @state()
  private wsConnected = false;

  private documentService: DocumentService | null = null;
  private currentSession: DocumentGenerationSession | null = null;
  private unsubscribeConnection: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initDocumentService();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribeConnection) {
      this.unsubscribeConnection();
    }
    if (this.currentSession) {
      this.documentService?.cancelGeneration(this.currentSession.requestId);
    }
  }

  private async initDocumentService() {
    this.documentService = getDocumentService();
    
    this.unsubscribeConnection = this.documentService.onConnectionChange((connected) => {
      this.wsConnected = connected;
    });

    try {
      await this.documentService.connect();
      this.creationState = 'input';
    } catch (error) {
      console.error('Failed to connect to document server:', error);
      this.creationState = 'error';
      this.errorMessage = t('connection-failed', 'Failed to connect to server');
    }
  }

  private handleBackClick() {
    this.dispatchEvent(new CustomEvent('back-to-home', {
      bubbles: true,
      composed: true
    }));
  }

  private handleModelChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const index = parseInt(select.value, 10);
    this.selectedModel = AI_MODELS[index];
  }

  private handleModeChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.documentMode = select.value as 'structure' | 'content';
  }

  private handlePromptChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this.prompt = textarea.value;
  }



  private handleSubmit() {
    if (!this.documentService || !this.prompt.trim()) return;
    
    this.creationState = 'creating';
    this.progress = 0;
    this.partsReceived = 0;
    this.progressMessage = t('starting-creation', 'Starting document generation...');
    
    const request: DocumentRequest = {
      requestId: generateRequestId(),
      prompt: this.prompt,
      aiConfig: {
        provider: this.selectedModel.provider,
        model: this.selectedModel.model,
      },
      mode: this.documentMode,
    };

    this.currentSession = this.documentService.generateDocument(request, {
      onProgress: (msg: ProgressMessage) => {
        this.partsReceived = msg.partsGenerated;
        this.progressMessage = msg.status;
        // Estimate progress (cap at 90% until complete)
        this.progress = Math.min(90, msg.partsGenerated * 10);
      },
      onPart: (_msg, partIndex) => {
        this.partsReceived = partIndex + 1;
        this.progressMessage = t('receiving-parts', `Receiving document parts (${this.partsReceived})...`);
      },
      onError: (msg: ErrorMessage) => {
        this.creationState = 'error';
        this.errorMessage = msg.message;
      },
      onComplete: (_msg: CompleteMessage, document) => {
        this.progress = 100;
        this.generatedDocument = document;
        
        if (document) {
          this.previewContent = this.formatDocumentPreview(document);
          this.creationState = 'complete';
        } else {
          this.creationState = 'error';
          this.errorMessage = t('generation-failed', 'Failed to generate document');
        }
      },
    });
  }

  private formatDocumentPreview(doc: Document<DocumentMode>): string {
    const lines: string[] = [];
    lines.push(`Document: ${doc.metadata?.title || doc.id}`);
    lines.push(`Mode: ${doc.mode}`);
    lines.push(`Pages: ${doc.pages.length}`);
    lines.push('');
    
    for (const page of doc.pages) {
      lines.push(`  Page ${page.index}: ${page.title || page.id}`);
      for (const section of page.sections) {
        lines.push(`    Section ${section.index}`);
        for (const row of section.rows) {
          for (const column of row.columns) {
            for (const cell of column.cells) {
              if (doc.mode === 'content') {
                const contentCell = cell as any;
                if (contentCell.content) {
                  const preview = String(contentCell.content.data).slice(0, 100);
                  lines.push(`      Cell: [${contentCell.content.mimeType}] ${preview}...`);
                }
              } else {
                const structCell = cell as any;
                if (structCell.preview) {
                  lines.push(`      Cell: [${structCell.preview.expectedMimeType}] ${structCell.preview.title}`);
                }
              }
            }
          }
        }
      }
    }
    
    return lines.join('\n');
  }

  private handleCancel() {
    if (this.currentSession && this.documentService) {
      this.documentService.cancelGeneration(this.currentSession.requestId);
      this.currentSession = null;
      this.creationState = 'input';
    }
  }

  private handleDownload() {
    if (!this.generatedDocument) return;

    // Serialize document to JSON
    const json = JSON.stringify(this.generatedDocument, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.generatedDocument.id || 'document'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private handleStartOver() {
    this.creationState = 'input';
    this.prompt = '';
    this.progress = 0;
    this.partsReceived = 0;
    this.progressMessage = '';
    this.previewContent = '';
    this.generatedDocument = null;
    this.errorMessage = '';
    this.currentSession = null;
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
    const selectedIndex = AI_MODELS.indexOf(this.selectedModel);
    return html`
      <div class="create-form">
        <div class="form-row">
          <div class="form-group">
            <label for="ai-model">${t('ai-model', 'AI Model')}</label>
            <select
              id="ai-model"
              .value=${String(selectedIndex)}
              @change=${this.handleModelChange}
            >
              ${AI_MODELS.map((model, index) => html`
                <option value=${index}>
                  ${model.label}
                </option>
              `)}
            </select>
          </div>
          
          <div class="form-group">
            <label for="doc-mode">${t('document-mode', 'Document Mode')}</label>
            <select
              id="doc-mode"
              .value=${this.documentMode}
              @change=${this.handleModeChange}
            >
              <option value="structure">${t('mode-structure', 'Structure (placeholders)')}</option>
              <option value="content">${t('mode-content', 'Content (full data)')}</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="prompt">${t('describe-document', 'Describe Your Document')}</label>
          <textarea
            id="prompt"
            .value=${this.prompt}
            @input=${this.handlePromptChange}
            placeholder=${t('prompt-placeholder', 'Describe what should be included in the document, the layout/structure, or any specific requirements...')}
          ></textarea>
          <p class="form-hint">
            ${t('prompt-hint', 'Be as specific as possible about the content, structure, and formatting you want.')}
          </p>
        </div>

        <div class="form-actions">
          <button
            class="btn btn-primary"
            @click=${this.handleSubmit}
            ?disabled=${!this.prompt.trim() || !this.wsConnected}
          >
            ${t('create-document', 'Create Document')}
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
        <p class="progress-parts">${t('parts-received', `Parts received: ${this.partsReceived}`)}</p>
        <button class="btn btn-secondary" @click=${this.handleCancel}>
          ${t('cancel', 'Cancel')}
        </button>
      </div>
    `;
  }

  private renderPreviewState() {
    return html`
      <div class="preview-container">
        <div class="preview-header">
          <h3>${t('document-preview', 'Document Preview')}</h3>
        </div>
        <pre class="preview-content">${this.previewContent}</pre>
        
        <div class="preview-actions">
          <button class="btn btn-secondary" @click=${this.handleStartOver}>
            ${t('start-over', 'Start Over')}
          </button>
          <button class="btn btn-primary" @click=${this.handleDownload}>
            ${t('download', 'Download')}
          </button>
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
          ${t('document-created', 'Your document has been created!')}
        </p>
        ${this.generatedDocument ? html`
          <p class="complete-info">
            ${t('document-info', `Mode: ${this.generatedDocument.mode} | Pages: ${this.generatedDocument.pages.length}`)}
          </p>
        ` : ''}
        
        <pre class="preview-content">${this.previewContent}</pre>
        
        <div class="complete-actions">
          <button class="btn btn-secondary" @click=${this.handleStartOver}>
            ${t('create-another', 'Create Another')}
          </button>
          <button class="btn btn-primary" @click=${this.handleDownload}>
            ${t('download-json', 'Download JSON')}
          </button>
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
            <page-title slot="center" title=${t('create-document', 'Create Document')}></page-title>
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
