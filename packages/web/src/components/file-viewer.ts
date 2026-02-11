import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { mimeType } from '../common/file';
import { getFileTypeByMime, getFileTypeByExtension } from '../common/supported-types';

// Import viewer components that are always loaded (small/common)
import './viewers/image-viewer';
import './viewers/video-viewer';
import './viewers/audio-viewer';
import './viewers/text-viewer';
import './viewers/binary-viewer';
import './viewers/default-viewer';

// Lazy load function map - explicit imports for Vite code splitting
const VIEWER_LOADERS: Record<string, () => Promise<unknown>> = {
  'pdf-viewer': () => import('./viewers/pdf-viewer'),
  'word-viewer': () => import('./viewers/word-viewer'),
  'excel-viewer': () => import('./viewers/excel-viewer'),
  'powerpoint-viewer': () => import('./viewers/powerpoint-viewer'),
  'rtf-viewer': () => import('./viewers/rtf-viewer'),
  'opendocument-viewer': () => import('./viewers/opendocument-viewer'),
  'epub-viewer': () => import('./viewers/epub-viewer'),
  'mobi-viewer': () => import('./viewers/mobi-viewer'),
  'archive-viewer': () => import('./viewers/archive-viewer'),
  'three-viewer': () => import('./viewers/three-viewer'),
  'tab-viewer': () => import('./viewers/tab-viewer'),
  'torrent-viewer': () => import('./viewers/torrent-viewer'),
  'csv-viewer': () => import('./viewers/csv-viewer'),
  'sqlite-viewer': () => import('./viewers/sqlite-viewer'),
  'email-viewer': () => import('./viewers/email-viewer'),
  'wasm-viewer': () => import('./viewers/wasm-viewer'),
  'ffmpeg-viewer': () => import('./viewers/ffmpeg-viewer'),
  'code-viewer': () => import('./viewers/code-viewer'),
  'markdown-viewer': () => import('./viewers/markdown-viewer'),
  'font-viewer': () => import('./viewers/font-viewer'),
  'subtitle-viewer': () => import('./viewers/subtitle-viewer'),
  'ical-viewer': () => import('./viewers/ical-viewer'),
  'comic-viewer': () => import('./viewers/comic-viewer'),
  'tree-viewer': () => import('./viewers/tree-viewer'),
  'log-viewer': () => import('./viewers/log-viewer'),
  'config-viewer': () => import('./viewers/config-viewer'),
  'hex-viewer': () => import('./viewers/hex-viewer'),
  'diff-viewer': () => import('./viewers/diff-viewer'),
  'certificate-viewer': () => import('./viewers/certificate-viewer'),
  'fiddler-viewer': () => import('./viewers/fiddler-viewer'),
  'clipboard-viewer': () => import('./viewers/clipboard-viewer'),
};

@customElement('file-viewer')
export class FileViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .file-viewer {
      min-height: 200px;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @property({ type: Boolean })
  darkMode = false;

  @state()
  private viewerLoaded = false;

  @state()
  private viewerType: string = 'default';

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file')) {
      // Reset viewer state when file changes
      this.viewerLoaded = false;
      this.viewerType = 'default';
      
