import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('video-viewer')
export class VideoViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .video-viewer {
    }
    video {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private videoUrl = '';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      if (this.videoUrl) {
        URL.revokeObjectURL(this.videoUrl);
      }
      this.videoUrl = URL.createObjectURL(this.file);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }
  }

  render() {
    if (!this.file) return html``;

    return html`
      <div class="video-viewer">
        <video controls src=${this.videoUrl}></video>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'video-viewer': VideoViewer;
  }
}
