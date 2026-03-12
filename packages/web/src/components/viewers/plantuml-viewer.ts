import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('plantuml-viewer')
export class PlantUmlViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
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

    .diagram-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      overflow: auto;
      background: white;
      min-height: 300px;
    }

    .diagram-container img {
      max-width: 100%;
      height: auto;
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
      margin: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
    }

    .hidden {
      display: none;
    }

    .note {
      font-size: 0.75rem;
      color: var(--text-muted, #999);
      padding: 0.5rem 1rem;
      text-align: center;
      background: var(--surface-alt, #f9f9f9);
      border-top: 1px solid var(--border, #eee);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private svgUrl = '';

  @state()
  private sourceText = '';

  @state()
  private showSource = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDiagram();
    }
  }

  private async loadDiagram() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;

      // Use PlantUML's text encoding for the public server
      const encoded = this.encodePlantUml(text);
      this.svgUrl = `https://www.plantuml.com/plantuml/svg/${encoded}`;
      this.loading = false;
    } catch (e) {
      console.error('Failed to process PlantUML:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  /**
   * Encode PlantUML text for the public rendering API.
   * Uses the deflate + custom base64 encoding that PlantUML expects.
   */
  private encodePlantUml(text: string): string {
    // Use the hex encoding approach (simpler, no deflate needed)
    // PlantUML supports ~h prefix for hex-encoded diagrams
    const hex = Array.from(new TextEncoder().encode(text))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return '~h' + hex;
  }

  render() {
    if (!this.file) {
      return html`<div>${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">${this.error}</div>
        ${this.sourceText ? html`<div class="source-container">${this.sourceText}</div>` : ''}
      `;
    }

    return html`
      <div>
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
          : ''}
        <div class="diagram-container ${this.showSource ? 'hidden' : ''}">
          <img src=${this.svgUrl} alt="PlantUML Diagram" @error=${this.handleImageError} />
        </div>
        <div class="note ${this.showSource ? 'hidden' : ''}">Rendered via plantuml.com — requires internet connection</div>
      </div>
    `;
  }

  private handleImageError() {
    this.error = 'Failed to render diagram. Check internet connection or PlantUML syntax.';
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'plantuml-viewer': PlantUmlViewer;
  }
}
