import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('hex-viewer')
export class HexViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--hex-bg, #1e1e1e);
      color: var(--hex-text, #d4d4d4);
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.8125rem;
    }

    .container {
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 1rem;
      background: var(--hex-toolbar, #252526);
      border-bottom: 1px solid var(--hex-border, #3c3c3c);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .toolbar label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--hex-muted, #808080);
    }

    .toolbar select,
    .toolbar input {
      padding: 0.25rem 0.5rem;
      background: var(--hex-input-bg, #3c3c3c);
      border: 1px solid var(--hex-border, #3c3c3c);
      border-radius: 4px;
      color: var(--hex-text, #d4d4d4);
      font-size: 0.8125rem;
      outline: none;
    }

    .toolbar select:focus,
    .toolbar input:focus {
      border-color: var(--primary, #0078d4);
    }

    .stats {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--hex-muted, #808080);
    }

    .hex-content {
      flex: 1;
      overflow-x: auto;
      padding: 0;
    }

    .hex-table {
      width: 100%;
      border-collapse: collapse;
    }

    .hex-row {
      display: flex;
      border-bottom: 1px solid var(--hex-border-light, #2d2d2d);
    }

    .hex-row:hover {
      background: var(--hex-hover, #2a2d2e);
    }

    .offset {
      flex-shrink: 0;
      width: 80px;
      padding: 0.25rem 0.75rem;
      text-align: right;
      color: var(--hex-offset, #569cd6);
      background: var(--hex-gutter, #1e1e1e);
      border-right: 1px solid var(--hex-border, #3c3c3c);
      user-select: none;
    }

    .hex-bytes {
      flex: 1;
      padding: 0.25rem 0.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .byte {
      width: 22px;
      text-align: center;
      cursor: default;
    }

    .byte:hover {
      background: var(--hex-byte-hover, #094771);
      border-radius: 2px;
    }

    .byte.null {
      color: var(--hex-null, #6a737d);
    }

    .byte.printable {
      color: var(--hex-printable, #b5cea8);
    }

    .byte.control {
      color: var(--hex-control, #ce9178);
    }

    .byte.high {
      color: var(--hex-high, #c586c0);
    }

    .byte-group {
      margin-right: 0.5rem;
    }

    .ascii {
      flex-shrink: 0;
      width: 160px;
      padding: 0.25rem 0.75rem;
      border-left: 1px solid var(--hex-border, #3c3c3c);
      background: var(--hex-ascii-bg, #252526);
      white-space: pre;
      letter-spacing: 0.05em;
    }

    .ascii-char {
      display: inline;
    }

    .ascii-char.printable {
      color: var(--hex-ascii-printable, #4ec9b0);
    }

    .ascii-char.non-printable {
      color: var(--hex-ascii-non, #6a737d);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--hex-muted, #808080);
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: #f48771;
    }

    .jump-input {
      width: 100px;
    }

    .header-row {
      display: flex;
      background: var(--hex-header, #2d2d2d);
      border-bottom: 2px solid var(--hex-border, #3c3c3c);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-row .offset {
      color: var(--hex-muted, #808080);
      font-weight: 600;
    }

    .header-row .hex-bytes {
      color: var(--hex-muted, #808080);
      font-weight: 600;
    }

    .header-row .ascii {
      color: var(--hex-muted, #808080);
      font-weight: 600;
      text-align: center;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private data: Uint8Array | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private bytesPerRow = 16;

  @state()
  private displayRows = 1000; // Virtual scrolling limit

  @state()
  private startOffset = 0;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.data = null;
    this.startOffset = 0;

    try {
      // Limit to first 1MB for performance
      const maxSize = 1024 * 1024;
      const size = Math.min(this.file.size, maxSize);
      const buffer = await this.file.slice(0, size).arrayBuffer();
      this.data = new Uint8Array(buffer);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load file';
    } finally {
      this.loading = false;
    }
  }

  private formatOffset(offset: number): string {
    return offset.toString(16).toUpperCase().padStart(8, '0');
  }

  private formatByte(byte: number): string {
    return byte.toString(16).toUpperCase().padStart(2, '0');
  }

  private getByteClass(byte: number): string {
    if (byte === 0) return 'byte null';
    if (byte >= 0x20 && byte <= 0x7e) return 'byte printable';
    if (byte < 0x20) return 'byte control';
    return 'byte high';
  }

  private toAscii(byte: number): string {
    if (byte >= 0x20 && byte <= 0x7e) {
      return String.fromCharCode(byte);
    }
    return '.';
  }

  private isPrintable(byte: number): boolean {
    return byte >= 0x20 && byte <= 0x7e;
  }

  private jumpToOffset(offset: string) {
    const parsed = parseInt(offset, 16);
    if (!isNaN(parsed) && this.data) {
      const maxOffset = Math.max(0, this.data.length - this.displayRows * this.bytesPerRow);
      this.startOffset = Math.min(Math.max(0, parsed), maxOffset);
      this.startOffset = Math.floor(this.startOffset / this.bytesPerRow) * this.bytesPerRow;
    }
  }

  private renderHeader() {
    const headers = [];
    for (let i = 0; i < this.bytesPerRow; i++) {
      headers.push(html`<span class="byte">${this.formatByte(i)}</span>`);
      if ((i + 1) % 8 === 0 && i < this.bytesPerRow - 1) {
        headers.push(html`<span class="byte-group"></span>`);
      }
    }

    return html`
      <div class="header-row">
        <div class="offset">${t('offset', 'Offset')}</div>
        <div class="hex-bytes">${headers}</div>
        <div class="ascii">${t('ascii', 'ASCII')}</div>
      </div>
    `;
  }

  private renderRow(offset: number) {
    if (!this.data) return null;

    const bytes = [];
    const asciiChars = [];

    for (let i = offset; i < offset + this.bytesPerRow; i++) {
      if (i < this.data.length) {
        const byte = this.data[i];
        bytes.push(html`<span class="${this.getByteClass(byte)}">${this.formatByte(byte)}</span>`);
        asciiChars.push(html`<span class="ascii-char ${this.isPrintable(byte) ? 'printable' : 'non-printable'}">${this.toAscii(byte)}</span>`);
      } else {
        bytes.push(html`<span class="byte">  </span>`);
        asciiChars.push(html`<span class="ascii-char"> </span>`);
      }
      
      if ((i - offset + 1) % 8 === 0 && i - offset < this.bytesPerRow - 1) {
        bytes.push(html`<span class="byte-group"></span>`);
      }
    }

    return html`
      <div class="hex-row">
        <div class="offset">${this.formatOffset(offset)}</div>
        <div class="hex-bytes">${bytes}</div>
        <div class="ascii">${asciiChars}</div>
      </div>
    `;
  }

  private renderToolbar() {
    const totalBytes = this.data?.length || 0;
    const fileSizeKB = this.file ? (this.file.size / 1024).toFixed(2) : '0';
    const loadedKB = (totalBytes / 1024).toFixed(2);

    return html`
      <div class="toolbar">
        <label>
          ${t('bytes-per-row', 'Bytes/Row')}:
          <select 
            .value=${String(this.bytesPerRow)}
            @change=${(e: Event) => this.bytesPerRow = parseInt((e.target as HTMLSelectElement).value)}
          >
            <option value="8">8</option>
            <option value="16">16</option>
            <option value="32">32</option>
          </select>
        </label>
        
        <label>
          ${t('jump-to', 'Jump to')}:
          <input 
            type="text" 
            class="jump-input"
            placeholder="0x00000000"
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                this.jumpToOffset((e.target as HTMLInputElement).value);
              }
            }}
          />
        </label>
        
        <div class="stats">
          ${t('loaded', 'Loaded')}: ${loadedKB} KB / ${fileSizeKB} KB
          ${this.file && this.file.size > 1024 * 1024 ? html`<span>(${t('truncated', 'truncated')})</span>` : null}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (!this.data) {
      return html`<div class="error">No data to display</div>`;
    }

    const rows = [];
    const totalRows = Math.ceil(this.data.length / this.bytesPerRow);
    const startRow = Math.floor(this.startOffset / this.bytesPerRow);
    const endRow = Math.min(startRow + this.displayRows, totalRows);

    for (let i = startRow; i < endRow; i++) {
      rows.push(this.renderRow(i * this.bytesPerRow));
    }

    return html`
      <div class="container">
        ${this.renderToolbar()}
        <div class="hex-content">
          ${this.renderHeader()}
          <div class="hex-table">
            ${rows}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'hex-viewer': HexViewer;
  }
}
