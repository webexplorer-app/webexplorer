import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import '../file-picker';
import '../supported-files-list';
import '../credits-dialog';
import { LocalizedLitElement } from '../localized-element';

@customElement('home-page')
export class HomePage extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: var(--size-2, 0.5rem);
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-2, 8px);
      cursor: pointer;
      color: var(--text-muted, #6b7280);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .icon-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .icon-btn:hover {
      background: var(--surface-hover, #f3f4f6);
      color: var(--accent, #3b82f6);
      transform: scale(1.05);
    }
    .icon-btn:active {
      transform: scale(0.95);
    }
    .explorer {
      display: flex;
      flex-direction: column;
      gap: var(--size-8, 2rem);
    }
    .file-input-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--size-6, 1.5rem);
    }
    .file-input-row {
      display: flex;
      align-items: center;
      gap: var(--size-4, 1rem);
      width: 100%;
      max-width: 600px;
      justify-content: center;
    }
    .supports {
      margin-top: var(--size-4, 1rem);
    }
    .supports h3 {
      margin-bottom: var(--size-4, 1rem);
      color: var(--primary, #333);
      font-weight: var(--font-weight-6, 600);
    }
  `;

  @state()
  private showCredits = false;

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
            <span slot="left" class="toolbar-actions">
              <locale-selector></locale-selector>
            </span>
            <page-title slot="center" title="Web Explorer" showIcon></page-title>
            <span slot="right" class="toolbar-actions">
              <a 
                class="icon-btn"
                href="mailto:jichang_dev@outlook.com"
                title=${t('contact', 'Contact')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </a>
              <button 
                class="icon-btn" 
                @click=${() => this.showCredits = true}
                title=${t('open-source-credits', 'Open Source Credits')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </button>
              <theme-toggle></theme-toggle>
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
      <credits-dialog 
        ?open=${this.showCredits} 
        @close=${() => this.showCredits = false}
      ></credits-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
