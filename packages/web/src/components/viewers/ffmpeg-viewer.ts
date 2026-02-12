import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
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
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    video, audio {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }
    .message {
      padding: 1rem;
      text-align: center;
      color: var(--text-muted, #666);
    }
    .error-message {
      padding: 1rem;
      text-align: center;
      color: var(--text-error, #c00);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private isLoading = false;

  @state()
  private isTranscoding = false;

  @state()
  private mediaUrl = '';

  @state()
  private isAudio = false;

  @state()
  private error = '';

  @state()
  private logMessage = '';

  private ffmpeg = new FFmpeg();
  private loaded = false;
  private aborted = false;

  connectedCallback() {
    super.connectedCallback();
    this.ffmpeg.on('log', ({ message }) => {
      this.logMessage = message;
      console.log(message);
    });
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.transcode();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.aborted = true;
    if (this.mediaUrl) {
      URL.revokeObjectURL(this.mediaUrl);
    }
  }

  private async load() {
    if (this.loaded) return;
    this.isLoading = true;
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    this.loaded = true;
    this.isLoading = false;
  }

  private async transcode() {
    if (!this.file) return;

    this.aborted = false;
    this.error = '';
    this.mediaUrl = '';
    this.logMessage = '';

    // Detect audio-only files by extension
    const audioExts = new Set([
      'wma', 'ac3', 'dts', 'ape', 'mka', 'opus', 'amr', 'au', 'snd',
      'mid', 'midi', 'ra', 'ram', 'aiff', 'aif', 'caf', 'tta', 'wv',
    ]);
    const ext = this.file.name.split('.').pop()?.toLowerCase() ?? '';
    this.isAudio = audioExts.has(ext) || this.file.type.startsWith('audio/');

    try {
      await this.load();
      if (this.aborted) return;

      this.isTranscoding = true;

      const buffer = await readFile(this.file);
      if (this.aborted) return;

      await this.ffmpeg.writeFile(this.file.name, new Uint8Array(buffer as ArrayBuffer));
      if (this.aborted) return;

      const outputFile = this.isAudio ? 'output.mp3' : 'output.mp4';
      const args = this.isAudio
        ? ['-i', this.file.name, '-c:a', 'libmp3lame', '-b:a', '192k', outputFile]
        : [
            '-i', this.file.name,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '30',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            outputFile,
          ];

      await this.ffmpeg.exec(args);
      if (this.aborted) return;

      const data = await this.ffmpeg.readFile(outputFile);
      if (this.aborted) return;

      if (this.mediaUrl) {
        URL.revokeObjectURL(this.mediaUrl);
      }
      // Copy from possible SharedArrayBuffer to a regular ArrayBuffer for Blob
      const u8 = data as Uint8Array;
      const buf = new ArrayBuffer(u8.byteLength);
      new Uint8Array(buf).set(u8);
      const mimeType = this.isAudio ? 'audio/mpeg' : 'video/mp4';
      this.mediaUrl = URL.createObjectURL(
        new Blob([buf], { type: mimeType })
      );
    } catch (e) {
      console.error('Transcoding failed:', e);
      this.error = `Transcoding failed: ${e instanceof Error ? e.message : e}`;
    } finally {
      this.isTranscoding = false;
    }
  }

  render() {
    return html`
      <div class="ffmpeg-viewer">
        ${this.isLoading ? html`
          <p class="message">${t('loading', 'Loading ffmpeg-core...')}</p>
        ` : ''}
        ${this.isTranscoding ? html`
          <p class="message">${t('transcoding', 'Transcoding...')}</p>
          <p class="message">${this.logMessage}</p>
        ` : ''}
        ${this.error ? html`
          <p class="error-message">${this.error}</p>
        ` : ''}
        ${this.mediaUrl && this.isAudio ? html`
          <audio controls src=${this.mediaUrl}></audio>
        ` : ''}
        ${this.mediaUrl && !this.isAudio ? html`
          <video controls src=${this.mediaUrl}></video>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ffmpeg-viewer': FFmpegViewer;
  }
}
