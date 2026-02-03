import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { renderAsync } from 'docx-preview';

@customElement('word-viewer')
export class WordViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .word-viewer {
      margin: 1rem;
    }
    .word-container {
      background: white;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      overflow: auto;
      max-height: calc(100vh - 8rem);
    }
    /* Override docx-preview styles for better appearance */
    .word-container :global(.docx-wrapper) {
      background: white !important;
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

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDocument();
    }
  }

  private async loadDocument() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      
      // Wait for render to complete
      await this.updateComplete;
      
      const container = this.shadowRoot?.querySelector('.word-container') as HTMLDivElement;
      if (container) {
        await renderAsync(arrayBuffer, container, undefined, {
          className: 'docx-content',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        });
      }
      
      this.loading = false;
    } catch (e) {
      console.error('Failed to load Word document:', e);
      this.error = `Failed to load document: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  render() {
    if (!this.file) {
      return html`<div class="word-viewer">No file selected</div>`;
    }

    return html`
      <div class="word-viewer">
        ${this.loading ? html`<div class="loading">Loading document...</div>` : null}
        ${this.error ? html`<div class="error">${this.error}</div>` : null}
        <div class="word-container" style="${this.loading ? 'display: none;' : ''}"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'word-viewer': WordViewer;
  }
}
