import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createFFmpegWorker } from '../../common/ffmpeg-worker';
import { readFile } from '../../common/file';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

@customElement('ffmpeg-viewer')
export class FFmpegViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .ffmpeg-viewer {
    }
    video {
      width: 100%;
    }
    .transcoding-message {
      padding: 1rem;
      text-align: center;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private isTranscoding = false;

  @state()
  private videoUrl = '';

  private worker = createFFmpegWorker();
  private aborted = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.transcode();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.aborted = true;
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }
  }

  private async transcode() {
    if (!this.file) return;

    this.aborted = false;
    this.isTranscoding = true;

    try {
      const buffer = await readFile(this.file);
      if (this.aborted) return;

      await this.worker.writeFile(this.file.name, buffer as Uint8Array);
      if (this.aborted) return;

      await this.worker.ffmpeg('-i', this.file.name, `${this.file.name}.webm`);
      if (this.aborted) return;

      const data = await this.worker.readFile(`${this.file.name}.webm`, buffer as Uint8Array);
      if (this.aborted) return;

      if (this.videoUrl) {
        URL.revokeObjectURL(this.videoUrl);
      }
      this.videoUrl = URL.createObjectURL(new Blob([data.buffer], { type: 'video/webm' }));
      this.isTranscoding = false;
    } catch (e) {
      console.error('Transcoding failed:', e);
      this.isTranscoding = false;
    }
  }

  render() {
    return html`
      <div class="ffmpeg-viewer">
        ${this.isTranscoding ? html`
          <p class="transcoding-message">${t('transcoding', 'Transcoding')}</p>
        ` : ''}
        <video controls src=${this.videoUrl}></video>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ffmpeg-viewer': FFmpegViewer;
  }
}
