import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { WebWorkerEngine } from '@unionpdf/engines';
import '@unionpdf/webcomponents';

/**
 * Theme-adaptive styles injected into unionpdf shadow roots.
 * These override the hardcoded light-only colors in @unionpdf/webcomponents.
 */
const THEME_OVERRIDE_TOOLBAR = `
  .pdf__toolbar {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
    border-bottom: 1px solid var(--border, #ddd);
    background: var(--surface, #f5f5f5);
    color: var(--text, #333);
    flex-wrap: wrap;
    font-family: inherit;
  }
  .pdf__toolbar__item__group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0.375rem 0.75rem;
    height: 2.25rem;
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    background: var(--surface, #f5f5f5);
    color: var(--text, #333);
    font-size: 0.875rem;
    font-family: inherit;
    transition: all 0.15s ease;
    white-space: nowrap;
  }
  button:hover {
    background: var(--surface-hover, #e8e8e8);
  }
  button:active {
    transform: scale(0.97);
  }
  button.active {
    background: var(--accent, #0066cc);
    color: var(--text-inverse, #fff);
    border-color: var(--accent, #0066cc);
  }
  button.active:hover {
    background: var(--accent-hover, #0052a3);
    border-color: var(--accent-hover, #0052a3);
  }
  select, input {
    box-sizing: border-box;
    height: 2.25rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    background: var(--background, #fff);
    color: var(--text, #333);
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.15s ease;
  }
  select:focus, input:focus {
    outline: none;
    border-color: var(--accent, #0066cc);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(0, 102, 204, 0.3));
  }
  input[type="number"] {
    width: 4.5rem;
  }
`;

const THEME_OVERRIDE_PANEL = `
  :host {
    color: var(--text, #333);
    font-family: inherit;
  }
  div[class$="__panel"] {
    background: var(--background, #fff);
    border-color: var(--border, #ddd);
  }
  div[class$="__panel"].visible {
    background: var(--background, #fff);
  }
  div[class$="__header"] {
    color: var(--text, #333);
    border-bottom-color: var(--border, #ddd);
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.375rem 0.75rem;
    height: 2.25rem;
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    background: var(--surface, #f5f5f5);
    color: var(--text, #333);
    font-size: 0.875rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  button:hover {
    background: var(--surface-hover, #e8e8e8);
  }
  button:active {
    transform: scale(0.97);
  }
  input, select {
    height: 2.25rem;
    padding: 0.375rem 0.5rem;
    border: 1px solid var(--border, #ccc);
    border-radius: 4px;
    background: var(--background, #fff);
    color: var(--text, #333);
    font-size: 0.875rem;
    font-family: inherit;
    transition: border-color 0.15s ease;
  }
  input:focus, select:focus {
    outline: none;
    border-color: var(--accent, #0066cc);
    box-shadow: 0 0 0 2px var(--focus-ring, rgba(0, 102, 204, 0.3));
  }
  a { color: var(--text-link, #0066cc); }
  span { color: var(--text-secondary, #666); }
  table { color: var(--text, #333); }
  td, th {
    border-color: var(--border, #ddd);
    color: var(--text, #333);
  }
`;

/** Cache parsed CSSStyleSheets so we don't re-create them every time. */
const sheetCache = new WeakMap<Element, CSSStyleSheet>();

/**
 * Inject theme styles into a custom element's open shadow root using
 * adoptedStyleSheets. Unlike appended <style> elements, adopted sheets
 * survive innerHTML clears (e.g. when unionpdf toolbar re-renders on
 * every config broadcast).
 */
function injectThemeStyles(el: Element, cssText: string) {
  const shadow = el.shadowRoot;
  if (!shadow) return;
  if (sheetCache.has(el)) return; // already injected

  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
  sheetCache.set(el, sheet);
}

