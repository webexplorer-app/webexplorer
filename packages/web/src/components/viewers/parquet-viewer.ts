import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parquetMetadataAsync, parquetReadObjects, type AsyncBuffer } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

const ROW_LIMIT = 200;

interface SchemaField {
  name: string;
  type: string;
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Uint8Array) return `<${value.byteLength} bytes>`;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    return JSON.stringify(value, (_key, nestedValue) => typeof nestedValue === 'bigint' ? nestedValue.toString() : nestedValue);
  }
  return String(value);
}

@customElement('parquet-viewer')
export class ParquetViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; color: var(--text, #222); }
    .summary { display: flex; gap: 1.5rem; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border, #ddd); background: var(--surface-alt, #f5f5f5); font-size: 0.875rem; }
    details { border-bottom: 1px solid var(--border, #ddd); }
    summary { cursor: pointer; padding: 0.75rem 1rem; font-weight: 600; }
    .schema { display: flex; flex-wrap: wrap; gap: 0.4rem; padding: 0 1rem 0.75rem; }
    .field { padding: 0.25rem 0.45rem; border: 1px solid var(--border, #ddd); border-radius: 4px; font-size: 0.8rem; background: var(--surface, #fff); }
    .field span { color: var(--text-secondary, #666); }
    .table-container { max-height: 75vh; overflow: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.5rem 0.65rem; border: 1px solid var(--border, #ddd); text-align: left; white-space: nowrap; max-width: 420px; overflow: hidden; text-overflow: ellipsis; }
    th { position: sticky; top: 0; z-index: 2; background: var(--surface-alt, #f5f5f5); }
    tbody tr:nth-child(even) { background: var(--surface-alt, #fafafa); }
    .row-number { position: sticky; left: 0; z-index: 1; min-width: 3rem; text-align: right; color: var(--text-secondary, #666); background: var(--surface-alt, #f5f5f5); }
    th.row-number { z-index: 3; }
    .status { display: grid; place-items: center; min-height: 300px; padding: 2rem; color: var(--text-secondary, #666); }
    .error { color: var(--error, #dc2626); }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private rows: Record<string, unknown>[] = [];
  @state() private columns: string[] = [];
  @state() private schema: SchemaField[] = [];
  @state() private totalRows = 0n;
  @state() private loading = true;
  @state() private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) void this.loadParquet(this.file);
  }

  private async loadParquet(file: File) {
    this.loading = true;
    this.error = null;

    try {
      const buffer = await file.arrayBuffer();
      const asyncBuffer: AsyncBuffer = {
        byteLength: buffer.byteLength,
        slice: async (start, end) => buffer.slice(start, end),
      };
      const metadata = await parquetMetadataAsync(asyncBuffer);
      const rows = await parquetReadObjects({ file: asyncBuffer, metadata, compressors, rowEnd: ROW_LIMIT });
      if (this.file !== file) return;

      this.rows = rows;
      this.totalRows = metadata.num_rows;
      this.schema = metadata.schema
        .filter(field => field.type !== undefined)
        .map(field => ({ name: field.name, type: String(field.type) }));
      this.columns = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    } catch (error) {
      if (this.file !== file) return;
      console.error('Failed to load Parquet file:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (this.file === file) this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('failed-to-load', 'Failed to load file')}: ${this.error}</div>`;

    return html`
      <div class="summary">
        <span>${this.totalRows.toLocaleString()} ${t('rows', 'rows')}</span>
        <span>${this.schema.length} ${t('columns', 'columns')}</span>
        ${this.totalRows > BigInt(ROW_LIMIT) ? html`<span>${t('showing-first', 'Showing first')} ${ROW_LIMIT}</span>` : null}
      </div>
      <details>
        <summary>${t('schema', 'Schema')}</summary>
        <div class="schema">${this.schema.map(field => html`<div class="field">${field.name} <span>${field.type}</span></div>`)}</div>
      </details>
      <div class="table-container">
        ${this.rows.length ? html`
          <table>
            <thead><tr><th class="row-number">#</th>${this.columns.map(column => html`<th>${column}</th>`)}</tr></thead>
            <tbody>${this.rows.map((row, index) => html`<tr><td class="row-number">${index + 1}</td>${this.columns.map(column => html`<td title=${formatCell(row[column])}>${formatCell(row[column])}</td>`)}</tr>`)}</tbody>
          </table>
        ` : html`<div class="status">${t('no-data', 'No data')}</div>`}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'parquet-viewer': ParquetViewer;
  }
}