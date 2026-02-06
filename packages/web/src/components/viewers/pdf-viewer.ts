import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('pdf-viewer')
export class PdfViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .pdf-viewer {
      width: 100%;
      min-height: 80vh;
      position: relative;
    }
    .pdf-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private pdfUrl = '';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      if (this.pdfUrl) {
        URL.revokeObjectURL(this.pdfUrl);
      }
      this.pdfUrl = URL.createObjectURL(this.file);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.pdfUrl) {
      URL.revokeObjectURL(this.pdfUrl);
    }
  }

  render() {
    if (!this.file || !this.pdfUrl) {
      return html`<loading-spinner></loading-spinner>`;
    }

    // Use browser's built-in PDF viewer via iframe
    // For more advanced features, consider integrating pdf.js directly
    return html`
      <div class="pdf-viewer">
        <iframe
          class="pdf-iframe"
          src=${this.pdfUrl}
          title=${this.file.name}
        ></iframe>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pdf-viewer': PdfViewer;
  }
}
