import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t } from '../../Utils/Localization';
import '../page-layout';
import '../locale-selector';
import { LocalizedLitElement } from '../localized-element';

@customElement('viewer-page')
export class ViewerPage extends LocalizedLitElement {
  static styles = css`
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

  render() {
    if (!this.file) {
      return html`<div>${t('no-file-selected', 'No file selected')}</div>`;
    }

    return html`
      <page-layout className="page--viewer">
        <page-header>
          <page-toolbar>
            <button slot="left" class="back-button" @click=${this.handleBackClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              ${t('back-to-home', 'Back to Home')}
            </button>
            <page-title slot="center" .title=${this.file.name}></page-title>
            <locale-selector slot="right"></locale-selector>
          </page-toolbar>
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
