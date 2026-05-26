import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { marked } from 'marked';
import { t } from '../../common/Localization';

@customElement('markdown-viewer')
export class MarkdownViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .markdown-viewer {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .toolbar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      position: sticky;
      top: 0;
      z-index: 10;
      align-items: center;
    }

    .toolbar button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      background: var(--background, #fff);
      color: var(--text-primary, #333);
      border-radius: 4px;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar button:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    .toolbar button.active {
      background: var(--primary, #3b82f6);
      color: white;
      border-color: var(--primary, #3b82f6);
    }

    .source-container {
      padding: 1rem;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875rem;
      line-height: 1.6;
      white-space: pre-wrap;
      background: var(--surface-alt, #f5f5f5);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      margin: 1rem;
      overflow: auto;
      flex: 1;
    }

    .preview-dialog-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .preview-dialog {
      background: white;
      border-radius: 8px;
      width: 90vw;
      height: 85vh;
      max-width: 900px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .preview-dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      flex-shrink: 0;
    }

    .preview-dialog-header span {
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
    }

    .preview-dialog-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1.25rem;
      color: #666;
      transition: background 0.15s;
    }

    .preview-dialog-close:hover {
      background: var(--surface-hover, #e0e0e0);
    }

    .preview-dialog .markdown-container {
      flex: 1;
      overflow: auto;
      border: none;
      border-radius: 0;
    }

    .markdown-container {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      color: var(--text, #333);
      line-height: 1.6;
      overflow: auto;
    }

    @media (max-width: 768px) {
      .preview-dialog {
        width: 100vw;
        height: 100vh;
        max-width: none;
        border-radius: 0;
      }

      .preview-dialog-overlay {
        padding: 0;
      }
    }
    
    /* Markdown styling */
    .markdown-container h1 {
      font-size: 2rem;
      border-bottom: 1px solid var(--border, #ddd);
      padding-bottom: 0.5rem;
      margin-top: 0;
    }
    .markdown-container h2 {
      font-size: 1.5rem;
      border-bottom: 1px solid var(--border-light, #eee);
      padding-bottom: 0.3rem;
    }
    .markdown-container h3 { font-size: 1.25rem; }
    .markdown-container h4 { font-size: 1rem; }
    
    .markdown-container code {
      background: var(--surface-alt, #f5f5f5);
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875em;
    }
    
    .markdown-container pre {
      background: var(--surface-alt, #f5f5f5);
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    
    .markdown-container pre code {
      background: none;
      padding: 0;
    }
    
    .markdown-container blockquote {
      border-left: 4px solid var(--primary, #0066CC);
      margin-left: 0;
      padding-left: 1rem;
      color: var(--text-secondary, #666);
    }
    
    .markdown-container table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    
    .markdown-container th,
    .markdown-container td {
      border: 1px solid var(--border, #ddd);
      padding: 0.5rem;
      text-align: left;
    }
    
    .markdown-container th {
      background: var(--surface-alt, #f5f5f5);
    }
    
    .markdown-container img {
      max-width: 100%;
    }
    
    .markdown-container a {
      color: var(--primary, #0066CC);
    }
    
    .markdown-container ul,
    .markdown-container ol {
      padding-left: 2rem;
    }
    
    .markdown-container hr {
      border: none;
      border-top: 1px solid var(--border, #ddd);
      margin: 1.5rem 0;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }
    .error {
      color: var(--error, #dc2626);
      padding: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private htmlContent = '';

  @state()
  private sourceText = '';

  @state()
  private viewMode: 'source' | 'preview' = 'source';

  @state()
  private showPreviewDialog = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadMarkdown();
    }
  }

  private async loadMarkdown() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;
      this.htmlContent = await marked.parse(text);
      this.loading = false;
    } catch (e) {
      console.error('Failed to parse markdown:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private closePreviewOnBackdrop(e: Event) {
    if ((e.target as HTMLElement).classList.contains('preview-dialog-overlay')) {
      this.showPreviewDialog = false;
    }
  }

  render() {
    if (!this.file) {
      return html`<div class="markdown-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="markdown-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="markdown-viewer"><div class="error">${this.error}</div></div>`;
    }

    return html`
      <div class="markdown-viewer">
        <div class="toolbar">
          <button class=${this.viewMode === 'source' ? 'active' : ''} @click=${() => this.viewMode = 'source'}>
            ${t('text', 'Text')}
          </button>
          <button class=${this.viewMode === 'preview' ? 'active' : ''} @click=${() => this.viewMode = 'preview'}>
            ${t('preview', 'Preview')}
          </button>
          <button @click=${() => this.showPreviewDialog = true}>
            ${t('preview-window', 'Preview Window')}
          </button>
        </div>
        ${this.viewMode === 'source'
          ? html`<div class="source-container">${this.sourceText}</div>`
          : html`<div class="markdown-container" .innerHTML=${this.htmlContent}></div>`
        }
      </div>
      ${this.showPreviewDialog
        ? html`
          <div class="preview-dialog-overlay" @click=${this.closePreviewOnBackdrop}>
            <div class="preview-dialog">
              <div class="preview-dialog-header">
                <span>${t('preview', 'Preview')} — ${this.file?.name}</span>
                <button class="preview-dialog-close" @click=${() => this.showPreviewDialog = false}>×</button>
              </div>
              <div class="markdown-container" .innerHTML=${this.htmlContent}></div>
            </div>
          </div>
        `
        : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'markdown-viewer': MarkdownViewer;
  }
}
