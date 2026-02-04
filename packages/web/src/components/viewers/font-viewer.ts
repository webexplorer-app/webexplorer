import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

@customElement('font-viewer')
export class FontViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .font-viewer {
      margin: 1rem;
    }
    .font-container {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      color: var(--text, #333);
    }
    
    .font-name {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      color: var(--text, #333);
    }
    
    .sample-section {
      margin-bottom: 2rem;
    }
    
    .sample-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-secondary, #666);
      margin-bottom: 0.5rem;
      font-family: system-ui, sans-serif;
    }
    
    .sample-text {
      font-family: 'PreviewFont', serif;
      line-height: 1.4;
    }
    
    .sample-large {
      font-size: 3rem;
    }
    
    .sample-medium {
      font-size: 1.5rem;
    }
    
    .sample-paragraph {
      font-size: 1rem;
      max-width: 60ch;
    }
    
    .size-samples {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: baseline;
    }
    
    .size-sample {
      font-family: 'PreviewFont', serif;
    }
    
    .glyphs-section {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border, #ddd);
    }
    
    .glyph-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(3rem, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .glyph {
      font-family: 'PreviewFont', serif;
      font-size: 1.5rem;
      text-align: center;
      padding: 0.5rem;
      border: 1px solid var(--border-light, #eee);
      border-radius: 4px;
      background: var(--surface-alt, #f9f9f9);
    }
    
    .glyph:hover {
      background: var(--surface-hover, #e8e8e8);
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
  private loading = true;

  @state()
  private error: string | null = null;

  private fontUrl: string | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.fontUrl) {
      URL.revokeObjectURL(this.fontUrl);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFont();
    }
  }

  private async loadFont() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      // Revoke previous URL if exists
      if (this.fontUrl) {
        URL.revokeObjectURL(this.fontUrl);
      }

      // Create blob URL for the font
      this.fontUrl = URL.createObjectURL(this.file);
      
      // Create and load the font
      const fontFace = new FontFace('PreviewFont', `url(${this.fontUrl})`);
      await fontFace.load();
      
      // Add to document fonts
      document.fonts.add(fontFace);
      
      this.loading = false;
    } catch (e) {
      console.error('Failed to load font:', e);
      this.error = `${t('loading-failure', 'Failed to load font')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private get fontName(): string {
    if (!this.file) return 'Font';
    return this.file.name.replace(/\.[^.]+$/, '');
  }

  render() {
    if (!this.file) {
      return html`<div class="font-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="font-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="font-viewer"><div class="error">${this.error}</div></div>`;
    }

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/\\';
    const pangram = 'The quick brown fox jumps over the lazy dog.';

    return html`
      <div class="font-viewer">
        <div class="font-container">
          <div class="font-name">${this.fontName}</div>
          
          <div class="sample-section">
            <div class="sample-label">${t('preview', 'Preview')}</div>
            <div class="sample-text sample-large">${pangram}</div>
          </div>
          
          <div class="sample-section">
            <div class="sample-label">${t('sizes', 'Sizes')}</div>
            <div class="size-samples">
              ${[12, 14, 16, 18, 24, 32, 48, 64].map(size => html`
                <span class="size-sample" style="font-size: ${size}px">${size}px</span>
              `)}
            </div>
          </div>
          
          <div class="sample-section">
            <div class="sample-label">${t('paragraph', 'Paragraph')}</div>
            <div class="sample-text sample-paragraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </div>
          </div>
          
          <div class="glyphs-section">
            <div class="sample-label">${t('characters', 'Characters')}</div>
            <div class="glyph-grid">
              ${alphabet.split('').map(char => html`<div class="glyph">${char}</div>`)}
            </div>
          </div>
          
          <div class="glyphs-section">
            <div class="sample-label">${t('numbers', 'Numbers')}</div>
            <div class="glyph-grid">
              ${numbers.split('').map(char => html`<div class="glyph">${char}</div>`)}
            </div>
          </div>
          
          <div class="glyphs-section">
            <div class="sample-label">${t('symbols', 'Symbols')}</div>
            <div class="glyph-grid">
              ${symbols.split('').map(char => html`<div class="glyph">${char}</div>`)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'font-viewer': FontViewer;
  }
}
