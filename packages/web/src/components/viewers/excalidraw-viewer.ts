import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

// Simple Excalidraw renderer — renders elements to SVG without React dependency
@customElement('excalidraw-viewer')
export class ExcalidrawViewer extends LocalizedLitElement {
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

    .toolbar .info {
      margin-left: auto;
      font-size: 0.8125rem;
      color: var(--text-muted, #666);
    }

    .diagram-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      overflow: auto;
      background: white;
      min-height: 300px;
    }

    .diagram-container svg {
      max-width: 100%;
      height: auto;
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
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private svgContent = '';

  @state()
  private sourceText = '';

  @state()
  private showSource = false;

  @state()
  private elementCount = 0;

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
      const data = JSON.parse(text);
      const elements = data.elements || [];
      this.elementCount = elements.filter((e: { isDeleted?: boolean }) => !e.isDeleted).length;
      this.svgContent = this.renderExcalidraw(data);
      this.loading = false;
    } catch (e) {
      console.error('Failed to parse excalidraw file:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private renderExcalidraw(data: ExcalidrawData): string {
    const elements = (data.elements || []).filter(e => !e.isDeleted);
    if (elements.length === 0) {
      return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="50" text-anchor="middle" fill="#666">Empty diagram</text></svg>';
    }

    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      const x1 = el.x;
      const y1 = el.y;
      const x2 = el.x + (el.width || 0);
      const y2 = el.y + (el.height || 0);
      minX = Math.min(minX, x1);
      minY = Math.min(minY, y1);
      maxX = Math.max(maxX, x2);
      maxY = Math.max(maxY, y2);
    }

    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    const width = maxX - minX;
    const height = maxY - minY;

    const svgElements: string[] = [];

    for (const el of elements) {
      const stroke = el.strokeColor || '#000000';
      const fill = el.backgroundColor === 'transparent' ? 'none' : (el.backgroundColor || 'none');
      const sw = el.strokeWidth || 1;
      const opacity = el.opacity != null ? el.opacity / 100 : 1;

      switch (el.type) {
        case 'rectangle':
          svgElements.push(
            `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${this.esc(fill)}" stroke="${this.esc(stroke)}" stroke-width="${sw}" rx="4" opacity="${opacity}"/>`
          );
          break;
        case 'ellipse':
          svgElements.push(
            `<ellipse cx="${el.x + (el.width || 0) / 2}" cy="${el.y + (el.height || 0) / 2}" rx="${(el.width || 0) / 2}" ry="${(el.height || 0) / 2}" fill="${this.esc(fill)}" stroke="${this.esc(stroke)}" stroke-width="${sw}" opacity="${opacity}"/>`
          );
          break;
        case 'diamond': {
          const cx = el.x + (el.width || 0) / 2;
          const cy = el.y + (el.height || 0) / 2;
          svgElements.push(
            `<polygon points="${cx},${el.y} ${el.x + (el.width || 0)},${cy} ${cx},${el.y + (el.height || 0)} ${el.x},${cy}" fill="${this.esc(fill)}" stroke="${this.esc(stroke)}" stroke-width="${sw}" opacity="${opacity}"/>`
          );
          break;
        }
        case 'line':
        case 'arrow': {
          const points = el.points || [];
          if (points.length >= 2) {
            const pathData = points.map((p: number[], i: number) =>
              `${i === 0 ? 'M' : 'L'}${el.x + p[0]} ${el.y + p[1]}`
            ).join(' ');
            const marker = el.type === 'arrow' ? ' marker-end="url(#excalidraw-arrowhead)"' : '';
            svgElements.push(
              `<path d="${pathData}" fill="none" stroke="${this.esc(stroke)}" stroke-width="${sw}" opacity="${opacity}"${marker}/>`
            );
          }
          break;
        }
        case 'freedraw': {
          const points = el.points || [];
          if (points.length >= 2) {
            const pathData = points.map((p: number[], i: number) =>
              `${i === 0 ? 'M' : 'L'}${el.x + p[0]} ${el.y + p[1]}`
            ).join(' ');
            svgElements.push(
              `<path d="${pathData}" fill="none" stroke="${this.esc(stroke)}" stroke-width="${sw}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`
            );
          }
          break;
        }
        case 'text':
          svgElements.push(
            `<text x="${el.x}" y="${el.y + (el.height || 16) * 0.8}" font-size="${el.fontSize || 16}" font-family="${el.fontFamily === 1 ? 'Virgil, cursive' : el.fontFamily === 2 ? 'Cascadia, monospace' : 'sans-serif'}" fill="${this.esc(stroke)}" opacity="${opacity}">${this.esc(el.text || '')}</text>`
          );
          break;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${Math.min(width, 1200)}" height="${Math.min(height, 800)}">
      <defs>
        <marker id="excalidraw-arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#000"/>
        </marker>
      </defs>
      <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="white"/>
      ${svgElements.join('\n')}
    </svg>`;
  }

  private esc(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
          <span class="info">${this.elementCount} element(s)</span>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : ''}
        <div class="diagram-container ${this.showSource ? 'hidden' : ''}" .innerHTML=${this.svgContent}></div>
      </div>
    `;
  }
}

interface ExcalidrawElement {
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  opacity?: number;
  isDeleted?: boolean;
  points?: number[][];
  text?: string;
  fontSize?: number;
  fontFamily?: number;
}

interface ExcalidrawData {
  elements: ExcalidrawElement[];
}

declare global {
  interface HTMLElementTagNameMap {
    'excalidraw-viewer': ExcalidrawViewer;
  }
}
