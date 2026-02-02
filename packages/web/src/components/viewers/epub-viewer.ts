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

  connectedCallback() {
    super.connectedCallback();
    // Listen for theme changes
    this.themeChangeHandler = () => {
      if (this.epub) {
        this.loadCurrentChapter();
      }
    };
    // Use MutationObserver to detect class changes on body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          this.themeChangeHandler?.();
        }
      });
    });
    observer.observe(document.body, { attributes: true });
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

    const entry = this.entries.find((entry) => {
      return entry.path === this.epub!.root + item.href;
    });

    if (entry) {
      const textDecoder = new TextDecoder('utf-8');
      const content = textDecoder.decode(entry.data);
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
