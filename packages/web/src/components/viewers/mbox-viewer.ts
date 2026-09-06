import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import './email-viewer';

const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_MESSAGES = 1000;

interface MailboxMessage {
  file: File;
  from: string;
  subject: string;
  date: string;
}

function parseHeaders(message: string): Map<string, string> {
  const headerEnd = message.search(/\r?\n\r?\n/);
  const headerText = headerEnd >= 0 ? message.slice(0, headerEnd) : message;
  const unfolded = headerText.replace(/\r?\n[\t ]+/g, ' ');
  const headers = new Map<string, string>();

  for (const line of unfolded.split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator <= 0) continue;
    headers.set(line.slice(0, separator).toLowerCase(), line.slice(separator + 1).trim());
  }
  return headers;
}

function splitMailbox(content: string): MailboxMessage[] {
  const delimiter = /^From [^\r\n]*(?:\r?\n|$)/gm;
  const matches = Array.from(content.matchAll(delimiter));
  if (matches.length === 0) throw new Error('No MBOX message separators found');

  return matches.slice(0, MAX_MESSAGES).map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? matches[index + 1].index : content.length;
    const rawMessage = content.slice(start, end).replace(/^>(>*From )/gm, '$1').trimEnd();
    const headers = parseHeaders(rawMessage);

    return {
      file: new File([rawMessage], `message-${index + 1}.eml`, { type: 'message/rfc822' }),
      from: headers.get('from') || t('unknown-sender', 'Unknown sender'),
      subject: headers.get('subject') || t('no-subject', '(No subject)'),
      date: headers.get('date') || '',
    };
  });
}

@customElement('mbox-viewer')
export class MboxViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; color: var(--text, #222); }
    .layout { display: grid; grid-template-columns: 320px minmax(0, 1fr); min-height: 600px; border: 1px solid var(--border, #ddd); }
    .mailbox { border-right: 1px solid var(--border, #ddd); background: var(--surface, #fff); min-width: 0; }
    .search { box-sizing: border-box; width: calc(100% - 1rem); margin: 0.5rem; padding: 0.55rem 0.65rem; border: 1px solid var(--border, #ccc); border-radius: 4px; background: var(--background, #fff); color: var(--text, #222); }
    .count { padding: 0 0.75rem 0.5rem; color: var(--text-secondary, #666); font-size: 0.8rem; }
    .messages { max-height: 75vh; overflow: auto; }
    .message { display: block; box-sizing: border-box; width: 100%; padding: 0.7rem 0.75rem; border: 0; border-top: 1px solid var(--border, #eee); border-radius: 0; background: transparent; color: inherit; text-align: left; cursor: pointer; }
    .message:hover { background: var(--surface-hover, #f3f3f3); }
    .message.active { background: var(--surface-active, #e8f1fb); box-shadow: inset 3px 0 var(--primary, #0672ce); }
    .subject, .from { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .subject { font-weight: 600; }
    .from, .date { margin-top: 0.2rem; color: var(--text-secondary, #666); font-size: 0.8rem; }
    .content { min-width: 0; padding: 1rem; overflow: auto; }
    .status { display: grid; place-items: center; min-height: 300px; padding: 2rem; text-align: center; color: var(--text-secondary, #666); }
    .error { color: var(--error, #dc2626); }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } .mailbox { border-right: 0; border-bottom: 1px solid var(--border, #ddd); } .messages { max-height: 260px; } .content { padding: 0.5rem; } }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private messages: MailboxMessage[] = [];
  @state() private selectedIndex = 0;
  @state() private query = '';
  @state() private loading = true;
  @state() private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) void this.loadMailbox(this.file);
  }

  private async loadMailbox(file: File) {
    this.loading = true;
    this.error = null;
    this.messages = [];
    this.selectedIndex = 0;

    try {
      if (file.size > MAX_FILE_SIZE) throw new Error('Mailbox exceeds the 200 MB preview limit');
      const messages = splitMailbox(await file.text());
      if (this.file !== file) return;
      this.messages = messages;
    } catch (error) {
      if (this.file !== file) return;
      console.error('Failed to load MBOX file:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (this.file === file) this.loading = false;
    }
  }

  private get filteredMessages() {
    const query = this.query.trim().toLowerCase();
    return this.messages
      .map((message, index) => ({ message, index }))
      .filter(({ message }) => !query || `${message.from}\n${message.subject}\n${message.date}`.toLowerCase().includes(query));
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('failed-to-load', 'Failed to load file')}: ${this.error}</div>`;

    const selected = this.messages[this.selectedIndex];
    const filteredMessages = this.filteredMessages;
    return html`
      <div class="layout">
        <aside class="mailbox">
          <input class="search" type="search" placeholder=${t('search-messages', 'Search messages')} .value=${this.query} @input=${(event: InputEvent) => this.query = (event.target as HTMLInputElement).value}>
          <div class="count">${this.messages.length}${this.messages.length === MAX_MESSAGES ? '+' : ''} ${t('messages', 'messages')}</div>
          <div class="messages">
            ${filteredMessages.map(({ message, index }) => html`
              <button class="message ${index === this.selectedIndex ? 'active' : ''}" @click=${() => this.selectedIndex = index}>
                <span class="subject">${message.subject}</span>
                <span class="from">${message.from}</span>
                ${message.date ? html`<span class="date">${message.date}</span>` : null}
              </button>
            `)}
          </div>
        </aside>
        <main class="content">${selected ? html`<email-viewer .file=${selected.file}></email-viewer>` : null}</main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mbox-viewer': MboxViewer;
  }
}