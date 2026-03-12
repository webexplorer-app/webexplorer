import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('vega-viewer')
export class VegaViewer extends LocalizedLitElement {
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

    .chart-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
      overflow: auto;
      background: white;
      min-height: 300px;
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
  private sourceText = '';

  @state()
  private showSource = false;

  @state()
  private specType: 'vega' | 'vega-lite' = 'vega-lite';

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadChart();
    }
  }

  private async loadChart() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;
      const spec = JSON.parse(text);

      // Detect spec type
      if (spec.$schema) {
        if (spec.$schema.includes('vega-lite')) {
          this.specType = 'vega-lite';
        } else {
          this.specType = 'vega';
        }
      } else {
        // Heuristic: vega-lite specs have "mark" at the top level
        this.specType = spec.mark || spec.layer || spec.hconcat || spec.vconcat ? 'vega-lite' : 'vega';
      }

      this.loading = false;

      // Wait for render, then embed chart
      await this.updateComplete;
      this.renderChart(spec);
    } catch (e) {
      console.error('Failed to parse vega spec:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private async renderChart(spec: unknown) {
    const container = this.shadowRoot?.querySelector('.chart-render') as HTMLDivElement;
    if (!container) return;

    try {
      const vegaEmbed = (await import('vega-embed')).default;
      await vegaEmbed(container, spec as Record<string, unknown>, {
        renderer: 'svg',
        actions: {
          export: true,
          source: false,
          compiled: false,
          editor: false,
        },
      });
    } catch (e) {
      console.error('Failed to render vega chart:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }
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
          <span class="info">${this.specType === 'vega-lite' ? 'Vega-Lite' : 'Vega'}</span>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : ''}
        <div class="chart-container ${this.showSource ? 'hidden' : ''}"><div class="chart-render"></div></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'vega-viewer': VegaViewer;
  }
}
