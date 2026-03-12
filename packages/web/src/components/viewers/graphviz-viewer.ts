import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import type { Engine } from '@hpcc-js/wasm-graphviz';

@customElement('graphviz-viewer')
export class GraphvizViewer extends LocalizedLitElement {
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

    .toolbar select {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 0.8125rem;
      background: var(--background, #fff);
      color: var(--text-primary, #333);
    }

    .toolbar label {
      font-size: 0.8125rem;
      color: var(--text-secondary, #666);
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
  private engine: Engine = 'dot';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDiagram();
    }
    if (changedProperties.has('engine') && this.sourceText) {
      this.renderGraph();
    }
  }

  private async loadDiagram() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;
      await this.renderGraph();
    } catch (e) {
      console.error('Failed to load graphviz file:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private async renderGraph() {
    try {
      this.loading = true;
      const { Graphviz } = await import('@hpcc-js/wasm-graphviz');
      const graphviz = await Graphviz.load();
      this.svgContent = graphviz.layout(this.sourceText, 'svg', this.engine);
      this.loading = false;
    } catch (e) {
      console.error('Failed to render graphviz:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private handleEngineChange(e: Event) {
    this.engine = (e.target as HTMLSelectElement).value as Engine;
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
          <label>Engine:</label>
          <select @change=${this.handleEngineChange}>
            <option value="dot" ?selected=${this.engine === 'dot'}>dot</option>
            <option value="neato" ?selected=${this.engine === 'neato'}>neato</option>
            <option value="fdp" ?selected=${this.engine === 'fdp'}>fdp</option>
            <option value="sfdp" ?selected=${this.engine === 'sfdp'}>sfdp</option>
            <option value="twopi" ?selected=${this.engine === 'twopi'}>twopi</option>
            <option value="circo" ?selected=${this.engine === 'circo'}>circo</option>
          </select>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : ''}
        <div class="diagram-container ${this.showSource ? 'hidden' : ''}" .innerHTML=${this.svgContent}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'graphviz-viewer': GraphvizViewer;
  }
}
