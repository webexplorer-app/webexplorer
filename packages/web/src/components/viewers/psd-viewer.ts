import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { initializeCanvas, readPsd, type Layer } from 'ag-psd';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

initializeCanvas((width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
});

interface LayerInfo {
  name: string;
  depth: number;
  hidden: boolean;
}

function flattenLayers(layers: Layer[] | undefined, depth = 0): LayerInfo[] {
  return (layers ?? []).flatMap(layer => [
    { name: layer.name || t('unnamed-layer', 'Unnamed layer'), depth, hidden: Boolean(layer.hidden) },
    ...flattenLayers(layer.children, depth + 1),
  ]);
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not render the composite image')), 'image/png');
  });
}

@customElement('psd-viewer')
export class PsdViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; color: var(--text, #222); }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 260px; min-height: 400px; }
    .preview { display: grid; place-items: center; padding: 1rem; overflow: auto; background-color: #c8c8c8; background-image: linear-gradient(45deg, #aaa 25%, transparent 25%), linear-gradient(-45deg, #aaa 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #aaa 75%), linear-gradient(-45deg, transparent 75%, #aaa 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0; }
    .preview img { display: block; max-width: 100%; max-height: 75vh; object-fit: contain; box-shadow: 0 2px 12px rgb(0 0 0 / 30%); }
    .sidebar { border-left: 1px solid var(--border, #ddd); background: var(--surface, #fff); overflow: auto; max-height: 80vh; }
    .metadata { padding: 0.75rem; border-bottom: 1px solid var(--border, #ddd); font-size: 0.875rem; color: var(--text-secondary, #666); }
    h2 { margin: 0; padding: 0.75rem; font-size: 1rem; border-bottom: 1px solid var(--border, #ddd); }
    .layer { padding: 0.45rem 0.75rem; border-bottom: 1px solid var(--border, #eee); font-size: 0.875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .layer.hidden { color: var(--text-secondary, #777); opacity: 0.65; }
    .status { display: grid; place-items: center; min-height: 300px; padding: 2rem; color: var(--text-secondary, #666); }
    .error { color: var(--error, #dc2626); }
    @media (max-width: 720px) { .layout { grid-template-columns: 1fr; } .sidebar { border-left: 0; border-top: 1px solid var(--border, #ddd); max-height: 300px; } }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private previewUrl: string | null = null;
  @state() private width = 0;
  @state() private height = 0;
  @state() private layers: LayerInfo[] = [];
  @state() private loading = true;
  @state() private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) void this.loadPsd(this.file);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.revokePreview();
  }

  private revokePreview() {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
  }

  private async loadPsd(file: File) {
    this.loading = true;
    this.error = null;
    this.revokePreview();

    try {
      const psd = readPsd(await file.arrayBuffer());
      if (this.file !== file) return;
      if (!psd.canvas) throw new Error('This PSD does not contain a composite preview');

      const blob = await canvasToBlob(psd.canvas);
      if (this.file !== file) return;
      this.previewUrl = URL.createObjectURL(blob);
      this.width = psd.width;
      this.height = psd.height;
      this.layers = flattenLayers(psd.children);
    } catch (error) {
      if (this.file !== file) return;
      console.error('Failed to load PSD file:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (this.file === file) this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('failed-to-load', 'Failed to load file')}: ${this.error}</div>`;

    return html`
      <div class="layout">
        <div class="preview"><img src=${this.previewUrl ?? ''} alt=${this.file?.name ?? 'PSD preview'}></div>
        <aside class="sidebar">
          <div class="metadata">${this.width} × ${this.height} px · ${this.layers.length} ${t('layers', 'layers')}</div>
          <h2>${t('layers', 'Layers')}</h2>
          ${this.layers.map(layer => html`<div class="layer ${layer.hidden ? 'hidden' : ''}" style=${`padding-left: ${0.75 + layer.depth * 1.1}rem`} title=${layer.name}>${layer.hidden ? '○' : '●'} ${layer.name}</div>`)}
        </aside>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'psd-viewer': PsdViewer;
  }
}