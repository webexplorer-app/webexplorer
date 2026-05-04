import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { EMFJS, RTFJS, WMFJS } from 'rtf.js';
import { t } from '../../common/Localization';

// Disable logging for rtf.js libraries
RTFJS.loggingEnabled(false);
WMFJS.loggingEnabled(false);
EMFJS.loggingEnabled(false);

@customElement('rtf-viewer')
export class RtfViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .rtf-viewer {
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
    }

    .rtf-container {
      background: white;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      overflow-x: auto;
      color: #000;
    }
    .rtf-container img {
      max-width: 100%;
    }
    .rtf-container table {
      border-collapse: collapse;
    }
    .rtf-container td, .rtf-container th {
      border: 1px solid #ccc;
      padding: 0.25rem 0.5rem;
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
  private sourceText = '';

  @state()
  private showSource = false;

  private renderedElements: HTMLElement[] = [];

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadRtf();
    }
    if (changedProperties.has('showSource') && !this.showSource && !this.loading && !this.error) {
      this.appendRenderedContent();
    }
  }

  private async appendRenderedContent() {
    await this.updateComplete;
    const container = this.shadowRoot?.querySelector('.rtf-content');
    if (container) {
      container.innerHTML = '';
      this.renderedElements.forEach(el => container.appendChild(el.cloneNode(true)));
    }
  }

  private async loadRtf() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      
      // Store source text for text view
      const decoder = new TextDecoder('latin1');
      this.sourceText = decoder.decode(arrayBuffer);

      const doc = new RTFJS.Document(arrayBuffer, {});
      const elements = await doc.render();
      this.renderedElements = elements as HTMLElement[];
      
      this.loading = false;
      
      // After render, append elements to container
      await this.updateComplete;
      const container = this.shadowRoot?.querySelector('.rtf-content');
      if (container) {
        container.innerHTML = '';
        elements.forEach(el => container.appendChild(el));
      }
    } catch (e) {
      console.error('Failed to load RTF document:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  render() {
    if (!this.file) {
      return html`<div class="rtf-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="rtf-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="rtf-viewer"><div class="error">${this.error}</div></div>`;
    }

    return html`
      <div class="rtf-viewer">
        <div class="toolbar">
          <button class=${!this.showSource ? 'active' : ''} @click=${() => this.showSource = false}>
            ${t('preview', 'Preview')}
          </button>
          <button class=${this.showSource ? 'active' : ''} @click=${() => this.showSource = true}>
            ${t('text', 'Text')}
          </button>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : html`
            <div class="rtf-container">
              <div class="rtf-content"></div>
            </div>
          `
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rtf-viewer': RtfViewer;
  }
}
