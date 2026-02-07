import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { parse } from 'csv-parse/browser/esm';

@customElement('csv-viewer')
export class CSVViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .csv-viewer {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      padding: 0.5rem;
      text-align: left;
      border: 1px solid var(--border, #ddd);
      color: var(--text, #333);
    }
    th {
      background-color: var(--surface, #f5f5f5);
      font-weight: 600;
    }
    tr:hover {
      background-color: var(--surface-hover, #f9f9f9);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private records: string[][] = [];

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadCSV();
    }
  }

  private loadCSV() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const records: string[][] = [];
      const parser = parse(content, { comment: '#' });
      parser.on('data', (data: string[]) => {
        records.push(data);
      });
      parser.on('end', () => {
        this.records = records;
      });
    };
    reader.readAsText(this.file);
  }

  render() {
    if (this.records.length === 0) {
      return html`<loading-spinner></loading-spinner>`;
    }

    const [head, ...rows] = this.records;

    return html`
      <div class="csv-viewer">
        <table>
          <thead>
            <tr>
              ${head.map(cell => html`<th>${cell}</th>`)}
            </tr>
          </thead>
          <tbody>
            ${rows.map(row => html`
              <tr>
                ${row.map(cell => html`<td>${cell}</td>`)}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'csv-viewer': CSVViewer;
  }
}
