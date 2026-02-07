import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('audio-viewer')
export class AudioViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .audio-viewer {
    }
    audio {
      width: 100%;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private audioUrl = '';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      if (this.audioUrl) {
        URL.revokeObjectURL(this.audioUrl);
      }
      this.audioUrl = URL.createObjectURL(this.file);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
    }
  }

  render() {
    if (!this.file) return html``;

    return html`
      <div class="audio-viewer">
        <audio controls src=${this.audioUrl}></audio>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'audio-viewer': AudioViewer;
  }
}
