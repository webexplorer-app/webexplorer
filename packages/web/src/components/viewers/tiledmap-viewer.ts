import { Application, type Container } from 'pixi.js';
import { loadTiledMapAsset, type FetchFn } from 'pixi-tiledmap';
import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';

const MIN_SCALE = 0.05;
const MAX_SCALE = 16;

@customElement('tiledmap-viewer')
export class TiledMapViewer extends LocalizedLitElement {
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
      align-items: center;
    }

    button {
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      background: var(--background, #fff);
      color: var(--text-primary, #333);
      border-radius: 4px;
      font: inherit;
      font-size: 0.8125rem;
      cursor: pointer;
    }

    button:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    button.active {
      background: var(--primary, #3b82f6);
      color: white;
      border-color: var(--primary, #3b82f6);
    }

    .info {
      margin-left: auto;
      color: var(--text-muted, #666);
      font-size: 0.8125rem;
    }

    .viewport {
      width: 100%;
      height: calc(100vh - 120px);
      min-height: 400px;
      overflow: hidden;
      background:
        linear-gradient(45deg, #ddd 25%, transparent 25%),
        linear-gradient(-45deg, #ddd 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ddd 75%),
        linear-gradient(-45deg, transparent 75%, #ddd 75%);
      background-color: #eee;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
      background-size: 16px 16px;
      cursor: grab;
      touch-action: none;
    }

    .viewport.dragging {
      cursor: grabbing;
    }

    .source {
      padding: 1rem;
      margin: 1rem;
      max-height: 80vh;
      overflow: auto;
      white-space: pre-wrap;
      background: var(--surface-alt, #f5f5f5);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .loading {
      padding: 2rem;
      text-align: center;
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
  private loading = false;

  @state()
  private error: string | null = null;

  @state()
  private sourceText = '';

  @state()
  private showSource = false;

  @state()
  private mapInfo = '';

  @state()
  private dragging = false;

  private app: Application | null = null;
  private mapContainer: Container | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private dragPointerId: number | null = null;
  private dragX = 0;
  private dragY = 0;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file')) {
      void this.loadMap();
    }
  }

  disconnectedCallback() {
    this.destroyRenderer();
    super.disconnectedCallback();
  }

  private async loadMap() {
    this.destroyRenderer();
    this.error = null;
    this.sourceText = '';
    this.mapInfo = '';
    this.showSource = false;

    const file = this.file;
    if (!file) return;

    this.loading = true;

    try {
      this.sourceText = await file.text();
      if (this.file !== file) return;

      await this.updateComplete;
      const viewport = this.shadowRoot?.querySelector('.viewport') as HTMLDivElement | null;
      if (!viewport) {
        throw new Error('Map viewport is unavailable');
      }

      const app = new Application();
      await app.init({
        resizeTo: viewport,
        antialias: true,
        backgroundAlpha: 0,
      });
      if (this.file !== file) {
        app.destroy(true, { children: true });
        return;
      }

      viewport.appendChild(app.canvas);
      this.app = app;

      const mapUrl = new URL(encodeURIComponent(file.name), 'https://tiledmap.webexplorer.invalid/').href;
      const fetchMapFile: FetchFn = async input => {
        const requestUrl = typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;

        if (requestUrl !== mapUrl) {
          throw new Error(`External Tiled asset is unavailable: ${requestUrl}`);
        }

        return new Response(file, {
          headers: { 'Content-Type': file.type || 'application/octet-stream' },
        });
      };
      const asset = await loadTiledMapAsset(mapUrl, { fetchFn: fetchMapFile });
      if (this.file !== file) {
        asset.container.destroy({ children: true });
        return;
      }

      this.mapContainer = asset.container;
      app.stage.addChild(asset.container);

      const { width, height, tilewidth, tileheight, orientation, layers } = asset.mapData;
      this.mapInfo = `${width} x ${height} tiles | ${tilewidth} x ${tileheight}px | ${layers.length} layer(s) | ${orientation}`;
      this.fitMap();

      this.resizeObserver = new ResizeObserver(() => this.fitMap());
      this.resizeObserver.observe(viewport);
    } catch (error) {
      console.error('Failed to load Tiled map:', error);
      this.destroyRenderer();
      this.error = `${t('loading-failure', 'Failed to load document')}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    } finally {
      if (this.file === file) {
        this.loading = false;
        await this.updateComplete;
        this.app?.resize();
        this.fitMap();
      }
    }
  }

  private destroyRenderer() {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.mapContainer = null;
    this.dragPointerId = null;
    this.dragging = false;

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }

  private fitMap = () => {
    const viewport = this.shadowRoot?.querySelector('.viewport') as HTMLDivElement | null;
    if (!viewport || !this.mapContainer) return;

    const bounds = this.mapContainer.getLocalBounds();
    if (bounds.width <= 0 || bounds.height <= 0) return;

    const padding = 32;
    const scale = Math.min(
      (viewport.clientWidth - padding * 2) / bounds.width,
      (viewport.clientHeight - padding * 2) / bounds.height,
      1,
    );

    this.mapContainer.scale.set(Math.max(scale, MIN_SCALE));
    this.mapContainer.position.set(
      (viewport.clientWidth - bounds.width * this.mapContainer.scale.x) / 2 - bounds.x * this.mapContainer.scale.x,
      (viewport.clientHeight - bounds.height * this.mapContainer.scale.y) / 2 - bounds.y * this.mapContainer.scale.y,
    );
  };

  private zoom(factor: number, originX?: number, originY?: number) {
    const viewport = this.shadowRoot?.querySelector('.viewport') as HTMLDivElement | null;
    if (!viewport || !this.mapContainer) return;

    const oldScale = this.mapContainer.scale.x;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * factor));
    const x = originX ?? viewport.clientWidth / 2;
    const y = originY ?? viewport.clientHeight / 2;
    const mapX = (x - this.mapContainer.x) / oldScale;
    const mapY = (y - this.mapContainer.y) / oldScale;

    this.mapContainer.scale.set(newScale);
    this.mapContainer.position.set(x - mapX * newScale, y - mapY * newScale);
  }

  private handleWheel(event: WheelEvent) {
    event.preventDefault();
    const viewport = event.currentTarget as HTMLDivElement;
    const rect = viewport.getBoundingClientRect();
    this.zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15, event.clientX - rect.left, event.clientY - rect.top);
  }

  private handlePointerDown(event: PointerEvent) {
    if (!this.mapContainer) return;
    const viewport = event.currentTarget as HTMLDivElement;
    viewport.setPointerCapture(event.pointerId);
    this.dragPointerId = event.pointerId;
    this.dragX = event.clientX;
    this.dragY = event.clientY;
    this.dragging = true;
  }

  private handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== this.dragPointerId || !this.mapContainer) return;
    this.mapContainer.x += event.clientX - this.dragX;
    this.mapContainer.y += event.clientY - this.dragY;
    this.dragX = event.clientX;
    this.dragY = event.clientY;
  }

  private handlePointerUp(event: PointerEvent) {
    if (event.pointerId !== this.dragPointerId) return;
    this.dragPointerId = null;
    this.dragging = false;
  }

  private async showPreview() {
    this.showSource = false;
    await this.updateComplete;
    this.app?.resize();
  }

  render() {
    if (!this.file) {
      return html`<div>${t('no-file-selected', 'No file selected')}</div>`;
    }

    return html`
      <div class="toolbar">
        <button class=${!this.showSource ? 'active' : ''} @click=${this.showPreview}>
          ${t('preview', 'Preview')}
        </button>
        <button class=${this.showSource ? 'active' : ''} @click=${() => this.showSource = true}>
          ${t('text', 'Text')}
        </button>
        <button @click=${() => this.zoom(1.25)} aria-label="Zoom in">+</button>
        <button @click=${() => this.zoom(0.8)} aria-label="Zoom out">-</button>
        <button @click=${this.fitMap}>${t('reset', 'Reset')}</button>
        <span class="info">${this.mapInfo}</span>
      </div>
      ${this.loading ? html`<div class="loading">${t('loading', 'Loading...')}</div>` : ''}
      ${this.error ? html`<div class="error">${this.error}</div>` : ''}
      ${this.showSource ? html`<div class="source">${this.sourceText}</div>` : ''}
      <div
        class="viewport ${this.showSource || this.loading || this.error ? 'hidden' : ''} ${this.dragging ? 'dragging' : ''}"
        @wheel=${this.handleWheel}
        @pointerdown=${this.handlePointerDown}
        @pointermove=${this.handlePointerMove}
        @pointerup=${this.handlePointerUp}
        @pointercancel=${this.handlePointerUp}
      ></div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tiledmap-viewer': TiledMapViewer;
  }
}
