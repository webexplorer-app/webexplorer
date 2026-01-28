import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import '../file-picker';
import { LocalizedLitElement } from '../localized-element';

@customElement('home-page')
export class HomePage extends LocalizedLitElement {
  static styles = css`
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .create-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--accent, #0066cc);
      border-radius: 4px;
      background: var(--accent, #0066cc);
      color: var(--text-inverse, #fff);
      cursor: pointer;
      font-size: 0.875rem;
      transition: background-color 0.2s;
    }
    .create-button:hover {
      background: var(--accent-hover, #0052a3);
    }
    .create-button svg {
      width: 1rem;
      height: 1rem;
    }
    .explorer {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .file-input-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .file-input-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      max-width: 600px;
      justify-content: center;
    }
    .separator {
      display: flex;
      align-items: center;
      gap: 1rem;
      width: 100%;
      max-width: 600px;
      color: var(--secondary, #999);
      font-size: 0.875rem;
    }
    .separator::before,
    .separator::after {
      content: '';
      flex: 1;
      height: 1px;
      background-color: var(--border, #ddd);
    }
    .supports {
      margin-top: 1rem;
    }
    .supports h3 {
      margin-bottom: 1rem;
      color: var(--primary, #333);
    }
    .supports table {
      width: 100%;
      border-collapse: collapse;
    }
    .supports th,
    .supports td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border, #ddd);
      color: var(--primary, #333);
    }
    .supports th {
      background-color: var(--surface, #f5f5f5);
      font-weight: 600;
    }
  `;

  private handleDropFile(e: CustomEvent<File>) {
    this.dispatchEvent(new CustomEvent('file-selected', {
      detail: e.detail,
      bubbles: true,
      composed: true
    }));
  }

  private handleFilesSelected(e: CustomEvent<FileList>) {
    const files = e.detail;
    if (files.length > 0) {
      this.dispatchEvent(new CustomEvent('file-selected', {
        detail: files[0],
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleCreateClick() {
    this.dispatchEvent(new CustomEvent('navigate-create', {
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <page-layout className="page--home">
        <page-header>
          <page-toolbar>
            <button slot="left" class="create-button" @click=${this.handleCreateClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              ${t('create-new-file', 'Create New File')}
            </button>
            <page-title slot="center" title="Web Explorer"></page-title>
            <span slot="right" class="toolbar-actions">
              <theme-toggle></theme-toggle>
              <locale-selector></locale-selector>
            </span>
          </page-toolbar>
        </page-header>
        <page-content>
          <div class="explorer">
              <div class="file-input-section">
                <drop-zone @drop-file=${this.handleDropFile}></drop-zone>
                <div class="file-input-row">
                  <file-picker @files-selected=${this.handleFilesSelected}></file-picker>
                </div>
              </div>
              <div class="supports">
                <h3>${t('supported-files', 'Supported Files')}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>${t('file', 'File')}</th>
                      <th>${t('extension', 'Extension')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>${t('pdf-file', 'PDF File')}</td>
                      <td>.pdf</td>
                    </tr>
                    <tr>
                      <td>${t('epub-file', 'EPUB File')}</td>
                      <td>.epub</td>
                    </tr>
                    <tr>
                      <td>${t('mobi-file', 'Mobi File')}</td>
                      <td>.mobi</td>
                    </tr>
                    <tr>
                      <td>${t('azw3-file', 'Azw3 File')}</td>
                      <td>.azw3 (limited supported)</td>
                    </tr>
                    <tr>
                      <td>${t('archive-file', 'Archive File')}</td>
                      <td>.zip .rar .tar.gz</td>
                    </tr>
                    <tr>
                      <td>${t('guitar-tab-file', 'Guitar Tab File')}</td>
                      <td>.gp3 .gp4</td>
                    </tr>
                    <tr>
                      <td>${t('threed-model-file', '3D Model File')}</td>
                      <td>.gltf .stl .3mf .obj</td>
                    </tr>
                    <tr>
                      <td>${t('torrent-file', 'Torrent File')}</td>
                      <td>.torrent</td>
                    </tr>
                    <tr>
                      <td>${t('csv-file', 'CSV File')}</td>
                      <td>.csv</td>
                    </tr>
                    <tr>
                      <td>${t('wasm-file', 'WASM File')}</td>
                      <td>.wasm</td>
                    </tr>
                    <tr>
                      <td>${t('image-file', 'Image File')}</td>
                      <td>.png .jpg .jpeg .gif .webp .apng .bmp .svg .avif .ico .tiff</td>
                    </tr>
                    <tr>
                      <td>${t('audio-file', 'Audio File')}</td>
                      <td>.mp3 .flac .aac .ogg</td>
                    </tr>
                    <tr>
                      <td>${t('video-file', 'Video File')}</td>
                      <td>.mp4 .webm .ogg .mov</td>
                    </tr>
                    <tr>
                      <td>${t('email-file', 'Email File')}</td>
                      <td>.msg</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
        </page-content>
      </page-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
