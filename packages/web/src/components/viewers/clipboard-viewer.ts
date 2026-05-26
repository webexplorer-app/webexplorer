import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import '../file-viewer';

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
      display: flex;
      align-items: center;
      gap: 0.4rem;
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
      min-height: 200px;
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

  private getExtensionForType(type: string): string {
    const extensions: Record<string, string> = {
      'text/plain': 'txt',
      'text/html': 'html',
      'text/rtf': 'rtf',
      'application/rtf': 'rtf',
      'application/json': 'json',
      'text/uri-list': 'txt',
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
    };
    return extensions[type] || 'bin';
  }

  private getActiveFile(): File | null {
    if (!this.clipboardData || !this.activeFormat) return null;

    const { formats, images } = this.clipboardData;
    const textFormat = formats.find(f => f.type === this.activeFormat);
    if (textFormat) {
      const ext = this.getExtensionForType(textFormat.type);
      return new File([textFormat.data], `clipboard.${ext}`, { type: textFormat.type });
    }

    const imageFormat = images.find(i => i.type === this.activeFormat);
    if (imageFormat) {
      const binary = atob(imageFormat.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const ext = this.getExtensionForType(imageFormat.type);
      return new File([bytes], `clipboard.${ext}`, { type: imageFormat.type });
    }

    return null;
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

    const activeFile = this.getActiveFile();

    return html`
      <div class="clipboard-viewer">
        <div class="formats-tabs">
          ${allFormats.map(f => html`
            <button 
              class="format-tab ${f.type === this.activeFormat ? 'active' : ''}"
              @click=${() => { this.activeFormat = f.type; }}
            >
              ${this.getFormatLabel(f.type)}
            </button>
          `)}
        </div>

        <div class="format-content">
          ${activeFile
            ? html`<file-viewer .file=${activeFile}></file-viewer>`
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
