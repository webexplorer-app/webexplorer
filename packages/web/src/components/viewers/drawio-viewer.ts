import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('drawio-viewer')
export class DrawioViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .toolbar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      position: sticky;
      top: 0;
      z-index: 10;
      align-items: center;
    }

    .toolbar button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      background: var(--background, #fff);
      color: var(--text-primary, #333);
      border-radius: 4px;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar button:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    .toolbar button.active {
      background: var(--primary, #3b82f6);
      color: white;
      border-color: var(--primary, #3b82f6);
    }

    .toolbar .page-info {
      margin-left: auto;
      font-size: 0.8125rem;
      color: var(--text-muted, #666);
    }

    .viewer-container {
      width: 100%;
      height: calc(100vh - 120px);
      border: none;
      background: white;
    }

    .viewer-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .source-container {
      padding: 1rem;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875rem;
      line-height: 1.6;
      white-space: pre-wrap;
      background: var(--surface-alt, #f5f5f5);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      margin: 1rem;
      overflow: auto;
      max-height: 80vh;
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
      margin: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 4px;
    }

    .hidden {
      display: none;
    }

    .diagram-container {
      padding: 2rem;
      overflow: auto;
      background: white;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
    }

    .page-container {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 1rem;
      background: white;
    }

    .page-container svg {
      max-width: 100%;
      height: auto;
    }

    .page-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
      text-align: center;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private sourceText = '';

  @state()
  private showSource = false;

  @state()
  private pages: { name: string; svg: string }[] = [];

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDiagram();
    }
  }

  private async loadDiagram() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;
      this.pages = await this.parseDrawio(text);
      this.loading = false;
    } catch (e) {
      console.error('Failed to parse drawio file:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private async parseDrawio(xmlText: string): Promise<{ name: string; svg: string }[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const pages: { name: string; svg: string }[] = [];

    // Get all diagram elements
    const diagrams = doc.querySelectorAll('diagram');
    if (diagrams.length === 0) {
      // Might be a plain mxGraphModel
      const model = doc.querySelector('mxGraphModel');
      if (model) {
        pages.push({
          name: 'Page 1',
          svg: this.renderMxGraph(model),
        });
      }
      return pages;
    }

    for (let index = 0; index < diagrams.length; index++) {
      const diagram = diagrams[index];
      const name = diagram.getAttribute('name') || `Page ${index + 1}`;
      const model = diagram.querySelector('mxGraphModel');
      if (model) {
        pages.push({
          name,
          svg: this.renderMxGraph(model),
        });
      } else {
        // Compressed content — decode
        const content = diagram.textContent?.trim();
        if (content) {
          try {
            const decoded = await this.decodeDrawioContent(content);
            const innerDoc = parser.parseFromString(decoded, 'text/xml');
            const innerModel = innerDoc.querySelector('mxGraphModel');
            if (innerModel) {
              pages.push({
                name,
                svg: this.renderMxGraph(innerModel),
              });
            }
          } catch {
            pages.push({ name, svg: `<p>Could not decode page content</p>` });
          }
        }
      }
    }

    return pages;
  }

  private async decodeDrawioContent(encoded: string): Promise<string> {
    // draw.io uses URL-encoded, base64-encoded, pako-deflated content
    try {
      const decoded = atob(encoded);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // Try pako-style inflate (raw deflate)
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();

      const response = new Response(ds.readable);
      const text = await response.text();
      return decodeURIComponent(text);
    } catch {
      // If decompression fails, try just base64 + URI decode
      try {
        return decodeURIComponent(atob(encoded));
      } catch {
        return atob(encoded);
      }
    }
  }

  private renderMxGraph(model: Element): string {
    // Simple SVG rendering of mxGraph cells
    const cells = model.querySelectorAll('mxCell');
    const svgParts: string[] = [];
    let maxX = 400;
    let maxY = 300;

    cells.forEach(cell => {
      const geometry = cell.querySelector('mxGeometry');
      const value = cell.getAttribute('value') || '';
      const style = cell.getAttribute('style') || '';
      const vertex = cell.getAttribute('vertex') === '1';
      const edge = cell.getAttribute('edge') === '1';

      if (vertex && geometry) {
        const x = parseFloat(geometry.getAttribute('x') || '0');
        const y = parseFloat(geometry.getAttribute('y') || '0');
        const w = parseFloat(geometry.getAttribute('width') || '80');
        const h = parseFloat(geometry.getAttribute('height') || '40');

        maxX = Math.max(maxX, x + w + 20);
        maxY = Math.max(maxY, y + h + 20);

        let fill = '#fff';
        let stroke = '#333';
        let rx = '4';

        // Basic style parsing
        if (style.includes('fillColor=')) {
          const m = style.match(/fillColor=([^;]+)/);
          if (m) fill = m[1];
        }
        if (style.includes('strokeColor=')) {
          const m = style.match(/strokeColor=([^;]+)/);
          if (m) stroke = m[1];
        }
        if (style.includes('rounded=1') || style.includes('ellipse')) {
          rx = style.includes('ellipse') ? String(Math.min(w, h) / 2) : '8';
        }

        if (style.includes('ellipse')) {
          svgParts.push(
            `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${this.escapeXml(fill)}" stroke="${this.escapeXml(stroke)}" stroke-width="1.5"/>`,
            `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-size="12" font-family="sans-serif" fill="#333">${this.escapeXml(this.stripHtml(value))}</text>`
          );
        } else {
          svgParts.push(
            `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${this.escapeXml(fill)}" stroke="${this.escapeXml(stroke)}" stroke-width="1.5"/>`,
            `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="central" font-size="12" font-family="sans-serif" fill="#333">${this.escapeXml(this.stripHtml(value))}</text>`
          );
        }
      }

      if (edge) {
        const source = cell.getAttribute('source');
        const target = cell.getAttribute('target');
        // Draw edge using geometry points or fallback to simple mid-point
        const points = geometry?.querySelectorAll('mxPoint');
        if (points && points.length >= 2) {
          const coords = Array.from(points).map(p => ({
            x: parseFloat(p.getAttribute('x') || '0'),
            y: parseFloat(p.getAttribute('y') || '0'),
          }));
          const pathData = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x} ${c.y}`).join(' ');
          svgParts.push(
            `<path d="${pathData}" fill="none" stroke="#333" stroke-width="1.5" marker-end="url(#arrowhead)"/>`
          );
        } else if (source && target) {
          // Edges without explicit points — will be handled by layout
          svgParts.push(
            `<!-- edge from ${this.escapeXml(source)} to ${this.escapeXml(target)} -->`
          );
        }

        // Edge label
        if (value) {
          const labelX = geometry?.getAttribute('x') || '0';
          const labelY = geometry?.getAttribute('y') || '0';
          svgParts.push(
            `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="11" font-family="sans-serif" fill="#666">${this.escapeXml(this.stripHtml(value))}</text>`
          );
        }
      }
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX} ${maxY}" width="${maxX}" height="${maxY}">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#333"/>
        </marker>
      </defs>
      ${svgParts.join('\n')}
    </svg>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private stripHtml(str: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = str;
    return tmp.textContent || tmp.innerText || '';
  }

  render() {
    if (!this.file) {
      return html`<div>${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">${this.error}</div>
        ${this.sourceText ? html`<div class="source-container">${this.sourceText}</div>` : ''}
      `;
    }

    return html`
      <div>
        <div class="toolbar">
          <button class=${!this.showSource ? 'active' : ''} @click=${() => this.showSource = false}>
            ${t('preview', 'Preview')}
          </button>
          <button class=${this.showSource ? 'active' : ''} @click=${() => this.showSource = true}>
            ${t('text', 'Text')}
          </button>
          <span class="page-info">${this.pages.length} page(s)</span>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : ''}
        <div class="diagram-container ${this.showSource ? 'hidden' : ''}">
          ${this.pages.map(page => html`
            <div class="page-container">
              ${this.pages.length > 1 ? html`<div class="page-title">${page.name}</div>` : ''}
              <div .innerHTML=${page.svg}></div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'drawio-viewer': DrawioViewer;
  }
}
