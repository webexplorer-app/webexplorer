import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import { LocalizedLitElement } from '../localized-element';

@customElement('viewer-page')
export class ViewerPage extends LocalizedLitElement {
  static styles = css`
    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      height: 2.25rem;
      padding: 0 1rem;
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
    .feedback-btn {
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
    .feedback-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .feedback-btn:hover {
      background: var(--surface-hover, #f3f4f6);
      color: var(--accent, #3b82f6);
      transform: scale(1.05);
    }
    .feedback-btn:active {
      transform: scale(0.95);
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
            <a 
              slot="right"
              class="feedback-btn"
              href="mailto:jichang_dev@outlook.com?subject=Web Explorer Feedback"
              title=${t('feedback', 'Feedback')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </a>
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
