import { html, css } from 'lit';
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
      margin: 1rem;
    }
    .markdown-container {
      background: var(--background, white);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      overflow: auto;
      max-height: calc(100vh - 8rem);
      color: var(--text, #333);
      line-height: 1.6;
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
      this.htmlContent = await marked.parse(text);
      this.loading = false;
    } catch (e) {
      console.error('Failed to parse markdown:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
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
        <div class="markdown-container" .innerHTML=${this.htmlContent}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'markdown-viewer': MarkdownViewer;
  }
}
