import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import '../file-picker';
import '../supported-files-list';
import { LocalizedLitElement } from '../localized-element';

@customElement('home-page')
export class HomePage extends LocalizedLitElement {
  static styles = css`
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

  render() {
    return html`
      <page-layout className="page--home">
        <page-header>
          <page-toolbar>
            <span slot="left"></span>
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
                <supported-files-list></supported-files-list>
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
