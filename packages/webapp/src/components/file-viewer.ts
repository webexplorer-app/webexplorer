import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { mimeType } from '../common/file';

// Import viewer components
import './viewers/image-viewer';
import './viewers/video-viewer';
import './viewers/audio-viewer';
import './viewers/text-viewer';
import './viewers/binary-viewer';
import './viewers/default-viewer';

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
    
    switch (fileType) {
      case 'application/pdf':
        this.viewerType = 'pdf';
        this.loadViewer('./viewers/pdf-viewer');
        break;
      case 'application/epub+zip':
        this.viewerType = 'epub';
        this.loadViewer('./viewers/epub-viewer');
        break;
      case 'application/x-azw3':
      case 'application/x-mobipocket-ebook':
        this.viewerType = 'mobi';
        this.loadViewer('./viewers/mobi-viewer');
        break;
      case 'application/zip':
      case 'application/x-tar':
      case 'application/x-compressed':
      case 'application/vnd.rar':
      case 'application/x-zip-compressed':
      case 'application/x-gzip':
        this.viewerType = 'archive';
        this.loadViewer('./viewers/archive-viewer');
        break;
      case 'model/stl':
      case 'model/gltf-binary':
      case 'model/gltf+json':
      case 'model/obj':
      case 'model/3mf':
        this.viewerType = 'three';
        this.loadViewer('./viewers/three-viewer');
        break;
      case 'application/x-gtp':
        this.viewerType = 'tab';
        this.loadViewer('./viewers/tab-viewer');
        break;
      case 'application/x-bittorrent':
        this.viewerType = 'torrent';
        this.loadViewer('./viewers/torrent-viewer');
        break;
      case 'video/mp4':
      case 'video/webm':
      case 'video/ogg':
      case 'video/mov':
      case 'video/quicktime':
        this.viewerType = 'video';
        this.viewerLoaded = true;
        break;
      case 'audio/mpeg':
      case 'audio/flac':
      case 'audio/aac':
      case 'audio/ogg':
      case 'audio/wav':
      case 'audio/mp3':
        this.viewerType = 'audio';
        this.viewerLoaded = true;
        break;
      case 'image/png':
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/webp':
      case 'image/apng':
      case 'image/bmp':
      case 'image/.avif':
      case 'image/svg+xml':
      case 'image/x-icon':
      case 'image/tiff':
        this.viewerType = 'image';
        this.viewerLoaded = true;
        break;
      case 'text/csv':
        this.viewerType = 'csv';
        this.loadViewer('./viewers/csv-viewer');
        break;
      case 'application/vnd.ms-outlook':
        this.viewerType = 'email';
        this.loadViewer('./viewers/email-viewer');
        break;
      case 'application/wasm':
        this.viewerType = 'wasm';
        this.loadViewer('./viewers/wasm-viewer');
        break;
      default:
        if (fileType?.startsWith('video/')) {
          this.viewerType = 'ffmpeg';
          this.loadViewer('./viewers/ffmpeg-viewer');
        } else {
          this.viewerType = 'default';
          this.viewerLoaded = true;
        }
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
