import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createArchiveWorker } from '../../utils/archive-worker';
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
    }
    .epub-controls button {
      padding: 0.5rem 1rem;
      margin-right: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
    }
    .epub-controls button:hover:not(:disabled) {
      background: #f0f0f0;
    }
    .epub-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .epub-content {
      width: 100%;
      height: calc(100vh - 10rem);
      border: none;
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
      this.doc = textDecoder.decode(entry.data);
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
      return html``;
    }

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
