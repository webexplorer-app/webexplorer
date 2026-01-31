import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';
import './text-viewer';
import './binary-viewer';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

type FallbackViewer = 'text' | 'binary';

@customElement('default-viewer')
export class DefaultViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .default-viewer header {
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 1rem;
      background: var(--background, #fff);
    }
    .default-viewer header h4 {
      flex: 1;
      margin: 0;
      padding: 0;
      color: var(--text, #333);
    }
    .default-viewer header select {
      display: inline-block;
      margin-right: 1rem;
      padding: 0.5rem;
      background: var(--surface, #f5f5f5);
      color: var(--text, #333);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }
    .text-center {
      text-align: center;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private fallbackViewer: FallbackViewer = 'text';

  private handleViewerChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.fallbackViewer = select.value as FallbackViewer;
  }

  render() {
    if (!this.file) return html``;

    let viewer;
    if (this.file.size > MAX_FILE_SIZE) {
      viewer = html`
        <div>
          <p class="text-center">${t('file-is-too-large', 'File is too large')}</p>
          <p class="text-center">${this.file.type}</p>
        </div>
      `;
    } else {
      switch (this.fallbackViewer) {
        case 'binary':
          viewer = html`<binary-viewer .file=${this.file}></binary-viewer>`;
          break;
        case 'text':
        default:
          viewer = html`<text-viewer .file=${this.file}></text-viewer>`;
          break;
      }
    }

    return html`
      <div class="default-viewer">
        <header>
          <h4>${t('default-viewer', 'Default Viewer')}</h4>
          <select .value=${this.fallbackViewer} @change=${this.handleViewerChange}>
            <option value="text">${t('text', 'Text')}</option>
            <option value="binary">${t('binary', 'Binary')}</option>
          </select>
        </header>
        <section>${viewer}</section>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-viewer': DefaultViewer;
  }
}
