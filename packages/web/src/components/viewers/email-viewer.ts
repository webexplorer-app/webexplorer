import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type MsgFile, parseMsgFile } from '@webexplorer/email';
import PostalMime, { type Email } from 'postal-mime';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

interface ParsedEmail {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: { filename: string; content: ArrayBuffer; mimeType: string }[];
}

function msgToEmail(msg: MsgFile): ParsedEmail {
  const from = msg.senderName
    ? `${msg.senderName} <${msg.senderEmail || ''}>`
    : msg.senderEmail || '';
  return {
    from,
    to: msg.toRecipient || '',
    subject: msg.subject || '',
    text: msg.text || '',
    html: '',
    attachments: msg.attachments.map(a => ({
      filename: a.filename,
      content: a.content.buffer as ArrayBuffer,
      mimeType: 'application/octet-stream',
    })),
  };
}

function emlToEmail(eml: Email): ParsedEmail {
  const fromAddr = eml.from;
  const from = fromAddr
    ? (fromAddr.name ? `${fromAddr.name} <${fromAddr.address}>` : fromAddr.address || '')
    : '';
  const to = (eml.to || [])
    .map(a => 'address' in a ? (a.name ? `${a.name} <${a.address}>` : a.address) : '')
    .join(', ');
  return {
    from,
    to,
    subject: eml.subject || '',
    text: eml.text || '',
    html: eml.html || '',
    attachments: (eml.attachments || []).map(a => ({
      filename: a.filename || 'attachment',
      content: a.content as ArrayBuffer,
      mimeType: a.mimeType || 'application/octet-stream',
    })),
  };
}

@customElement('email-viewer')
export class EmailViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .email-viewer {
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
  private email: ParsedEmail | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadEmail();
    }
  }

  private async loadEmail() {
    if (!this.file) return;

    const buffer = await this.file.arrayBuffer();
    const ext = this.file.name.split('.').pop()?.toLowerCase();

    if (ext === 'msg') {
      const msgFile = parseMsgFile(new Uint8Array(buffer));
      if (msgFile) {
        this.email = msgToEmail(msgFile);
      }
    } else {
      // EML, MHT, MHTML — RFC822 text format
      const eml = await PostalMime.parse(buffer);
      this.email = emlToEmail(eml);
    }
  }

  render() {
    if (!this.email) {
      return html`<div class="email-viewer"></div>`;
    }

    const attachments = this.email.attachments.map(a => ({
      ...a,
      downloadUrl: URL.createObjectURL(new Blob([a.content], { type: a.mimeType })),
    }));

    return html`
      <div class="email-viewer">
        <table>
          <tbody>
            <tr>
              <td>${t('from', 'From')}</td>
              <td>${this.email.from}</td>
            </tr>
            <tr>
              <td>${t('to', 'To')}</td>
              <td>${this.email.to}</td>
            </tr>
            <tr>
              <td>${t('subject', 'Subject')}</td>
              <td>${this.email.subject}</td>
            </tr>
            ${attachments.length > 0 ? html`
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
            ` : ''}
          </tbody>
        </table>
        ${this.email.html
          ? html`<div class="email-content" .innerHTML=${this.email.html}></div>`
          : html`<p class="email-content">${this.email.text}</p>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'email-viewer': EmailViewer;
  }
}
