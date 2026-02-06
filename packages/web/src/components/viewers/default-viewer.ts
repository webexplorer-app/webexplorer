import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

@customElement('default-viewer')
export class DefaultViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 2rem;
      text-align: center;
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.6;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text, #1f2937);
      margin: 0 0 0.5rem 0;
    }

    .message {
      font-size: 1rem;
      color: var(--text-muted, #6b7280);
      margin: 0 0 0.5rem 0;
      max-width: 400px;
    }

    .file-info {
      font-size: 0.875rem;
      color: var(--text-muted, #9ca3af);
      margin: 0 0 2rem 0;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 6px;
      font-family: var(--font-mono, monospace);
    }

    .contact-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--primary, #3b82f6);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .contact-btn:hover {
      background: var(--primary-hover, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .contact-btn:active {
      transform: translateY(0);
    }

    .contact-icon {
      font-size: 1.125rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  private getFileExtension(): string {
    if (!this.file) return '';
    const name = this.file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot >= 0 ? name.substring(lastDot) : '';
  }

  render() {
    if (!this.file) return html``;

    const extension = this.getFileExtension();
    const mimeType = this.file.type || 'unknown';

    return html`
      <div class="container">
        <div class="icon">📄</div>
        <h2 class="title">${t('unsupported-file', 'Unsupported File Type')}</h2>
        <p class="message">
          ${t('unsupported-file-message', 'This file type is not currently supported. If you would like us to add support for this format, please let us know!')}
        </p>
        <p class="file-info">
          ${extension} · ${mimeType}
        </p>
        <a 
          class="contact-btn" 
          href="mailto:jichang_dev@outlook.com?subject=File%20Support%20Request%3A%20${encodeURIComponent(extension)}&body=Hi%2C%0A%0AI%20would%20like%20to%20request%20support%20for%20the%20following%20file%20type%3A%0A%0AExtension%3A%20${encodeURIComponent(extension)}%0AMIME%20Type%3A%20${encodeURIComponent(mimeType)}%0A%0AThank%20you!"
        >
          <span class="contact-icon">✉️</span>
          ${t('request-support', 'Request Support')}
        </a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-viewer': DefaultViewer;
  }
}
