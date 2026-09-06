import { css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { parseDicom, type DataSet, type Element } from 'dicom-parser';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

const IMPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2';
const EXPLICIT_VR_LITTLE_ENDIAN = '1.2.840.10008.1.2.1';

interface DicomImage {
  dataSet: DataSet;
  pixelElement: Element;
  rows: number;
  columns: number;
  samplesPerPixel: number;
  photometric: string;
  planarConfiguration: number;
  bitsAllocated: number;
  pixelRepresentation: number;
  frames: number;
  slope: number;
  intercept: number;
  defaultCenter: number;
  defaultWidth: number;
}

interface MetadataItem {
  label: string;
  value: string;
}

function firstNumber(value: string | undefined, fallback: number): number {
  const number = Number(value?.split('\\')[0]);
  return Number.isFinite(number) ? number : fallback;
}

function displayValue(value: string | undefined): string {
  return value?.replaceAll('^', ' ').trim() || '—';
}

@customElement('dicom-viewer')
export class DicomViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; color: var(--text, #222); }
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; min-height: 520px; background: #111; }
    .main { display: flex; min-width: 0; flex-direction: column; }
    .toolbar { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.6rem; border-bottom: 1px solid #444; background: #222; color: #fff; }
    .toolbar label { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; }
    .toolbar input { box-sizing: border-box; width: 90px; height: 2rem; padding: 0.3rem 0.4rem; border: 1px solid #666; border-radius: 4px; background: #111; color: #fff; }
    button { display: inline-grid; place-items: center; min-width: 2rem; height: 2rem; padding: 0 0.55rem; border: 1px solid #666; border-radius: 4px; background: #333; color: #fff; cursor: pointer; }
    button:hover:not(:disabled) { background: #444; }
    button:disabled { opacity: 0.45; cursor: default; }
    .canvas-wrap { display: grid; flex: 1; place-items: center; min-height: 420px; overflow: auto; padding: 1rem; }
    canvas { display: block; max-width: 100%; max-height: 75vh; background: #000; image-rendering: pixelated; }
    .sidebar { max-height: 80vh; overflow: auto; border-left: 1px solid var(--border, #ddd); background: var(--surface, #fff); }
    .sidebar h2 { margin: 0; padding: 0.8rem; border-bottom: 1px solid var(--border, #ddd); font-size: 1rem; }
    dl { margin: 0; }
    .metadata { padding: 0.6rem 0.8rem; border-bottom: 1px solid var(--border, #eee); }
    dt { color: var(--text-secondary, #666); font-size: 0.75rem; }
    dd { margin: 0.15rem 0 0; overflow-wrap: anywhere; font-size: 0.875rem; }
    .status { display: grid; min-height: 320px; place-items: center; padding: 2rem; text-align: center; color: var(--text-secondary, #666); }
    .error { color: var(--error, #dc2626); }
    @media (max-width: 760px) { .layout { grid-template-columns: 1fr; } .sidebar { max-height: 320px; border-top: 1px solid var(--border, #ddd); border-left: 0; } .canvas-wrap { min-height: 300px; } }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;
  @state() private frame = 0;
  @state() private windowCenter = 0;
  @state() private windowWidth = 1;
  @state() private metadata: MetadataItem[] = [];
  @query('canvas') private canvas?: HTMLCanvasElement;

  private image: DicomImage | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      void this.loadDicom(this.file);
      return;
    }
    if (this.image && !this.loading) this.drawFrame();
  }

  private async loadDicom(file: File) {
    this.loading = true;
    this.error = null;
    this.image = null;
    this.frame = 0;

    try {
      const dataSet = parseDicom(new Uint8Array(await file.arrayBuffer()));
      if (this.file !== file) return;
      const transferSyntax = dataSet.string('x00020010') || IMPLICIT_VR_LITTLE_ENDIAN;
      if (![IMPLICIT_VR_LITTLE_ENDIAN, EXPLICIT_VR_LITTLE_ENDIAN].includes(transferSyntax)) {
        throw new Error(`Unsupported compressed or big-endian transfer syntax: ${transferSyntax}`);
      }

      const pixelElement = dataSet.elements.x7fe00010;
      const rows = dataSet.uint16('x00280010') || 0;
      const columns = dataSet.uint16('x00280011') || 0;
      const samplesPerPixel = dataSet.uint16('x00280002') || 1;
      const photometric = dataSet.string('x00280004')?.trim().toUpperCase() || '';
      const bitsAllocated = dataSet.uint16('x00280100') || 0;
      if (!pixelElement || !rows || !columns) throw new Error('Pixel data or image dimensions are missing');
      if (!['MONOCHROME1', 'MONOCHROME2', 'RGB'].includes(photometric)) throw new Error(`Unsupported photometric interpretation: ${photometric || 'unknown'}`);
      if (![8, 16].includes(bitsAllocated) || (photometric === 'RGB' && bitsAllocated !== 8)) throw new Error(`Unsupported pixel depth: ${bitsAllocated} bits`);

      const slope = firstNumber(dataSet.string('x00281053'), 1);
      const intercept = firstNumber(dataSet.string('x00281052'), 0);
      const measuredWindow = this.measureWindow(dataSet, pixelElement, rows, columns, bitsAllocated, dataSet.uint16('x00280103') || 0, slope, intercept);
      const defaultCenter = firstNumber(dataSet.string('x00281050'), measuredWindow.center);
      const defaultWidth = Math.max(1, firstNumber(dataSet.string('x00281051'), measuredWindow.width));

      this.image = {
        dataSet,
        pixelElement,
        rows,
        columns,
        samplesPerPixel,
        photometric,
        planarConfiguration: dataSet.uint16('x00280006') || 0,
        bitsAllocated,
        pixelRepresentation: dataSet.uint16('x00280103') || 0,
        frames: Math.max(1, firstNumber(dataSet.string('x00280008'), 1)),
        slope,
        intercept,
        defaultCenter,
        defaultWidth,
      };
      this.windowCenter = defaultCenter;
      this.windowWidth = defaultWidth;
      this.metadata = this.buildMetadata(dataSet, transferSyntax, rows, columns, bitsAllocated, photometric);
    } catch (error) {
      if (this.file !== file) return;
      console.error('Failed to load DICOM file:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (this.file === file) this.loading = false;
    }
  }

  private measureWindow(dataSet: DataSet, pixelElement: Element, rows: number, columns: number, bitsAllocated: number, signed: number, slope: number, intercept: number) {
    const view = new DataView(dataSet.byteArray.buffer, dataSet.byteArray.byteOffset + pixelElement.dataOffset, pixelElement.length);
    const pixelCount = rows * columns;
    let minimum = Number.POSITIVE_INFINITY;
    let maximum = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < pixelCount; index++) {
      const stored = bitsAllocated === 8
        ? (signed ? view.getInt8(index) : view.getUint8(index))
        : (signed ? view.getInt16(index * 2, true) : view.getUint16(index * 2, true));
      const value = stored * slope + intercept;
      minimum = Math.min(minimum, value);
      maximum = Math.max(maximum, value);
    }
    return { center: (minimum + maximum) / 2, width: Math.max(1, maximum - minimum) };
  }

  private buildMetadata(dataSet: DataSet, transferSyntax: string, rows: number, columns: number, bitsAllocated: number, photometric: string): MetadataItem[] {
    return [
      { label: t('patient-name', 'Patient name'), value: displayValue(dataSet.string('x00100010')) },
      { label: t('patient-id', 'Patient ID'), value: displayValue(dataSet.string('x00100020')) },
      { label: t('modality', 'Modality'), value: displayValue(dataSet.string('x00080060')) },
      { label: t('study-description', 'Study'), value: displayValue(dataSet.string('x00081030')) },
      { label: t('series-description', 'Series'), value: displayValue(dataSet.string('x0008103e')) },
      { label: t('dimensions', 'Dimensions'), value: `${columns} × ${rows}` },
      { label: t('pixel-format', 'Pixel format'), value: `${photometric}, ${bitsAllocated}-bit` },
      { label: t('transfer-syntax', 'Transfer syntax'), value: transferSyntax },
    ];
  }

  private drawFrame() {
    const image = this.image;
    const canvas = this.canvas;
    if (!image || !canvas) return;
    canvas.width = image.columns;
    canvas.height = image.rows;
    const context = canvas.getContext('2d');
    if (!context) return;

    const output = context.createImageData(image.columns, image.rows);
    const framePixels = image.rows * image.columns;
    const bytesPerSample = image.bitsAllocated / 8;
    const frameBytes = framePixels * image.samplesPerPixel * bytesPerSample;
    const byteOffset = image.dataSet.byteArray.byteOffset + image.pixelElement.dataOffset + this.frame * frameBytes;
    const available = image.dataSet.byteArray.byteLength - (image.pixelElement.dataOffset + this.frame * frameBytes);
    if (available < frameBytes) return;
    const view = new DataView(image.dataSet.byteArray.buffer, byteOffset, frameBytes);

    if (image.photometric === 'RGB') {
      for (let index = 0; index < framePixels; index++) {
        const redOffset = image.planarConfiguration ? index : index * 3;
        const greenOffset = image.planarConfiguration ? framePixels + index : index * 3 + 1;
        const blueOffset = image.planarConfiguration ? framePixels * 2 + index : index * 3 + 2;
        output.data.set([view.getUint8(redOffset), view.getUint8(greenOffset), view.getUint8(blueOffset), 255], index * 4);
      }
    } else {
      const lower = this.windowCenter - this.windowWidth / 2;
      for (let index = 0; index < framePixels; index++) {
        const stored = image.bitsAllocated === 8
          ? (image.pixelRepresentation ? view.getInt8(index) : view.getUint8(index))
          : (image.pixelRepresentation ? view.getInt16(index * 2, true) : view.getUint16(index * 2, true));
        const value = stored * image.slope + image.intercept;
        let gray = Math.round(((value - lower) / this.windowWidth) * 255);
        gray = Math.max(0, Math.min(255, gray));
        if (image.photometric === 'MONOCHROME1') gray = 255 - gray;
        output.data.set([gray, gray, gray, 255], index * 4);
      }
    }
    context.putImageData(output, 0, 0);
  }

  private resetWindow() {
    if (!this.image) return;
    this.windowCenter = this.image.defaultCenter;
    this.windowWidth = this.image.defaultWidth;
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('failed-to-load', 'Failed to load file')}: ${this.error}</div>`;
    if (!this.image) return html`<div class="status">${t('no-image', 'No image')}</div>`;

    return html`
      <div class="layout">
        <section class="main">
          <div class="toolbar">
            ${this.image.frames > 1 ? html`
              <button @click=${() => this.frame--} ?disabled=${this.frame === 0} title=${t('previous-frame', 'Previous frame')}>←</button>
              <span>${this.frame + 1} / ${this.image.frames}</span>
              <button @click=${() => this.frame++} ?disabled=${this.frame === this.image.frames - 1} title=${t('next-frame', 'Next frame')}>→</button>
            ` : null}
            ${this.image.photometric !== 'RGB' ? html`
              <label>${t('window-center', 'Center')} <input type="number" .value=${String(this.windowCenter)} @input=${(event: InputEvent) => this.windowCenter = Number((event.target as HTMLInputElement).value)}></label>
              <label>${t('window-width', 'Width')} <input type="number" min="1" .value=${String(this.windowWidth)} @input=${(event: InputEvent) => this.windowWidth = Math.max(1, Number((event.target as HTMLInputElement).value))}></label>
              <button @click=${this.resetWindow}>${t('reset', 'Reset')}</button>
            ` : null}
          </div>
          <div class="canvas-wrap"><canvas aria-label=${t('dicom-image', 'DICOM image')}></canvas></div>
        </section>
        <aside class="sidebar">
          <h2>${t('dicom-metadata', 'DICOM metadata')}</h2>
          <dl>${this.metadata.map(item => html`<div class="metadata"><dt>${item.label}</dt><dd>${item.value}</dd></div>`)}</dl>
        </aside>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dicom-viewer': DicomViewer;
  }
}