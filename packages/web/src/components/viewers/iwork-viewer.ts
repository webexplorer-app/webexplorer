import { css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Remote } from 'comlink';
import { createArchiveWorker } from '../../common/archive-worker';
import type { ArchiveWorker } from '../../worker/ArchiveWorker';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';
import './image-viewer';
import './pdf-viewer';

type PreviewKind = 'pdf' | 'image';

interface EmbeddedPreview {
  file: File;
  kind: PreviewKind;
}

const PREVIEW_PATHS: Array<{ path: string; kind: PreviewKind; mime: string }> = [
  { path: 'quicklook/preview.pdf', kind: 'pdf', mime: 'application/pdf' },
  { path: 'quicklook/thumbnail.jpg', kind: 'image', mime: 'image/jpeg' },
  { path: 'quicklook/thumbnail.jpeg', kind: 'image', mime: 'image/jpeg' },
  { path: 'quicklook/thumbnail.png', kind: 'image', mime: 'image/png' },
];

@customElement('iwork-viewer')
export class IWorkViewer extends LocalizedLitElement {
  static styles = css`
    :host { display: block; }
    .status { display: grid; place-items: center; min-height: 300px; padding: 2rem; text-align: center; color: var(--text-secondary, #666); }
    .error { color: var(--error, #dc2626); }
    image-viewer, pdf-viewer { display: block; width: 100%; }
  `;

  @property({ attribute: false }) file: File | null = null;
  @state() private preview: EmbeddedPreview | null = null;
  @state() private loading = true;
  @state() private error: string | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) void this.loadPreview(this.file);
  }

  private async loadPreview(file: File) {
    this.loading = true;
    this.error = null;
    this.preview = null;
    let worker: Remote<ArchiveWorker> | null = null;

    try {
      worker = createArchiveWorker();
      await worker.init();
      await worker.open(file, '');
      const entries = await worker.entries();
      if (this.file !== file) return;

      const entryByPath = new Map(entries.map(entry => [entry.path.replaceAll('\\', '/').toLowerCase(), entry]));
      for (const candidate of PREVIEW_PATHS) {
        const entry = entryByPath.get(candidate.path);
        if (!entry) continue;

        const extension = candidate.kind === 'pdf' ? 'pdf' : candidate.mime.split('/')[1];
        const previewFile = new File(
          [new Uint8Array(entry.data)],
          `${file.name}-preview.${extension}`,
          { type: candidate.mime },
        );
        this.preview = { file: previewFile, kind: candidate.kind };
        return;
      }

      throw new Error('This document does not contain an embedded Quick Look preview');
    } catch (error) {
      if (this.file !== file) return;
      console.error('Failed to load iWork preview:', error);
      this.error = error instanceof Error ? error.message : 'Unknown error';
    } finally {
      if (worker) await worker.close();
      if (this.file === file) this.loading = false;
    }
  }

  render() {
    if (this.loading) return html`<div class="status">${t('loading', 'Loading...')}</div>`;
    if (this.error) return html`<div class="status error">${t('preview-unavailable', 'Preview unavailable')}: ${this.error}</div>`;
    if (!this.preview) return html`<div class="status">${t('preview-unavailable', 'Preview unavailable')}</div>`;

    return this.preview.kind === 'pdf'
      ? html`<pdf-viewer .file=${this.preview.file}></pdf-viewer>`
      : html`<image-viewer .file=${this.preview.file}></image-viewer>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'iwork-viewer': IWorkViewer;
  }
}