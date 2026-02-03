import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import * as XLSX from 'xlsx';
import { t } from '../../common/Localization';

interface SheetData {
  name: string;
  data: string[][];
}

@customElement('excel-viewer')
export class ExcelViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .excel-viewer {
      margin: 1rem;
    }
    .sheet-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--border, #ddd);
      overflow-x: auto;
      margin-bottom: 0;
    }
    .sheet-tab {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ddd);
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      background: var(--surface, white);
      color: var(--text, #333);
      cursor: pointer;
      white-space: nowrap;
      margin-right: -1px;
    }
    .sheet-tab:hover {
      background: var(--surface-hover, #f0f0f0);
    }
    .sheet-tab.active {
      background: var(--primary, #0066CC);
      color: white;
      border-color: var(--primary, #0066CC);
    }
    .table-container {
      overflow: auto;
      max-height: calc(100vh - 12rem);
      border: 1px solid var(--border, #ddd);
      border-top: none;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th, td {
      padding: 0.5rem;
      border: 1px solid var(--border, #ddd);
      text-align: left;
      white-space: nowrap;
    }
    th {
      background: var(--surface-alt, #f5f5f5);
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    tr:nth-child(even) {
      background: var(--surface-alt, #f9f9f9);
    }
    tr:hover {
      background: var(--surface-hover, #f0f0f0);
    }
    .row-number {
      background: var(--surface-alt, #f5f5f5);
      color: var(--text-secondary, #666);
      font-weight: 500;
      text-align: center;
      min-width: 3rem;
      position: sticky;
      left: 0;
      z-index: 1;
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
    .empty-message {
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private sheets: SheetData[] = [];

  @state()
  private activeSheet = 0;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadWorkbook();
    }
  }

  private async loadWorkbook() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      this.sheets = workbook.SheetNames.map(name => {
        const sheet = workbook.Sheets[name];
        const data = XLSX.utils.sheet_to_json<string[]>(sheet, { 
          header: 1,
          defval: '',
        });
        return { name, data: data as string[][] };
      });
      
      this.activeSheet = 0;
      this.loading = false;
    } catch (e) {
      console.error('Failed to load Excel file:', e);
      this.error = `Failed to load spreadsheet: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private getColumnLabel(index: number): string {
    let label = '';
    let n = index;
    while (n >= 0) {
      label = String.fromCharCode((n % 26) + 65) + label;
      n = Math.floor(n / 26) - 1;
    }
    return label;
  }

  render() {
    if (!this.file) {
      return html`<div class="excel-viewer">No file selected</div>`;
    }

    if (this.loading) {
      return html`<div class="excel-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="excel-viewer"><div class="error">${this.error}</div></div>`;
    }

    const currentSheet = this.sheets[this.activeSheet];
    const maxCols = currentSheet?.data.reduce((max, row) => Math.max(max, row.length), 0) || 0;

    return html`
      <div class="excel-viewer">
        ${this.sheets.length > 1 ? html`
          <div class="sheet-tabs">
            ${this.sheets.map((sheet, index) => html`
              <button 
                class="sheet-tab ${index === this.activeSheet ? 'active' : ''}"
                @click=${() => this.activeSheet = index}
              >
                ${sheet.name}
              </button>
            `)}
          </div>
        ` : null}
        
        <div class="table-container">
          ${currentSheet && currentSheet.data.length > 0 ? html`
            <table>
              <thead>
                <tr>
                  <th class="row-number">#</th>
                  ${Array.from({ length: maxCols }, (_, i) => html`
                    <th>${this.getColumnLabel(i)}</th>
                  `)}
                </tr>
              </thead>
              <tbody>
                ${currentSheet.data.map((row, rowIndex) => html`
                  <tr>
                    <td class="row-number">${rowIndex + 1}</td>
                    ${Array.from({ length: maxCols }, (_, colIndex) => html`
                      <td>${row[colIndex] ?? ''}</td>
                    `)}
                  </tr>
                `)}
              </tbody>
            </table>
          ` : html`
            <div class="empty-message">${t('empty-sheet', 'This sheet is empty')}</div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'excel-viewer': ExcelViewer;
  }
}
