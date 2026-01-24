import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import { LocalizedLitElement } from '../localized-element';

@customElement('viewer-page')
export class ViewerPage extends LocalizedLitElement {
  static styles = css`
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      background: var(--surface, white);
      color: var(--primary, #333);
      cursor: pointer;
      font-size: 0.875rem;
    }
    .back-button:hover {
      background-color: var(--border, #f0f0f0);
    }
    .back-button svg {
      width: 1rem;
      height: 1rem;
      stroke: var(--primary, currentColor);
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
            <span slot="right" class="toolbar-actions">
              <theme-toggle></theme-toggle>
              <locale-selector></locale-selector>
            </span>
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
