import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import WebTorrent from 'webtorrent/dist/webtorrent.min';
import type { Torrent, TorrentFile } from 'webtorrent';
import { Buffer } from 'buffer';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

enum State {
  Initial,
  Loading,
  Failure,
  Success,
}

@customElement('torrent-viewer')
export class TorrentViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .torrent-viewer {
    }
    .loading, .error {
      text-align: center;
      padding: 2rem;
    }
    .error {
      color: var(--error, #d32f2f);
    }
    .torrent-file {
      margin-bottom: 1rem;
      padding: 1rem;
      background: var(--surface, #f5f5f5);
      border-radius: 4px;
    }
    .torrent-file-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .torrent-file-header p {
      margin: 0;
      flex: 1;
      color: var(--text, #333);
    }
    .torrent-file-header button,
    .torrent-file-header a {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      background: var(--surface, white);
      cursor: pointer;
      text-decoration: none;
      color: var(--text, #333);
      font-size: 0.875rem;
    }
    .torrent-file-header button:hover,
    .torrent-file-header a:hover {
      background: var(--surface-hover, #e0e0e0);
    }
    .torrent-file-header button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .torrent-preview {
      width: 100%;
    }
    .torrent-preview img,
    .torrent-preview audio,
    .torrent-preview video,
    .torrent-preview iframe {
      display: block;
      width: 100%;
      max-height: 70vh;
      border: 0;
      object-fit: contain;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private torrent: Torrent | null = null;

  @state()
  private state: State = State.Initial;

  @state()
  private fileUrls: Map<string, string> = new Map();

  @state()
  private previewedFiles: Set<string> = new Set();

  private client: InstanceType<typeof WebTorrent> | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadTorrent();
    }
  }

  disconnectedCallback() {
    this.clearFileUrls();
    super.disconnectedCallback();
    this.client?.destroy();
  }

  private loadTorrent() {
    if (!this.file) return;

    this.clearFileUrls();
    this.previewedFiles = new Set();
    this.state = State.Loading;
    this.client = new WebTorrent();

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      const buffer = Buffer.from(result);

      this.client!.add(buffer, async (torrent: Torrent) => {
        this.torrent = torrent;

        try {
          const fileUrls = await Promise.all(torrent.files.map(async (file: TorrentFile) => {
            const blob = await file.blob();
            return [file.name, URL.createObjectURL(blob)] as const;
          }));
          this.fileUrls = new Map(fileUrls);
          this.state = State.Success;
        } catch (error) {
          console.error('Failed to load torrent files:', error);
          this.state = State.Failure;
        }
      });

      this.client!.on('error', () => {
        this.state = State.Failure;
      });
    };

    reader.onerror = () => {
      this.state = State.Failure;
    };

    reader.readAsArrayBuffer(this.file);
  }

  private handlePreview(file: TorrentFile) {
    this.previewedFiles = new Set(this.previewedFiles).add(file.name);
  }

  private clearFileUrls() {
    for (const url of this.fileUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.fileUrls = new Map();
  }

  private renderPreview(file: TorrentFile) {
    const url = this.fileUrls.get(file.name);
    if (!url) return null;

    if (file.type.startsWith('image/')) {
      return html`<img src=${url} alt=${file.name}>`;
    }
    if (file.type.startsWith('audio/')) {
      return html`<audio src=${url} controls></audio>`;
    }
    if (file.type.startsWith('video/')) {
      return html`<video src=${url} controls></video>`;
    }
    return html`<iframe src=${url} title=${file.name}></iframe>`;
  }

  render() {
    if (this.state === State.Loading || this.state === State.Initial) {
      return html`
        <div class="torrent-viewer">
          <div class="loading">
            <loading-spinner></loading-spinner>
          </div>
        </div>
      `;
    }

    if (this.state === State.Failure) {
      return html`
        <div class="torrent-viewer">
          <div class="error">${t('loading-failure', 'Loading failed')}</div>
        </div>
      `;
    }

    return html`
      <div class="torrent-viewer">
        ${this.torrent?.files.map((file: TorrentFile) => html`
          <div class="torrent-file">
            <header class="torrent-file-header">
              <p>${file.name}</p>
              <button
                type="button"
                ?disabled=${this.previewedFiles.has(file.name) || !this.fileUrls.has(file.name)}
                @click=${() => this.handlePreview(file)}
              >
                ${t('preview', 'Preview')}
              </button>
              <a
                rel="noreferrer"
                target="_blank"
                href=${this.fileUrls.get(file.name) || '#'}
              >
                ${t('download', 'Download')}
              </a>
            </header>
            <div
              id="preview-${file.name.replace(/[^a-zA-Z0-9]/g, '_')}"
              class="torrent-preview"
            >${this.previewedFiles.has(file.name) ? this.renderPreview(file) : null}</div>
          </div>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'torrent-viewer': TorrentViewer;
  }
}
