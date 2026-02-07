import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { createArchiveWorker } from '../../common/archive-worker';
import type { ArchiveEntry } from '@webexplorer/archive';
import { t } from '../../common/Localization';

interface Slide {
  index: number;
  title: string;
  content: string[];
  notes: string;
}

@customElement('powerpoint-viewer')
export class PowerPointViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .pptx-viewer {
    }
    .controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .controls button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      background: var(--surface, white);
      color: var(--text, #333);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .controls button:hover:not(:disabled) {
      background: var(--surface-hover, #f0f0f0);
    }
    .controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .slide-indicator {
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
    }
    .slide-container {
      display: flex;
      gap: 1rem;
    }
    .slide-list {
      width: 150px;
      flex-shrink: 0;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      background: var(--surface-alt, #f5f5f5);
    }
    .slide-thumbnail {
      padding: 0.5rem;
      cursor: pointer;
      border-bottom: 1px solid var(--border, #ddd);
      font-size: 0.75rem;
      color: var(--text-secondary, #666);
    }
    .slide-thumbnail:hover {
      background: var(--surface-hover, #e5e5e5);
    }
    .slide-thumbnail.active {
      background: var(--primary, #0066CC);
      color: white;
    }
    .slide-thumbnail .slide-num {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .slide-thumbnail .slide-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .slide-content {
      flex: 1;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      background: white;
      min-height: 400px;
      display: flex;
      flex-direction: column;
    }
    .slide-header {
      padding: 1.5rem 2rem 1rem;
      border-bottom: 1px solid var(--border, #eee);
    }
    .slide-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text, #333);
    }
    .slide-body {
      padding: 1.5rem 2rem;
      flex: 1;
    }
    .slide-body ul {
      margin: 0;
      padding-left: 1.5rem;
    }
    .slide-body li {
      margin-bottom: 0.75rem;
      font-size: 1.125rem;
      color: var(--text, #333);
    }
    .slide-notes {
      padding: 1rem 2rem;
      background: var(--surface-alt, #f9f9f9);
      border-top: 1px solid var(--border, #ddd);
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }
    .slide-notes h4 {
      margin: 0 0 0.5rem;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted, #999);
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }
    .error {
      color: var(--error, #dc2626);
      padding: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private slides: Slide[] = [];

  @state()
  private currentSlide = 0;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  private worker = createArchiveWorker();

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadPresentation();
    }
  }

  private async loadPresentation() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      await this.worker.init();
      await this.worker.open(this.file, '');
      const entries = await this.worker.entries();
      
      // Parse the PowerPoint structure
      this.slides = await this.parseSlides(entries);
      this.currentSlide = 0;
      this.loading = false;
    } catch (e) {
      console.error('Failed to load PowerPoint:', e);
      this.error = `Failed to load presentation: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private async parseSlides(entries: ArchiveEntry[]): Promise<Slide[]> {
    const slides: Slide[] = [];
    const textDecoder = new TextDecoder('utf-8');
    
    // Find all slide XML files
    const slideEntries = entries
      .filter(e => e.path.match(/ppt\/slides\/slide\d+\.xml$/))
      .sort((a, b) => {
        const numA = parseInt(a.path.match(/slide(\d+)\.xml$/)?.[1] || '0');
        const numB = parseInt(b.path.match(/slide(\d+)\.xml$/)?.[1] || '0');
        return numA - numB;
      });

    // Find notes
    const notesEntries = entries.filter(e => e.path.match(/ppt\/notesSlides\/notesSlide\d+\.xml$/));

    for (let i = 0; i < slideEntries.length; i++) {
      const entry = slideEntries[i];
      const content = textDecoder.decode(entry.data);
      
      // Parse XML to extract text content
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      
      // Extract title and content
      const texts = this.extractTextFromXml(doc);
      const title = texts[0] || `Slide ${i + 1}`;
      const contentItems = texts.slice(1);
      
      // Get notes if available
      const noteEntry = notesEntries.find(n => 
        n.path.includes(`notesSlide${i + 1}.xml`)
      );
      let notes = '';
      if (noteEntry) {
        const notesContent = textDecoder.decode(noteEntry.data);
        const notesDoc = parser.parseFromString(notesContent, 'application/xml');
        notes = this.extractTextFromXml(notesDoc).join(' ');
      }

      slides.push({
        index: i,
        title,
        content: contentItems,
        notes,
      });
    }

    return slides;
  }

  private extractTextFromXml(doc: Document): string[] {
    const texts: string[] = [];
    
    // Extract all text elements (a:t tags in OOXML)
    const textElements = doc.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main', 't');
    
    let currentParagraph = '';
    for (let i = 0; i < textElements.length; i++) {
      const text = textElements[i].textContent?.trim();
      if (text) {
        // Check if this is a new paragraph by looking at parent structure
        const parent = textElements[i].parentElement;
        const grandparent = parent?.parentElement;
        
        if (grandparent?.tagName.includes(':p') || grandparent?.tagName === 'a:p') {
          if (currentParagraph) {
            texts.push(currentParagraph);
          }
          currentParagraph = text;
        } else {
          currentParagraph += (currentParagraph ? ' ' : '') + text;
        }
      }
    }
    
    if (currentParagraph) {
      texts.push(currentParagraph);
    }

    return texts;
  }

  private goToSlide(index: number) {
    if (index >= 0 && index < this.slides.length) {
      this.currentSlide = index;
    }
  }

  private prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  private nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  render() {
    if (!this.file) {
      return html`<div class="pptx-viewer">No file selected</div>`;
    }

    if (this.loading) {
      return html`<div class="pptx-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="pptx-viewer"><div class="error">${this.error}</div></div>`;
    }

    const slide = this.slides[this.currentSlide];

    return html`
      <div class="pptx-viewer">
        <div class="controls">
          <button @click=${this.prevSlide} ?disabled=${this.currentSlide === 0}>
            ← ${t('prev', 'Prev')}
          </button>
          <span class="slide-indicator">
            ${this.currentSlide + 1} / ${this.slides.length}
          </span>
          <button @click=${this.nextSlide} ?disabled=${this.currentSlide === this.slides.length - 1}>
            ${t('next', 'Next')} →
          </button>
        </div>
        
        <div class="slide-container">
          <div class="slide-list">
            ${this.slides.map((s, i) => html`
              <div 
                class="slide-thumbnail ${i === this.currentSlide ? 'active' : ''}"
                @click=${() => this.goToSlide(i)}
              >
                <div class="slide-num">${i + 1}</div>
                <div class="slide-title">${s.title}</div>
              </div>
            `)}
          </div>
          
          <div class="slide-content">
            ${slide ? html`
              <div class="slide-header">
                <h2>${slide.title}</h2>
              </div>
              <div class="slide-body">
                ${slide.content.length > 0 ? html`
                  <ul>
                    ${slide.content.map(item => html`<li>${item}</li>`)}
                  </ul>
                ` : null}
              </div>
              ${slide.notes ? html`
                <div class="slide-notes">
                  <h4>${t('speaker-notes', 'Speaker Notes')}</h4>
                  ${slide.notes}
                </div>
              ` : null}
            ` : null}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'powerpoint-viewer': PowerPointViewer;
  }
}
