import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('binary-viewer')
export class BinaryViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .binary-viewer {
      padding: 1rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      color: var(--code-text, #333);
    }
    .binary-viewer div {
      background: var(--code-background, #f5f5f5);
      padding: 0.25rem 0.5rem;
      border-radius: 2px;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private bytes: number[] = [];

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadBytes();
    }
  }

  private loadBytes() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const view = new DataView(buffer);
      const length = Math.min(view.byteLength, 1024); // Limit to first 1KB
      const bytes: number[] = [];
      for (let j = 0; j < length; j++) {
        bytes.push(view.getUint8(j));
      }
      this.bytes = bytes;
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    return html`
      <div class="binary-viewer">
        ${this.bytes.map(byte => html`
          <div>0x${byte.toString(16).toUpperCase().padStart(2, '0')}</div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'binary-viewer': BinaryViewer;
  }
}
