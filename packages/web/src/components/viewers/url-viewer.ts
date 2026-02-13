import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface UrlShortcut {
  url: string;
  iconFile?: string;
  iconIndex?: number;
  hotKey?: string;
  workingDirectory?: string;
  showCommand?: string;
  modified?: string;
}

/**
 * Parse a Windows .url (Internet Shortcut) file.
 * Format is INI-like:
 *   [InternetShortcut]
 *   URL=https://example.com
 *   IconFile=...
 *   IconIndex=...
 */
function parseUrlFile(text: string): UrlShortcut | null {
  const lines = text.split(/\r?\n/);
  let inSection = false;
  const result: UrlShortcut = { url: '' };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '[InternetShortcut]' || line === '[InternetShortcut]'.toLowerCase()) {
      inSection = true;
      continue;
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      inSection = false;
      continue;
    }
    if (!inSection) continue;

    const eqIdx = line.indexOf('=');
    if (eqIdx < 0) continue;

    const key = line.substring(0, eqIdx).trim().toLowerCase();
    const value = line.substring(eqIdx + 1).trim();

    switch (key) {
      case 'url':
        result.url = value;
        break;
      case 'iconfile':
        result.iconFile = value;
        break;
      case 'iconindex':
        result.iconIndex = parseInt(value, 10);
        break;
      case 'hotkey':
        result.hotKey = value;
        break;
      case 'workingdirectory':
        result.workingDirectory = value;
        break;
      case 'showcommand':
        result.showCommand = value;
        break;
      case 'modified':
        result.modified = value;
        break;
    }
  }

  return result.url ? result : null;
}

@customElement('url-viewer')
export class UrlViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      max-width: 600px;
      margin: 2rem auto;
    }

    .card {
      background: var(--bg-secondary, #f6f8fa);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }

    .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
    }

    .url-text {
      font-size: 1rem;
      word-break: break-all;
      color: var(--text-primary, #333);
      margin-bottom: 1.5rem;
      font-family: monospace;
      background: var(--bg-tertiary, #eef1f5);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      user-select: all;
    }

    .open-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--accent-color, #0969da);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.15s;
    }

    .open-btn:hover {
      opacity: 0.85;
    }

    .open-btn svg {
      width: 1em;
      height: 1em;
      fill: currentColor;
    }

    .meta {
      margin-top: 1.5rem;
      text-align: left;
      font-size: 0.85rem;
      color: var(--text-secondary, #666);
    }

    .meta-row {
      display: flex;
      gap: 0.5rem;
      padding: 0.35rem 0;
    }

    .meta-key {
      font-weight: 600;
      min-width: 120px;
    }

    .meta-value {
      word-break: break-all;
    }

    .error {
      color: var(--error-color, #d32f2f);
      font-size: 0.9rem;
    }
  `;

  @property({ type: Object }) file: File | null = null;
  @state() private shortcut: UrlShortcut | null = null;
  @state() private error = false;

  override async updated(changed: Map<string, unknown>) {
    if (changed.has('file') && this.file) {
      await this.parseFile();
    }
  }

  private async parseFile() {
    if (!this.file) return;
    try {
      const text = await this.file.text();
      this.shortcut = parseUrlFile(text);
      this.error = !this.shortcut;
    } catch {
      this.error = true;
    }
  }

  override render() {
    if (this.error) {
      return html`<div class="card"><p class="error">${t('failed-to-parse-url', 'Failed to parse URL file')}</p></div>`;
    }
    if (!this.shortcut) {
      return html`<div class="card"><p>${t('loading', 'Loading...')}</p></div>`;
    }

    const { url, iconFile, hotKey, workingDirectory } = this.shortcut;
    const hasMeta = iconFile || hotKey || workingDirectory;

    return html`
      <div class="card">
        <div class="icon">🔗</div>
        <div class="label">${t('url-shortcut', 'Internet Shortcut')}</div>
        <div class="url-text">${url}</div>
        <a class="open-btn" href=${url} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 16 16"><path d="M3.75 2a.75.75 0 0 0 0 1.5h6.69L2.22 11.72a.75.75 0 1 0 1.06 1.06L11.5 4.56v6.69a.75.75 0 0 0 1.5 0V2.75a.75.75 0 0 0-.75-.75H3.75Z"/></svg>
          ${t('open-url', 'Open Link')}
        </a>

        ${hasMeta ? html`
          <div class="meta">
            ${iconFile ? html`<div class="meta-row"><span class="meta-key">Icon File</span><span class="meta-value">${iconFile}</span></div>` : ''}
            ${hotKey ? html`<div class="meta-row"><span class="meta-key">Hot Key</span><span class="meta-value">${hotKey}</span></div>` : ''}
            ${workingDirectory ? html`<div class="meta-row"><span class="meta-key">Working Dir</span><span class="meta-value">${workingDirectory}</span></div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'url-viewer': UrlViewer;
  }
}
