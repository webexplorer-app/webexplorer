import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface ClipboardFormat {
  type: string;
  label: string;
  data: string;
  viewer: 'text' | 'html' | 'image' | 'rtf' | 'json';
}

interface ClipboardData {
  formats: ClipboardFormat[];
  images: { type: string; data: string }[]; // base64 encoded
}

@customElement('clipboard-viewer')
export class ClipboardViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .clipboard-viewer {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .formats-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--border, #ddd);
      overflow-x: auto;
    }

    .format-tab {
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--text-muted, #666);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      white-space: nowrap;
    }

    .format-tab:hover {
      color: var(--text, #333);
      background: var(--surface-hover, #f3f4f6);
    }

    .format-tab.active {
      color: var(--primary, #0066CC);
      border-bottom-color: var(--primary, #0066CC);
    }

    .format-content {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      overflow: hidden;
    }

    .text-content {
      padding: 1rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-all;
      background: var(--surface-alt, #f5f5f5);
      color: var(--text, #333);
    }

    .html-content {
      padding: 1rem;
      background: white;
      color: #333;
    }

    .html-source {
      margin-top: 1rem;
    }

    .html-source-header {
      padding: 0.5rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      font-size: 0.75rem;
      color: var(--text-muted, #666);
      font-weight: 500;
    }

    .image-content {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
      background: var(--surface-alt, #f5f5f5);
    }

    .image-content img {
      max-width: 100%;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }

    .json-content {
      padding: 1rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
      white-space: pre-wrap;
      background: var(--surface-alt, #f5f5f5);
      color: var(--text, #333);
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted, #666);
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: var(--error, #dc2626);
    }

    .stats {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private clipboardData: ClipboardData | null = null;

  @state()
  private activeFormat: string | null = null;

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadClipboardData();
    }
  }

  private async loadClipboardData() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.clipboardData = JSON.parse(text) as ClipboardData;
      
      // Set active format to first available
      if (this.clipboardData.formats.length > 0) {
        this.activeFormat = this.clipboardData.formats[0].type;
      } else if (this.clipboardData.images.length > 0) {
        this.activeFormat = this.clipboardData.images[0].type;
      }
    } catch (e) {
      this.error = t('failed-to-parse-clipboard', 'Failed to parse clipboard data');
      console.error('Failed to parse clipboard data:', e);
    } finally {
      this.loading = false;
    }
  }

  private getFormatLabel(type: string): string {
    const labels: Record<string, string> = {
      'text/plain': 'Plain Text',
      'text/html': 'HTML',
      'text/rtf': 'RTF',
      'application/rtf': 'RTF',
      'application/json': 'JSON',
      'text/uri-list': 'URL List',
      'image/png': 'PNG Image',
      'image/jpeg': 'JPEG Image',
      'image/gif': 'GIF Image',
      'image/webp': 'WebP Image',
      'image/bmp': 'BMP Image',
    };
    return labels[type] || type;
  }

  private renderFormatContent(format: ClipboardFormat) {
    switch (format.viewer) {
      case 'text':
        return html`<div class="text-content">${format.data}</div>`;
      
      case 'html':
        return html`
          <div class="html-content">${unsafeHTML(format.data)}</div>
          <div class="html-source">
            <div class="html-source-header">${t('html-source', 'HTML Source')}</div>
            <div class="text-content">${format.data}</div>
          </div>
        `;
      
      case 'json':
        try {
          const formatted = JSON.stringify(JSON.parse(format.data), null, 2);
          return html`<div class="json-content">${formatted}</div>`;
        } catch {
          return html`<div class="text-content">${format.data}</div>`;
        }
      
      case 'rtf':
        return html`<div class="text-content">${format.data}</div>`;
      
      default:
        return html`<div class="text-content">${format.data}</div>`;
    }
  }

  private renderImageContent(image: { type: string; data: string }) {
    return html`
      <div class="image-content">
        <img src="data:${image.type};base64,${image.data}" alt="Clipboard image" />
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.clipboardData) {
      return html`<div class="loading">${t('no-data', 'No data')}</div>`;
    }

    const { formats, images } = this.clipboardData;
    const allFormats = [
      ...formats.map(f => ({ type: f.type, isImage: false })),
      ...images.map(i => ({ type: i.type, isImage: true })),
    ];

    const activeTextFormat = formats.find(f => f.type === this.activeFormat);
    const activeImageFormat = images.find(i => i.type === this.activeFormat);

    return html`
      <div class="clipboard-viewer">
        <div class="stats">
          ${allFormats.length} ${t('formats-available', 'format(s) available')}
        </div>
        
        <div class="formats-tabs">
          ${allFormats.map(f => html`
            <button 
              class="format-tab ${f.type === this.activeFormat ? 'active' : ''}"
              @click=${() => this.activeFormat = f.type}
            >
              ${this.getFormatLabel(f.type)}
            </button>
          `)}
        </div>

        <div class="format-content">
          ${activeTextFormat 
            ? this.renderFormatContent(activeTextFormat)
            : activeImageFormat
              ? this.renderImageContent(activeImageFormat)
              : nothing
          }
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'clipboard-viewer': ClipboardViewer;
  }
}
