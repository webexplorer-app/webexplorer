import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t, locales, type Locale } from '../../Utils/Localization';
import '../page-layout';

@customElement('viewer-page')
export class ViewerPage extends LitElement {
  static styles = css`
    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .file-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .locale-selector {
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .back-button:hover {
      background-color: #f0f0f0;
    }
    .back-button svg {
      width: 1rem;
      height: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @property({ type: String })
  locale: Locale = 'en-US';

  connectedCallback() {
    super.connectedCallback();
    if (this.file) {
      document.title = this.file.name;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.title = 'Web Explorer';
  }

  private handleBackClick() {
    this.dispatchEvent(new CustomEvent('back-to-home', {
      bubbles: true,
      composed: true
    }));
  }

  private handleLocaleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.dispatchEvent(new CustomEvent('locale-change', {
      detail: select.value as Locale,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (!this.file) {
      return html`<div>${t('no-file-selected', 'No file selected')}</div>`;
    }

    return html`
      <page-layout className="page--viewer">
        <page-header>
          <div class="toolbar">
            <button class="back-button" @click=${this.handleBackClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              ${t('back-to-home', 'Back to Home')}
            </button>
            <h4 class="file-title">${this.file.name}</h4>
            <select
              class="locale-selector"
              .value=${this.locale}
              @change=${this.handleLocaleChange}
            >
              ${locales.map(loc => html`
                <option value=${loc}>${t(loc)}</option>
              `)}
            </select>
          </div>
        </page-header>
        <page-content>
          <file-viewer .file=${this.file}></file-viewer>
        </page-content>
      </page-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'viewer-page': ViewerPage;
  }
}
