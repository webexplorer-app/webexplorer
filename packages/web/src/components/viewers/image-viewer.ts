import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';

@customElement('image-viewer')
export class ImageViewer extends LitElement {
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

    .image-viewer {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    img {
      max-width: 100%;
      object-fit: contain;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private imageUrl = '';

  @state()
  private sourceText = '';

  @state()
  private showSource = false;

  @state()
  private isSvg = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
      }
      this.imageUrl = URL.createObjectURL(this.file);
      this.isSvg = this.file.type === 'image/svg+xml' || this.file.name.endsWith('.svg');
      if (this.isSvg) {
        this.file.text().then(text => { this.sourceText = text; });
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }

  render() {
    if (!this.file) return html``;

    return html`
      ${this.isSvg ? html`
        <div class="toolbar">
          <button class=${!this.showSource ? 'active' : ''} @click=${() => this.showSource = false}>
            ${t('preview', 'Preview')}
          </button>
          <button class=${this.showSource ? 'active' : ''} @click=${() => this.showSource = true}>
            ${t('text', 'Text')}
          </button>
        </div>
      ` : ''}
      ${this.showSource && this.isSvg
        ? html`<div class="source-container">${this.sourceText}</div>`
        : html`
          <div class="image-viewer">
            <img alt=${this.file.name} src=${this.imageUrl} />
          </div>
        `
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'image-viewer': ImageViewer;
  }
}
