import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('text-viewer')
export class TextViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .text-viewer {
      padding: 0 1rem;
      word-wrap: break-word;
      white-space: pre-wrap;
      font-family: var(--font-mono, monospace);
      color: var(--text, #333);
      background: var(--code-background, #f8f8f8);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private text = '';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadText();
    }
  }

  private loadText() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.text = reader.result as string;
    };
    reader.readAsText(this.file);
  }

  render() {
    return html`
      <div class="text-viewer">
        <p>${this.text}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'text-viewer': TextViewer;
  }
}
