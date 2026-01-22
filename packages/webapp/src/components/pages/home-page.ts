import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t, locales, type Locale } from '../../Utils/Localization';
import '../page-layout';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .locale-selector {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .explorer {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .supports {
      margin-top: 2rem;
    }
    .supports h3 {
      margin-bottom: 1rem;
    }
    .supports table {
      width: 100%;
      border-collapse: collapse;
    }
    .supports th,
    .supports td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    .supports th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
  `;

  @property({ type: String })
  locale: Locale = 'en-US';

  private handleLocaleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.dispatchEvent(new CustomEvent('locale-change', {
      detail: select.value as Locale,
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

  private handleDropFile(e: CustomEvent<File>) {
    this.dispatchEvent(new CustomEvent('file-selected', {
      detail: e.detail,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <page-layout className="page--home">
        <page-header>
          <div class="toolbar">
            <page-title title="Web Explorer"></page-title>
            <select
              class="locale-selector"
              .value=${this.locale}
              @change=${this.handleLocaleChange}
            >
              ${locales.map(loc => html`
                <option value=${loc}>${t(loc)}</option>
              `)}
            </select>
            <file-picker @files-selected=${this.handleFilesSelected}></file-picker>
          </div>
        </page-header>
        <page-content>
          <div class="explorer">
              <drop-zone @drop-file=${this.handleDropFile}></drop-zone>
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
