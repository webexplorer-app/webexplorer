import { css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

const MAX_CELLS = 500;
const MAX_OUTPUT_LENGTH = 500_000;

interface NotebookOutput {
  output_type?: string;
  name?: string;
  text?: string | string[];
  data?: Record<string, unknown>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface NotebookCell {
  cell_type?: string;
  execution_count?: number | null;
  source?: string | string[];
  outputs?: NotebookOutput[];
}

interface Notebook {
  nbformat?: number;
  nbformat_minor?: number;
  metadata?: {
    kernelspec?: { display_name?: string; language?: string };
    language_info?: { name?: string; version?: string };
  };
  cells?: NotebookCell[];
}

function joinedText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(part => typeof part === 'string')) return value.join('');
  return '';
}

function limitedText(value: unknown): string {
  const text = joinedText(value);
  return text.length > MAX_OUTPUT_LENGTH
    ? `${text.slice(0, MAX_OUTPUT_LENGTH)}\n[Output truncated]`
    : text;
}

@customElement('notebook-viewer')
export class NotebookViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; color: var(--text, #222); }
    .summary { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border, #ddd); background: var(--surface, #f5f5f5); color: var(--text-secondary, #666); font-size: 0.85rem; }
    .notebook { width: min(100%, 980px); margin: 0 auto; padding: 1rem; box-sizing: border-box; }
    .cell { display: grid; grid-template-columns: 4.5rem minmax(0, 1fr); margin-bottom: 1rem; }
    .prompt { padding: 0.75rem 0.75rem 0 0; color: var(--text-secondary, #666); font: 0.78rem/1.5 var(--font-mono, ui-monospace, Consolas, monospace); text-align: right; }
    .content { min-width: 0; border: 1px solid var(--border, #ddd); border-radius: 4px; overflow: hidden; background: var(--background, #fff); }
    .cell-label { padding: 0.35rem 0.75rem; border-bottom: 1px solid var(--border-light, #eee); background: var(--surface, #f7f7f7); color: var(--text-secondary, #666); font-size: 0.75rem; text-transform: capitalize; }
    pre { box-sizing: border-box; max-width: 100%; margin: 0; padding: 0.8rem 1rem; overflow: auto; white-space: pre-wrap; overflow-wrap: anywhere; font: 0.85rem/1.55 var(--font-mono, ui-monospace, Consolas, monospace); }
    .markdown { padding: 0.9rem 1rem; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.6; }
    .output { border-top: 1px solid var(--border-light, #eee); background: var(--background-alt, #fafafa); }
    .output.error pre { color: var(--error, #b91c1c); }
    .output img { display: block; max-width: 100%; max-height: 70vh; margin: 0 auto; padding: 1rem; box-sizing: border-box; object-fit: contain; }
    .output iframe { display: block; width: 100%; min-height: 240px; border: 0; background: white; }
    .status { display: grid; min-height: 280px; place-items: center; padding: 2rem; color: var(--text-secondary, #666); text-align: center; }
    .error { color: var(--error, #b91c1c); }
    @media (max-width: 640px) {
      .notebook { padding: 0.75rem; }
      .cell { grid-template-columns: 1fr; }
      .prompt { padding: 0 0 0.25rem; text-align: left; }
    }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private notebook: Notebook | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) void this.loadNotebook(this.file);
  }

  private async loadNotebook(file: File) {
    this.loading = true;
    this.error = null;
    this.notebook = null;
    try {
      const parsed = JSON.parse(await file.text()) as Notebook;
      if (!Array.isArray(parsed.cells) || typeof parsed.nbformat !== 'number') {
        throw new Error('This is not a valid Jupyter notebook');
      }
      if (this.file === file) this.notebook = parsed;
    } catch (error) {
      if (this.file === file) this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (this.file === file) this.loading = false;
    }
  }

  private renderOutput(output: NotebookOutput) {
    const data = output.data || {};
    const png = joinedText(data['image/png']).replace(/\s/g, '');
    const jpeg = joinedText(data['image/jpeg']).replace(/\s/g, '');
    if (png) return html`<div class="output"><img src=${`data:image/png;base64,${png}`} alt="Notebook output"></div>`;
    if (jpeg) return html`<div class="output"><img src=${`data:image/jpeg;base64,${jpeg}`} alt="Notebook output"></div>`;

    const htmlOutput = limitedText(data['text/html']);
    if (htmlOutput) return html`<div class="output"><iframe sandbox referrerpolicy="no-referrer" .srcdoc=${htmlOutput} title="Notebook HTML output"></iframe></div>`;

    const text = limitedText(output.text) || limitedText(data['text/plain']);
    if (text) return html`<div class="output"><pre>${text}</pre></div>`;

    if (output.output_type === 'error') {
      const traceback = limitedText(output.traceback);
      const message = traceback || `${output.ename || 'Error'}: ${output.evalue || ''}`;
      return html`<div class="output error"><pre>${message}</pre></div>`;
    }
    return nothing;
  }

  private renderCell(cell: NotebookCell, index: number) {
    const type = cell.cell_type || 'unknown';
    const source = limitedText(cell.source);
    const prompt = type === 'code'
      ? `[${cell.execution_count ?? ' '}]`
      : `${index + 1}`;
    return html`
      <article class="cell">
        <div class="prompt">${prompt}</div>
        <div class="content">
          <div class="cell-label">${type}</div>
          ${type === 'markdown'
            ? html`<div class="markdown">${source}</div>`
            : html`<pre>${source}</pre>`}
          ${(cell.outputs || []).map(output => this.renderOutput(output))}
        </div>
      </article>
    `;
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('failed-to-load', 'Failed to load file')}: ${this.error}</div>`;
    if (!this.notebook?.cells) return html`<div class="status">${t('no-data', 'No data')}</div>`;

    const cells = this.notebook.cells.slice(0, MAX_CELLS);
    const language = this.notebook.metadata?.kernelspec?.display_name
      || this.notebook.metadata?.language_info?.name
      || t('unknown', 'Unknown');
    return html`
      <div class="summary">
        <span>${cells.length} ${t('cells', 'cells')}</span>
        <span>${language}</span>
        <span>nbformat ${this.notebook.nbformat}.${this.notebook.nbformat_minor ?? 0}</span>
        ${this.notebook.cells.length > MAX_CELLS ? html`<span>${t('showing-first', 'Showing first')} ${MAX_CELLS}</span>` : nothing}
      </div>
      <main class="notebook">${cells.map((cell, index) => this.renderCell(cell, index))}</main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'notebook-viewer': NotebookViewer;
  }
}