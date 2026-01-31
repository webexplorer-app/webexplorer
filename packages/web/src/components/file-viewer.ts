import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { mimeType } from '../common/file';
import { getFileTypeByMime } from '../common/supported-types';

// Import viewer components
import './viewers/image-viewer';
import './viewers/video-viewer';
import './viewers/audio-viewer';
import './viewers/text-viewer';
import './viewers/binary-viewer';
import './viewers/default-viewer';

// Viewer ID to viewer path mapping for lazy-loaded viewers
const VIEWER_PATHS: Record<string, string> = {
  'pdf-viewer': './viewers/pdf-viewer',
  'epub-viewer': './viewers/epub-viewer',
  'mobi-viewer': './viewers/mobi-viewer',
  'archive-viewer': './viewers/archive-viewer',
  'three-viewer': './viewers/three-viewer',
  'tab-viewer': './viewers/tab-viewer',
  'torrent-viewer': './viewers/torrent-viewer',
  'csv-viewer': './viewers/csv-viewer',
  'email-viewer': './viewers/email-viewer',
  'wasm-viewer': './viewers/wasm-viewer',
  'ffmpeg-viewer': './viewers/ffmpeg-viewer',
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

    const fileType = mimeType(this.file);
    if (!fileType) {
      this.viewerType = 'default';
      return;
    }

    const supportedType = getFileTypeByMime(fileType);

    if (supportedType) {
      // Map supported type id to viewer type
      this.viewerType = supportedType.id;
      
      if (supportedType.lazyLoad) {
        const viewerPath = VIEWER_PATHS[supportedType.viewer];
        if (viewerPath) {
          this.loadViewer(viewerPath);
        } else {
          console.error(`No viewer path found for: ${supportedType.viewer}`);
          this.viewerType = 'default';
          this.viewerLoaded = true;
        }
      } else {
        this.viewerLoaded = true;
      }
    } else if (fileType?.startsWith('video/')) {
      // Fallback for unsupported video types - use ffmpeg
      this.viewerType = 'ffmpeg';
      this.loadViewer(VIEWER_PATHS['ffmpeg-viewer']);
    } else {
      this.viewerType = 'default';
      this.viewerLoaded = true;
    }
  }

  private async loadViewer(path: string) {
    try {
      await import(path);
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
      case 'epub':
        return html`<epub-viewer .file=${file}></epub-viewer>`;
      case 'mobi':
        return html`<mobi-viewer .file=${file}></mobi-viewer>`;
      case 'archive':
        return html`<archive-viewer .file=${file}></archive-viewer>`;
      case 'three':
        return html`<three-viewer .file=${file} .format=${this.getThreeFormat()}></three-viewer>`;
      case 'tab':
        return html`<tab-viewer .file=${file}></tab-viewer>`;
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
      case 'email':
        return html`<email-viewer .file=${file}></email-viewer>`;
      case 'wasm':
        return html`<wasm-viewer .file=${file}></wasm-viewer>`;
      case 'ffmpeg':
        return html`<ffmpeg-viewer .file=${file}></ffmpeg-viewer>`;
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
