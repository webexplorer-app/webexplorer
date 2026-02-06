import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';
import { createArchiveWorker } from '../../common/archive-worker';
import type { Remote } from 'comlink';
import type { ArchiveWorker } from '../../worker/ArchiveWorker';

interface ComicPage {
  name: string;
  blob: Blob;
  url: string;
}

@customElement('comic-viewer')
export class ComicViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--surface-dark, #1a1a1a);
    }

    .container {
      display: flex;
      flex-direction: column;
    }

    .toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--surface, #2a2a2a);
      border-bottom: 1px solid var(--border, #444);
      flex-shrink: 0;
    }

    .toolbar button {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem;
      border: none;
      background: var(--surface-hover, #3a3a3a);
      color: var(--text-primary, #fff);
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toolbar button:hover:not(:disabled) {
      background: var(--surface-active, #4a4a4a);
    }

    .toolbar button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toolbar button svg {
      width: 1.25rem;
      height: 1.25rem;
    }

    .page-info {
      font-size: 0.875rem;
      color: var(--text-primary, #fff);
      min-width: 80px;
      text-align: center;
    }

    .view-mode {
      display: flex;
      gap: 0.25rem;
      margin-left: 1rem;
      padding-left: 1rem;
      border-left: 1px solid var(--border, #444);
    }

    .view-mode button.active {
      background: var(--primary, #3b82f6);
    }

    .viewer {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .page-container {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
    }

    .page-container.single {
      max-width: 100%;
    }

    .page-container.double {
      max-width: 100%;
    }

    .page-image {
      max-width: 100%;
      object-fit: contain;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      border-radius: 2px;
    }

    .page-container.double .page-image {
      max-width: 50%;
    }

    .thumbnails {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--surface, #2a2a2a);
      border-top: 1px solid var(--border, #444);
      overflow-x: auto;
      flex-shrink: 0;
    }

    .thumbnail {
      flex-shrink: 0;
      width: 60px;
      height: 80px;
      object-fit: cover;
      border: 2px solid transparent;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.7;
      transition: all 0.2s;
    }

    .thumbnail:hover {
      opacity: 1;
    }

    .thumbnail.active {
      border-color: var(--primary, #3b82f6);
      opacity: 1;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-primary, #fff);
      gap: 1rem;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border, #444);
      border-top-color: var(--primary, #3b82f6);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--error, #ef4444);
      padding: 2rem;
      text-align: center;
    }

    .progress {
      font-size: 0.875rem;
      color: var(--text-muted, #999);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private pages: ComicPage[] = [];

  @state()
  private currentPage = 0;

  @state()
  private viewMode: 'single' | 'double' = 'single';

  @state()
  private loading = true;

  @state()
  private loadingProgress = '';

  @state()
  private error: string | null = null;

  private worker: Remote<ArchiveWorker> | null = null;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadComic();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private cleanup() {
    // Revoke blob URLs
    this.pages.forEach(page => URL.revokeObjectURL(page.url));
    this.pages = [];
    this.worker = null;
  }

  private async loadComic() {
    if (!this.file) return;

    this.cleanup();
    this.loading = true;
    this.error = null;
    this.currentPage = 0;
    this.loadingProgress = t('loading', 'Loading...');

    try {
      // Create archive worker using Comlink
      this.worker = createArchiveWorker();
      
      // Initialize and open the archive
      await this.worker.init();
      await this.worker.open(this.file, '');
      
      // Get all entries from the archive
      const entries = await this.worker.entries();
      
      const pages: ComicPage[] = [];
      
      // Process entries - filter for images and create blob URLs
      for (const entry of entries) {
        // Check if it's a file (type 32768) and an image
        if (entry.type === 32768 && this.isImageFile(entry.path)) {
          const blob = new Blob([new Uint8Array(entry.data)]);
          pages.push({
            name: entry.name || entry.path.split('/').pop() || '',
            blob,
            url: URL.createObjectURL(blob),
          });
        }
      }
      
      // Sort pages by name (natural sort for proper ordering like page1, page2, page10)
      pages.sort((a, b) => this.naturalSort(a.name, b.name));
      
      this.pages = pages;
      
      if (this.pages.length === 0) {
        throw new Error('No images found in comic archive');
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load comic';
    } finally {
      this.loading = false;
    }
  }

  private isImageFile(name: string): boolean {
    const ext = name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext || '');
  }

  private naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  }

  private goToPage(index: number) {
    if (index >= 0 && index < this.pages.length) {
      this.currentPage = index;
    }
  }

  private prevPage() {
    const step = this.viewMode === 'double' ? 2 : 1;
    this.goToPage(Math.max(0, this.currentPage - step));
  }

  private nextPage() {
    const step = this.viewMode === 'double' ? 2 : 1;
    this.goToPage(Math.min(this.pages.length - 1, this.currentPage + step));
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        this.prevPage();
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        this.nextPage();
        break;
      case 'Home':
        this.goToPage(0);
        break;
      case 'End':
        this.goToPage(this.pages.length - 1);
        break;
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private renderToolbar() {
    const hasPrev = this.currentPage > 0;
    const hasNext = this.currentPage < this.pages.length - 1;

    return html`
      <div class="toolbar">
        <button @click=${this.prevPage} ?disabled=${!hasPrev} title="${t('prev', 'Previous')}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
          </svg>
        </button>
        <span class="page-info">${this.currentPage + 1} / ${this.pages.length}</span>
        <button @click=${this.nextPage} ?disabled=${!hasNext} title="${t('next', 'Next')}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
          </svg>
        </button>
        
        <div class="view-mode">
          <button 
            class=${this.viewMode === 'single' ? 'active' : ''}
            @click=${() => this.viewMode = 'single'}
            title="${t('single-page', 'Single Page')}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
          </button>
          <button 
            class=${this.viewMode === 'double' ? 'active' : ''}
            @click=${() => this.viewMode = 'double'}
            title="${t('double-page', 'Double Page')}"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 5v14h18V5H3zm8 12H5V7h6v10zm8 0h-6V7h6v10z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  private renderViewer() {
    const currentPage = this.pages[this.currentPage];
    const nextPage = this.viewMode === 'double' && this.currentPage + 1 < this.pages.length
      ? this.pages[this.currentPage + 1]
      : null;

    return html`
      <div class="viewer" @click=${this.nextPage}>
        <div class="page-container ${this.viewMode}">
          ${currentPage ? html`
            <img class="page-image" src="${currentPage.url}" alt="Page ${this.currentPage + 1}" />
          ` : null}
          ${nextPage ? html`
            <img class="page-image" src="${nextPage.url}" alt="Page ${this.currentPage + 2}" />
          ` : null}
        </div>
      </div>
    `;
  }

  private renderThumbnails() {
    return html`
      <div class="thumbnails">
        ${this.pages.map((page, index) => html`
          <img 
            class="thumbnail ${index === this.currentPage ? 'active' : ''}"
            src="${page.url}"
            alt="Page ${index + 1}"
            @click=${() => this.goToPage(index)}
          />
        `)}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <div class="loading-spinner"></div>
          <span>${this.loadingProgress}</span>
        </div>
      `;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    return html`
      <div class="container">
        ${this.renderToolbar()}
        ${this.renderViewer()}
        ${this.renderThumbnails()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'comic-viewer': ComicViewer;
  }
}
