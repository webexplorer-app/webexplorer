import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type MsgFile, parseMsgFile } from '@webexplorer/email';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

@customElement('email-viewer')
export class EmailViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .email-viewer {
      padding: 1rem;
    }
    table {
      width: 100%;
      margin-bottom: 1rem;
    }
    td {
      padding: 0.5rem;
      border-bottom: 1px solid var(--border-light, #eee);
      color: var(--text, #333);
    }
    td:first-child {
      font-weight: 600;
      width: 100px;
    }
    .email-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      padding: 1rem;
      border: 1px solid var(--border-light, #eee);
      border-radius: 4px;
      color: var(--text, #333);
    }
    .attachments-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .attachments-list li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
    }
    .attachments-list a {
      color: var(--primary, #0078d4);
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .attachments-list a svg {
      width: 16px;
      height: 16px;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private msgFile: MsgFile | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadEmail();
    }
  }

  private loadEmail() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as ArrayBuffer;
      const msgFile = parseMsgFile(new Uint8Array(content));
      if (msgFile) {
        this.msgFile = msgFile;
      }
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    if (!this.msgFile) {
      return html`<div class="email-viewer"></div>`;
    }

    const attachments = this.msgFile.attachments.map(attachment => ({
      ...attachment,
      downloadUrl: URL.createObjectURL(new Blob([attachment.content.buffer as ArrayBuffer]))
    }));

    return html`
      <div class="email-viewer">
        <table>
          <tbody>
            <tr>
              <td>${t('from', 'From')}</td>
              <td>${this.msgFile.senderName || ''} ${this.msgFile.senderEmail ? `<${this.msgFile.senderEmail}>` : ''}</td>
            </tr>
            <tr>
              <td>${t('to', 'To')}</td>
              <td>${this.msgFile.toRecipient}</td>
            </tr>
            <tr>
              <td>${t('subject', 'Subject')}</td>
              <td>${this.msgFile.subject}</td>
            </tr>
            <tr>
              <td>${t('attachments', 'Attachments')}</td>
              <td>
                <ol class="attachments-list">
                  ${attachments.map(item => html`
                    <li>
                      <span>${item.filename}</span>
                      <a download=${item.filename} href=${item.downloadUrl}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                        </svg>
                        ${t('download', 'Download')}
                      </a>
                    </li>
                  `)}
                </ol>
              </td>
            </tr>
          </tbody>
        </table>
        <p class="email-content">${this.msgFile.text}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'email-viewer': EmailViewer;
  }
}
