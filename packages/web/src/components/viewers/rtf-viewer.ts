import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { EMFJS, RTFJS, WMFJS } from 'rtf.js';
import { t } from '../../common/Localization';

// Disable logging for rtf.js libraries
RTFJS.loggingEnabled(false);
WMFJS.loggingEnabled(false);
EMFJS.loggingEnabled(false);

@customElement('rtf-viewer')
export class RtfViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .rtf-viewer {
    }
    .rtf-container {
      background: white;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      overflow-x: auto;
      color: #000;
    }
    .rtf-container img {
      max-width: 100%;
    }
    .rtf-container table {
      border-collapse: collapse;
    }
    .rtf-container td, .rtf-container th {
      border: 1px solid #ccc;
      padding: 0.25rem 0.5rem;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }
    .error {
      color: var(--error, #dc2626);
      padding: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadRtf();
    }
  }

  private async loadRtf() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      
      const doc = new RTFJS.Document(arrayBuffer, {});
      const elements = await doc.render();
      
      this.loading = false;
      
      // After render, append elements to container
      await this.updateComplete;
      const container = this.shadowRoot?.querySelector('.rtf-content');
      if (container) {
        container.innerHTML = '';
        elements.forEach(el => container.appendChild(el));
      }
    } catch (e) {
      console.error('Failed to load RTF document:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  render() {
    if (!this.file) {
      return html`<div class="rtf-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="rtf-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="rtf-viewer"><div class="error">${this.error}</div></div>`;
    }

    return html`
      <div class="rtf-viewer">
        <div class="rtf-container">
          <div class="rtf-content"></div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rtf-viewer': RtfViewer;
  }
}
