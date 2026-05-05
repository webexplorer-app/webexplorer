import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqlJsDatabase = any;

interface TableInfo {
  name: string;
  columns: string[];
  rowCount: number;
}

@customElement('sqlite-viewer')
export class SqliteViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .sqlite-viewer {
    }
    .sqlite-container {
      display: flex;
      gap: 1rem;
    }
    .table-list {
      width: 200px;
      flex-shrink: 0;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      background: var(--surface-alt, #f5f5f5);
    }
    .table-list-header {
      padding: 0.75rem 1rem;
      font-weight: 600;
      border-bottom: 1px solid var(--border, #ddd);
      color: var(--text, #333);
    }
    .table-item {
      padding: 0.5rem 1rem;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-light, #eee);
      color: var(--text, #333);
    }
    .table-item:hover {
      background: var(--surface-hover, #e8e8e8);
    }
    .table-item.active {
      background: var(--primary, #0066CC);
      color: white;
    }
    .table-name {
      font-size: 0.875rem;
    }
    .row-count {
      font-size: 0.75rem;
      opacity: 0.7;
    }
    .data-view {
      flex: 1;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      overflow: hidden;
    }
    .data-header {
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .data-header h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--text, #333);
    }
    .data-info {
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }
    .table-container {
      overflow-x: auto;
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
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    th {
      background: var(--surface-alt, #f5f5f5);
      font-weight: 600;
      position: sticky;
      top: 0;
      z-index: 1;
      color: var(--text, #333);
    }
    td {
      background: var(--background, white);
      color: var(--text, #333);
    }
    tr:nth-child(even) td {
      background: var(--surface-alt, #f9f9f9);
    }
    tr:hover td {
      background: var(--surface-hover, #f0f0f0);
    }
    .null-value {
      color: var(--text-muted, #999);
      font-style: italic;
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
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private tables: TableInfo[] = [];

  @state()
  private selectedTable: string | null = null;

  @state()
  private tableData: { columns: string[]; rows: unknown[][] } | null = null;

  private db: SqlJsDatabase | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDatabase();
    }
  }

  private async loadDatabase() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      // Initialize SQL.js
      // @ts-expect-error - sql.js doesn't have type declarations
      const initSqlJs = (await import('sql.js')).default;
      const SQL = await initSqlJs({
        locateFile: () => sqlWasmUrl
      });

      // Read file and create database
      const arrayBuffer = await this.file.arrayBuffer();
      this.db = new SQL.Database(new Uint8Array(arrayBuffer));

      // Get list of tables
      const tablesResult = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );

      if (tablesResult.length > 0) {
        const tableNames = tablesResult[0].values.map((row: unknown[]) => row[0] as string);
        
        this.tables = tableNames.map((name: string) => {
          // Get column info
          const columnsResult = this.db!.exec(`PRAGMA table_info("${name}")`);
          const columns = columnsResult.length > 0 
            ? columnsResult[0].values.map((row: unknown[]) => row[1] as string)
            : [];
          
          // Get row count
          const countResult = this.db!.exec(`SELECT COUNT(*) FROM "${name}"`);
          const rowCount = countResult.length > 0 
            ? countResult[0].values[0][0] as number
            : 0;

          return { name, columns, rowCount };
        });

        // Select first table
        if (this.tables.length > 0) {
          this.selectTable(this.tables[0].name);
        }
      }

      this.loading = false;
    } catch (e) {
      console.error('Failed to load SQLite database:', e);
      this.error = `${t('loading-failure', 'Failed to load database')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private selectTable(tableName: string) {
    if (!this.db) return;

    this.selectedTable = tableName;

    try {
      // Get first 1000 rows
      const result = this.db.exec(`SELECT * FROM "${tableName}" LIMIT 1000`);
      
      if (result.length > 0) {
        this.tableData = {
          columns: result[0].columns,
          rows: result[0].values,
        };
      } else {
        this.tableData = { columns: [], rows: [] };
      }
    } catch (e) {
      console.error('Failed to query table:', e);
      this.tableData = null;
    }
  }

  private formatValue(value: unknown): string {
    if (value === null) return 'NULL';
    if (typeof value === 'object') {
      if (value instanceof Uint8Array) {
        return `[BLOB: ${value.length} bytes]`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  render() {
    if (!this.file) {
      return html`<div class="sqlite-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="sqlite-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="sqlite-viewer"><div class="error">${this.error}</div></div>`;
    }

    const selectedTableInfo = this.tables.find(t => t.name === this.selectedTable);

    return html`
      <div class="sqlite-viewer">
        <div class="sqlite-container">
          <div class="table-list">
            <div class="table-list-header">${t('tables', 'Tables')} (${this.tables.length})</div>
            ${this.tables.map(table => html`
              <div 
                class="table-item ${table.name === this.selectedTable ? 'active' : ''}"
                @click=${() => this.selectTable(table.name)}
              >
                <span class="table-name">${table.name}</span>
                <span class="row-count">${table.rowCount}</span>
              </div>
            `)}
          </div>
          
          <div class="data-view">
            ${this.selectedTable && this.tableData ? html`
              <div class="data-header">
                <h3>${this.selectedTable}</h3>
                <span class="data-info">
                  ${selectedTableInfo?.rowCount} ${t('rows', 'rows')}, 
                  ${this.tableData.columns.length} ${t('columns', 'columns')}
                </span>
              </div>
              <div class="table-container">
                ${this.tableData.rows.length > 0 ? html`
                  <table>
                    <thead>
                      <tr>
                        ${this.tableData.columns.map(col => html`<th>${col}</th>`)}
                      </tr>
                    </thead>
                    <tbody>
                      ${this.tableData.rows.map(row => html`
                        <tr>
                          ${row.map(value => html`
                            <td class="${value === null ? 'null-value' : ''}" title="${this.formatValue(value)}">
                              ${this.formatValue(value)}
                            </td>
                          `)}
                        </tr>
                      `)}
                    </tbody>
                  </table>
                ` : html`
                  <div class="empty-message">${t('empty-table', 'This table is empty')}</div>
                `}
              </div>
            ` : html`
              <div class="empty-message">${t('select-table', 'Select a table to view data')}</div>
            `}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sqlite-viewer': SqliteViewer;
  }
}
