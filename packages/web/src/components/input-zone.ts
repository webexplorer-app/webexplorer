import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../common/Localization';
import { LocalizedLitElement } from './localized-element';

interface ClipboardFormat {
  type: string;
  label: string;
  data: string;
  viewer: 'text' | 'html' | 'rtf' | 'json';
}

interface ClipboardFileData {
  formats: ClipboardFormat[];
  images: { type: string; data: string }[];
}

@customElement('input-zone')
export class InputZone extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .input-zone {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
    }

    .privacy-notice {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text, #333);
      text-align: center;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .privacy-notice svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .input-area {
      width: min(60rem, 100%);
      min-height: 180px;
      border: 2px dashed var(--border, #ccc);
      border-radius: var(--radius-3, 8px);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: border-color 0.2s, background-color 0.2s;
      cursor: pointer;
      outline: none;
    }

    .input-area:hover,
    .input-area:focus {
      border-color: var(--accent, #0066cc);
    }

    .input-area.dragging {
      border-color: var(--accent, #0066cc);
      background-color: var(--accent-light, rgba(0, 102, 204, 0.05));
    }

    .input-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--size-4, 1rem);
      color: var(--text-secondary, #666);
      font-size: 1rem;
      pointer-events: none;
      padding: 1.5rem;
      text-align: center;
    }

    .input-icons {
      display: flex;
      gap: 1.5rem;
      align-items: center;
    }

    .input-icon {
      width: 40px;
      height: 40px;
      color: var(--text-muted, #999);
    }

    .input-divider {
      width: 1px;
      height: 32px;
      background: var(--border, #ccc);
    }

    .input-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .input-primary {
      font-size: 1rem;
      color: var(--text, #333);
    }

    .input-secondary {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }
  `;

  @state()
  private isDragging = false;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('paste', this.handlePaste);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('paste', this.handlePaste);
  }

  private handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }

  private handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;

    if (e.dataTransfer) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          if (file) {
            this.emitFile(file);
            break;
          }
        }
      }
    }
  }

  private handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // Check if there's a file being pasted directly (e.g., image from screenshot)
    if (clipboardData.files.length > 0) {
      const file = clipboardData.files[0];
      // If it's an image file, we can use it directly
      if (file.type.startsWith('image/')) {
        this.emitFile(file);
        return;
      }
    }

    // Otherwise, create a clipboard file with all formats
    const fileData: ClipboardFileData = {
      formats: [],
      images: [],
    };

    // Check for image files
    if (clipboardData.files.length > 0) {
      for (const file of Array.from(clipboardData.files)) {
        if (file.type.startsWith('image/')) {
          const base64 = await this.fileToBase64(file);
          fileData.images.push({
            type: file.type,
            data: base64,
          });
        }
      }
    }

    // Check for different data types
    const types = clipboardData.types;
    
    for (const type of types) {
      if (type === 'Files') continue;

      const data = clipboardData.getData(type);
      if (!data) continue;

      let viewer: ClipboardFormat['viewer'] = 'text';
      
      if (type === 'text/html') {
        viewer = 'html';
      } else if (type === 'text/rtf' || type === 'application/rtf') {
        viewer = 'rtf';
      } else if (type === 'application/json' || this.isJson(data)) {
        viewer = 'json';
      }

      fileData.formats.push({
        type,
        label: this.getFormatLabel(type),
        data,
        viewer,
      });
    }

    // Only proceed if we have some data
    if (fileData.formats.length === 0 && fileData.images.length === 0) {
      return;
    }

    // Create a synthetic .clipboard file
    const jsonContent = JSON.stringify(fileData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/x-clipboard' });
    const file = new File([blob], 'clipboard.clipboard', { type: 'application/x-clipboard' });

    this.emitFile(file);
  };

  private emitFile(file: File) {
    this.dispatchEvent(new CustomEvent('file-input', {
      detail: file,
      bubbles: true,
      composed: true,
    }));
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private isJson(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
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

  private handleClick() {
    this.focus();
  }

  render() {
    return html`
      <div class="input-zone">
        <p class="privacy-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          ${t('privacy-notice', 'Your file is not uploaded. All processing happens locally in your browser.')}
        </p>
        <div 
          class="input-area ${this.isDragging ? 'dragging' : ''}"
          tabindex="0"
          @click=${this.handleClick}
          @dragenter=${this.handleDragEnter}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <div class="input-content">
            <div class="input-icons">
              <svg class="input-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <div class="input-divider"></div>
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            <div class="input-text">
              <span class="input-primary">${t('drop-or-paste', 'Drop file or paste content')}</span>
              <span class="input-secondary">${t('drop-paste-hint', 'Drag and drop a file, or press Ctrl+V to paste')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'input-zone': InputZone;
  }
}
