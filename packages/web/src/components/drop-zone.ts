import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../common/Localization';
import { LocalizedLitElement } from './localized-element';

@customElement('drop-zone')
export class DropZone extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .dropzone {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .dropzone-area {
      width: min(60rem, 100%);
      min-height: 150px;
      border: 2px dashed var(--border, #ccc);
      border-radius: var(--radius-3, 8px);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: border-color 0.2s, background-color 0.2s;
    }
    .dropzone-area.dragging {
      border-color: var(--accent, #0066cc);
      background-color: var(--accent-light, rgba(0, 102, 204, 0.05));
    }
    .dropzone-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--size-3, 0.75rem);
      color: var(--text-secondary, #666);
      font-size: 1rem;
      pointer-events: none;
    }
    .dropzone-icon {
      width: 48px;
      height: 48px;
      color: var(--text-muted, #999);
    }
  `;

  @state()
  private isDragging = false;

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
          class="dropzone-area ${this.isDragging ? 'dragging' : ''}"
          @dragenter=${this.handleDragEnter}
          @dragover=${this.handleDragOver}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
          <p class="dropzone-content">
            <svg class="dropzone-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
            ${t('drag-and-drop-file-here', 'Drag and drop file here')}
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
