import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../Utils/Localization';
import { LocalizedLitElement } from './localized-element';

@customElement('drop-zone')
export class DropZone extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .dropzone {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .dropzone-area {
      width: 100%;
      max-width: 600px;
      min-height: 200px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .dropzone-area:hover {
      border-color: #999;
      background-color: #f9f9f9;
    }
    .dropzone-area p {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      color: #666;
      font-size: 1rem;
    }
    .dropzone-icon {
      width: 48px;
      height: 48px;
      color: #999;
    }
    .dropzone-or {
      color: #999;
      font-size: 0.875rem;
    }
  `;

  private handleDragStart(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleDragEnd(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  private handleFilesSelected(e: CustomEvent<FileList>) {
    const files = e.detail;
    if (files.length > 0) {
      this.dispatchEvent(new CustomEvent('drop-file', {
        detail: files[0],
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();

    if (e.dataTransfer) {
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          const file = e.dataTransfer.items[i].getAsFile();
          if (file) {
            this.dispatchEvent(new CustomEvent('drop-file', {
              detail: file,
              bubbles: true,
              composed: true
            }));
            break;
          }
        }
      }
    }
  }

  render() {
    return html`
      <div class="dropzone">
        <div
          class="dropzone-area"
          @dragstart=${this.handleDragStart}
          @dragover=${this.handleDragOver}
          @dragend=${this.handleDragEnd}
          @drop=${this.handleDrop}
        >
          <p>
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
            ${t('drag-and-drop-file-here', 'Drag and drop file here')}
            <span class="dropzone-or">${t('or', 'or')}</span>
            <file-picker @files-selected=${this.handleFilesSelected}></file-picker>
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'drop-zone': DropZone;
  }
}