@customElement('pdf-viewer')
export class PdfViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .pdf-container {
      width: 100%;
      height: 80vh;
      display: flex;
      flex-direction: column;
    }
    .pdf-container pdf-application {
      display: block;
      width: 100%;
      height: 100%;
    }
    .pdf-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .pdf-sidebar {
      width: 240px;
      flex-shrink: 0;
      overflow-y: auto;
      border-right: 1px solid var(--border, #ddd);
      background: var(--background-alt, #fafafa);
    }
    .pdf-sidebar:empty {
      display: none;
    }
    .pdf-main {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }
    pdf-toolbar {
      flex-shrink: 0;
    }
    pdf-pages {
      display: block;
      width: 100%;
      height: 100%;
    }
    pdf-thumbnails,
    pdf-bookmarks,
    pdf-search,
    pdf-metadata,
    pdf-attachments,
    pdf-signatures {
      display: block;
      width: 100%;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private engine: WebWorkerEngine | null = null;

  @state()
  private pdfFile: { id: string; name: string; content: ArrayBuffer } | null = null;

  @state()
  private loading = false;

  @state()
  private error = '';

  private worker: Worker | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.initEngine();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyEngine();
  }

  private initEngine() {
    try {
      this.worker = new Worker(
        new URL('../../worker/PdfWorker.ts', import.meta.url),
        { type: 'module' }
      );
      this.engine = new WebWorkerEngine(this.worker);
      this.engine.initialize();
    } catch (e) {
      console.error('Failed to initialize PDF engine:', e);
      this.error = 'Failed to initialize PDF engine';
    }
  }

  private destroyEngine() {
    if (this.engine) {
      this.engine.destroy();
      this.engine = null;
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pdfFile = null;
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
    this.injectThemes();
  }

  private injectThemes() {
    const root = this.shadowRoot;
    if (!root) return;
    const toolbar = root.querySelector('pdf-toolbar');
    if (toolbar) injectThemeStyles(toolbar, THEME_OVERRIDE_TOOLBAR);

    const panels = root.querySelectorAll(
      'pdf-thumbnails, pdf-bookmarks, pdf-search, pdf-metadata, pdf-attachments, pdf-signatures'
    );
    panels.forEach((el) => injectThemeStyles(el, THEME_OVERRIDE_PANEL));
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = '';

    try {
      const arrayBuffer = await this.file.arrayBuffer();
      this.pdfFile = {
        id: crypto.randomUUID(),
        name: this.file.name,
        content: arrayBuffer,
      };
    } catch (e) {
      console.error('Failed to read PDF file:', e);
      this.error = 'Failed to read PDF file';
    } finally {
      this.loading = false;
    }
  }

  private onOpenSuccess = () => {
    this.error = '';
    // Panels may not have their shadow roots ready on first render
    requestAnimationFrame(() => this.injectThemes());
  };

  private onOpenFailure = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    console.error('Failed to open PDF:', detail);
    this.error = 'Failed to open PDF document';
  };

  render() {
    if (this.error) {
      return html`<div class="pdf-container"><p>${this.error}</p></div>`;
    }

    if (!this.file || this.loading || !this.engine || !this.pdfFile) {
      return html`<loading-spinner></loading-spinner>`;
    }

    return html`
      <div class="pdf-container">
        <pdf-application
          .engine=${this.engine}
          .file=${this.pdfFile}
          .password=${''}
          @pdf-open-success=${this.onOpenSuccess}
          @pdf-open-failure=${this.onOpenFailure}
        >
          <pdf-toolbar></pdf-toolbar>
          <div class="pdf-body">
            <div class="pdf-sidebar">
              <pdf-thumbnails></pdf-thumbnails>
              <pdf-bookmarks></pdf-bookmarks>
              <pdf-search></pdf-search>
              <pdf-metadata></pdf-metadata>
              <pdf-attachments></pdf-attachments>
              <pdf-signatures></pdf-signatures>
            </div>
            <div class="pdf-main">
              <pdf-pages></pdf-pages>
            </div>
          </div>
          <pdf-downloader></pdf-downloader>
          <pdf-printer></pdf-printer>
        </pdf-application>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pdf-viewer': PdfViewer;
  }
}