      if (this.file) {
        this.determineViewer();
      }
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      document.title = this.file.name;
    }
  }

  private determineViewer() {
    if (!this.file) {
      this.viewerType = 'default';
      return;
    }

    // Try to match by file extension first (more reliable for some file types like RTF)
    const fileName = this.file.name;
    const lastDot = fileName.lastIndexOf('.');
    const extension = lastDot >= 0 ? fileName.substring(lastDot + 1) : '';
    
    let supportedType = getFileTypeByExtension(extension);
    
    // If no match by extension, try MIME type
    if (!supportedType) {
      const fileType = mimeType(this.file);
      if (fileType) {
        supportedType = getFileTypeByMime(fileType);
      }
    }

    if (supportedType) {
      // Map supported type id to viewer type
      this.viewerType = supportedType.id;
      
      if (supportedType.lazyLoad) {
        const viewerLoader = VIEWER_LOADERS[supportedType.viewer];
        if (viewerLoader) {
          this.loadViewer(viewerLoader);
        } else {
          console.error(`No viewer loader found for: ${supportedType.viewer}`);
          this.viewerType = 'default';
          this.viewerLoaded = true;
        }
      } else {
        this.viewerLoaded = true;
      }
    } else {
      // Check for unsupported video types - use ffmpeg
      const fileType = mimeType(this.file);
      if (fileType?.startsWith('video/')) {
        this.viewerType = 'ffmpeg';
        this.loadViewer(VIEWER_LOADERS['ffmpeg-viewer']);
      } else {
        this.viewerType = 'default';
        this.viewerLoaded = true;
      }
    }
  }

  private async loadViewer(loader: () => Promise<unknown>) {
    try {
      await loader();
      this.viewerLoaded = true;
    } catch (e) {
      console.error('Failed to load viewer:', e);
      this.viewerType = 'default';
      this.viewerLoaded = true;
    }
  }

  private getThreeFormat(): string {
    if (!this.file) return 'gltf';
    const fileType = mimeType(this.file);
    switch (fileType) {
      case 'model/stl': return 'stl';
      case 'model/gltf-binary':
      case 'model/gltf+json': return 'gltf';
      case 'model/obj': return 'obj';
      case 'model/3mf': return '3mf';
      default: return 'gltf';
    }
  }

  render() {
    if (!this.file) {
      return html`<div>No file selected</div>`;
    }

    if (!this.viewerLoaded) {
      return html`<loading-spinner></loading-spinner>`;
    }

    const file = this.file;

    switch (this.viewerType) {
      case 'pdf':
        return html`<pdf-viewer .file=${file}></pdf-viewer>`;
      case 'word':
        return html`<word-viewer .file=${file}></word-viewer>`;
      case 'excel':
        return html`<excel-viewer .file=${file}></excel-viewer>`;
      case 'powerpoint':
        return html`<powerpoint-viewer .file=${file}></powerpoint-viewer>`;
      case 'rtf':
        return html`<rtf-viewer .file=${file}></rtf-viewer>`;
      case 'opendocument':
        return html`<opendocument-viewer .file=${file}></opendocument-viewer>`;
      case 'epub':
        return html`<epub-viewer .file=${file}></epub-viewer>`;
      case 'mobi':
        return html`<mobi-viewer .file=${file}></mobi-viewer>`;
      case 'archive':
        return html`<archive-viewer .file=${file}></archive-viewer>`;
      case 'three':
        return html`<three-viewer .file=${file} .format=${this.getThreeFormat()}></three-viewer>`;
      case 'tab':
        return html`<tab-viewer .file=${file} .darkMode=${this.darkMode}></tab-viewer>`;
      case 'torrent':
        return html`<torrent-viewer .file=${file}></torrent-viewer>`;
      case 'video':
        return html`<video-viewer .file=${file}></video-viewer>`;
      case 'audio':
        return html`<audio-viewer .file=${file}></audio-viewer>`;
      case 'image':
        return html`<image-viewer .file=${file}></image-viewer>`;
      case 'csv':
        return html`<csv-viewer .file=${file}></csv-viewer>`;
      case 'sqlite':
        return html`<sqlite-viewer .file=${file}></sqlite-viewer>`;
      case 'email':
        return html`<email-viewer .file=${file}></email-viewer>`;
      case 'wasm':
        return html`<wasm-viewer .file=${file}></wasm-viewer>`;
      case 'ffmpeg':
        return html`<ffmpeg-viewer .file=${file}></ffmpeg-viewer>`;
      case 'code':
        return html`<code-viewer .file=${file}></code-viewer>`;
      case 'markdown':
        return html`<markdown-viewer .file=${file}></markdown-viewer>`;
      case 'font':
        return html`<font-viewer .file=${file}></font-viewer>`;
      case 'subtitle':
        return html`<subtitle-viewer .file=${file}></subtitle-viewer>`;
      case 'ical':
        return html`<ical-viewer .file=${file}></ical-viewer>`;
      case 'comic':
        return html`<comic-viewer .file=${file}></comic-viewer>`;
      case 'tree':
        return html`<tree-viewer .file=${file}></tree-viewer>`;
      case 'log':
        return html`<log-viewer .file=${file}></log-viewer>`;
      case 'config':
        return html`<config-viewer .file=${file}></config-viewer>`;
      case 'hex':
        return html`<hex-viewer .file=${file}></hex-viewer>`;
      case 'diff':
        return html`<diff-viewer .file=${file}></diff-viewer>`;
      case 'certificate':
        return html`<certificate-viewer .file=${file}></certificate-viewer>`;
      case 'fiddler':
        return html`<fiddler-viewer .file=${file}></fiddler-viewer>`;
      case 'clipboard':
        return html`<clipboard-viewer .file=${file}></clipboard-viewer>`;
      default:
        return html`<default-viewer .file=${file}></default-viewer>`;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'file-viewer': FileViewer;
  }
}
