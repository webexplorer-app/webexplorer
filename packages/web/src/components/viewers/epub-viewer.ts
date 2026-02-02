import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createArchiveWorker } from '../../common/archive-worker';
import { parse, type EPub } from '@webexplorer/epub';
import type { ArchiveEntry } from '@webexplorer/archive';

@customElement('epub-viewer')
export class EPubViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .epub-viewer {
      margin: 1rem;
    }
    .epub-controls {
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .epub-controls button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      background: var(--surface, white);
      color: var(--text, #333);
      cursor: pointer;
    }
    .epub-controls button:hover:not(:disabled) {
      background: var(--surface-hover, #f0f0f0);
    }
    .epub-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .epub-controls span {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
    }
    .epub-content {
      width: 100%;
      height: calc(100vh - 10rem);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private epub: EPub | null = null;

  @state()
  private entries: ArchiveEntry[] = [];

  @state()
  private index = 0;

  @state()
  private doc = '';

  private worker = createArchiveWorker();
  private themeChangeHandler: (() => void) | null = null;
  private mutationObserver: MutationObserver | null = null;
  // Cache blob URLs for images to avoid recreating them
  private blobUrlCache: Map<string, string> = new Map();

  connectedCallback() {
    super.connectedCallback();
    // Listen for theme changes
    this.themeChangeHandler = () => {
      if (this.epub) {
        this.loadCurrentChapter();
      }
    };
    // Use MutationObserver to detect class changes on body
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.themeChangeHandler?.();
        }
      });
    });
    this.mutationObserver.observe(document.body, { attributes: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.mutationObserver?.disconnect();
    // Revoke all blob URLs to free memory
    this.blobUrlCache.forEach((url) => URL.revokeObjectURL(url));
    this.blobUrlCache.clear();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadEpub();
    }
  }

  private async loadEpub() {
    if (!this.file) return;

    await this.worker.init();
    await this.worker.open(this.file, '');
    const entries = await this.worker.entries();
    this.entries = entries;

    if (entries.length > 0) {
      const epub = parse({ entries });
      this.epub = epub;
      this.loadCurrentChapter();
    }
  }

  private loadCurrentChapter() {
    if (!this.epub) return;

    const itemRef = this.epub.spine.itemRefs[this.index];
    const item = this.epub.manifest.items[itemRef.idRef];
    if (!item) return;

    // Get the base path for resolving relative URLs
    const chapterPath = this.epub.root + item.href;
    const chapterDir = chapterPath.substring(0, chapterPath.lastIndexOf('/') + 1);

    const entry = this.entries.find((entry) => {
      return entry.path === chapterPath;
    });

    if (entry) {
      const textDecoder = new TextDecoder('utf-8');
      let content = textDecoder.decode(entry.data);
      
      // Process and replace image sources with blob URLs
      content = this.processMediaReferences(content, chapterDir);
      
      // Inject theme-aware styles into the content
      const isDark = document.body.classList.contains('dark-mode');
      const themeStyle = `
        <style>
          :root {
            color-scheme: ${isDark ? 'dark' : 'light'};
          }
          body {
            background: ${isDark ? '#1e1e1e' : '#ffffff'};
            color: ${isDark ? '#e0e0e0' : '#333333'};
            padding: 1rem;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            line-height: 1.6;
          }
          a { color: ${isDark ? '#6eb5ff' : '#0078d4'}; }
          img { max-width: 100%; height: auto; }
        </style>
      `;
      // Insert theme styles after <head> or at the beginning
      if (content.includes('<head>')) {
        this.doc = content.replace('<head>', '<head>' + themeStyle);
      } else if (content.includes('<html>')) {
        this.doc = content.replace('<html>', '<html><head>' + themeStyle + '</head>');
      } else {
        this.doc = themeStyle + content;
      }
    }
  }

  /**
   * Process media references (images, CSS, etc.) in HTML content
   * and replace relative paths with blob URLs from archive entries
   */
  private processMediaReferences(content: string, baseDir: string): string {
    // Process img src attributes
    content = this.replaceAttributeUrls(content, 'src', baseDir);
    // Process CSS url() references and link href
    content = this.replaceAttributeUrls(content, 'href', baseDir);
    // Process srcset attributes
    content = this.replaceAttributeUrls(content, 'srcset', baseDir);
    // Process poster attributes (for video)
    content = this.replaceAttributeUrls(content, 'poster', baseDir);
    
    return content;
  }

  /**
   * Replace URLs in a specific attribute with blob URLs
   */
  private replaceAttributeUrls(content: string, attribute: string, baseDir: string): string {
    // Match attribute="value" or attribute='value'
    const regex = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
    
    return content.replace(regex, (match, url) => {
      // Skip absolute URLs, data URLs, and fragment-only URLs
      if (url.startsWith('http://') || 
          url.startsWith('https://') || 
          url.startsWith('data:') ||
          url.startsWith('#') ||
          url.startsWith('mailto:')) {
        return match;
      }

      // Handle srcset (comma-separated list of URLs with optional descriptors)
      if (attribute === 'srcset') {
        const sources = url.split(',').map((source: string) => {
          const parts = source.trim().split(/\s+/);
          const srcUrl = parts[0];
          const descriptor = parts.slice(1).join(' ');
          const blobUrl = this.getOrCreateBlobUrl(srcUrl, baseDir);
          return blobUrl ? `${blobUrl} ${descriptor}`.trim() : source;
        });
        return `${attribute}="${sources.join(', ')}"`;
      }

      const blobUrl = this.getOrCreateBlobUrl(url, baseDir);
      return blobUrl ? `${attribute}="${blobUrl}"` : match;
    });
  }

  /**
   * Get blob URL from cache or create a new one for the given path
   */
  private getOrCreateBlobUrl(relativePath: string, baseDir: string): string | null {
    // Resolve the relative path to absolute path within the archive
    const absolutePath = this.resolvePath(baseDir, relativePath);
    
    // Check cache first
    if (this.blobUrlCache.has(absolutePath)) {
      return this.blobUrlCache.get(absolutePath)!;
    }

    // Find the entry in the archive
    const entry = this.entries.find(e => e.path === absolutePath);
    if (!entry || !entry.data) {
      return null;
    }

    // Determine MIME type from extension
    const mimeType = this.getMimeType(absolutePath);
    
    // Create blob URL - use Uint8Array to ensure compatibility
    const data = entry.data instanceof Uint8Array 
      ? entry.data 
      : new Uint8Array(entry.data);
    const blob = new Blob([data], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    
    // Cache it
    this.blobUrlCache.set(absolutePath, blobUrl);
    
    return blobUrl;
  }

  /**
   * Resolve a relative path against a base directory
   */
  private resolvePath(baseDir: string, relativePath: string): string {
    // Handle URL fragments
    const fragmentIndex = relativePath.indexOf('#');
    const pathWithoutFragment = fragmentIndex >= 0 
      ? relativePath.substring(0, fragmentIndex) 
      : relativePath;
    
    if (!pathWithoutFragment) {
      return baseDir;
    }

    // Split the paths
    const baseParts = baseDir.split('/').filter(p => p);
    const relativeParts = pathWithoutFragment.split('/');

    for (const part of relativeParts) {
      if (part === '..') {
        baseParts.pop();
      } else if (part !== '.' && part !== '') {
        baseParts.push(part);
      }
    }

    return baseParts.join('/');
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      // CSS
      'css': 'text/css',
      // Fonts
      'ttf': 'font/ttf',
      'otf': 'font/otf',
      'woff': 'font/woff',
      'woff2': 'font/woff2',
      // Other
      'xhtml': 'application/xhtml+xml',
      'html': 'text/html',
      'xml': 'application/xml',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private handlePrev() {
    if (this.index > 0) {
      this.index--;
      this.loadCurrentChapter();
    }
  }

  private handleNext() {
    if (this.epub && this.index < this.epub.spine.itemRefs.length - 1) {
      this.index++;
      this.loadCurrentChapter();
    }
  }

  render() {
    if (!this.epub) {
      return html`<loading-spinner></loading-spinner>`;
    }

    const currentPage = this.index + 1;
    const totalPages = this.epub.spine.itemRefs.length;

    return html`
      <div class="epub-viewer">
        <div class="epub-controls">
          <button
            type="button"
            ?disabled=${this.index === 0}
            @click=${this.handlePrev}
          >
            Prev
          </button>
          <span>${currentPage} / ${totalPages}</span>
          <button
            type="button"
            ?disabled=${this.index === this.epub.spine.itemRefs.length - 1}
            @click=${this.handleNext}
          >
            Next
          </button>
        </div>
        <div>
          <iframe
            title=${this.epub.metadata.title}
            srcdoc=${this.doc}
            class="epub-content"
          ></iframe>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'epub-viewer': EPubViewer;
  }
}
