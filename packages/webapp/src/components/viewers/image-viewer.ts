import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('image-viewer')
export class ImageViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .image-viewer {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }
    img {
      max-width: 100%;
      max-height: calc(100vh - 150px);
      object-fit: contain;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private imageUrl = '';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl);
      }
      this.imageUrl = URL.createObjectURL(this.file);
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
      <div class="image-viewer">
        <img alt=${this.file.name} src=${this.imageUrl} />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'image-viewer': ImageViewer;
  }
}
