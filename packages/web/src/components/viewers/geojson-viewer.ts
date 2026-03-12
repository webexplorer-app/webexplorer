import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('geojson-viewer')
export class GeoJsonViewer extends LocalizedLitElement {
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

    .map-container {
      width: 100%;
      height: calc(100vh - 120px);
      min-height: 400px;
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
  private featureCount = 0;

  private map: L.Map | null = null;
  private leafletCssLoaded = false;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadGeoJson();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private async loadLeafletCss() {
    if (this.leafletCssLoaded) return;
    // Inject Leaflet CSS into the shadow root
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.crossOrigin = '';
    this.shadowRoot?.appendChild(link);
    this.leafletCssLoaded = true;
    // Wait for CSS to load
    await new Promise<void>(resolve => {
      link.onload = () => resolve();
      link.onerror = () => resolve(); // continue anyway
    });
  }

  private async loadGeoJson() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      this.sourceText = text;
      const geojson = JSON.parse(text);

      // Count features
      if (geojson.type === 'FeatureCollection') {
        this.featureCount = geojson.features?.length || 0;
      } else if (geojson.type === 'Feature') {
        this.featureCount = 1;
      } else {
        this.featureCount = 1; // GeometryCollection or single geometry
      }

      this.loading = false;
      this.showSource = false;

      await this.updateComplete;
      await this.renderMap(geojson);
    } catch (e) {
      console.error('Failed to parse GeoJSON:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private async renderMap(geojson: unknown) {
    await this.loadLeafletCss();

    const container = this.shadowRoot?.querySelector('.map-container') as HTMLDivElement;
    if (!container) return;

    const L = await import('leaflet');

    // Clean up old map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.map = L.map(container).setView([0, 0], 2);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    const geoJsonLayer = L.geoJSON(geojson as GeoJSON.GeoJsonObject, {
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          const content = Object.entries(feature.properties)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `<b>${this.escapeHtml(k)}</b>: ${this.escapeHtml(String(v))}`);
          if (content.length > 0) {
            layer.bindPopup(content.join('<br>'));
          }
        }
      },
      style: () => ({
        color: '#3b82f6',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.3,
      }),
    }).addTo(this.map);

    // Fit bounds
    const bounds = geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [20, 20] });
    }
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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
          <button class=${!this.showSource ? 'active' : ''} @click=${this.switchToMap}>
            ${t('preview', 'Preview')}
          </button>
          <button class=${this.showSource ? 'active' : ''} @click=${() => this.showSource = true}>
            ${t('text', 'Text')}
          </button>
          <span class="info">${this.featureCount} feature(s)</span>
        </div>
        ${this.showSource
          ? html`<div class="source-container">${this.sourceText}</div>`
          : ''}
        <div class="map-container ${this.showSource ? 'hidden' : ''}"></div>
      </div>
    `;
  }

  private async switchToMap() {
    this.showSource = false;
    await this.updateComplete;
    if (this.map) {
      this.map.invalidateSize();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'geojson-viewer': GeoJsonViewer;
  }
}
