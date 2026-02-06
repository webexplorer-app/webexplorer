import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Mobi, parse } from '@webexplorer/mobi';

@customElement('mobi-viewer')
export class MobiViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .mobi-viewer {
      padding: 1rem;
    }
    .mobi-iframe {
      width: 100%;
      min-height: 600px;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private mobi: Mobi | null = null;

  private mutationObserver: MutationObserver | null = null;

  connectedCallback() {
    super.connectedCallback();
    // Listen for theme changes
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' && this.mobi) {
          this.updateIframeTheme();
        }
      });
    });
    this.mutationObserver.observe(document.body, { attributes: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.mutationObserver?.disconnect();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadMobi();
    }
  }

  private getThemeStyles(): string {
    const isDark = document.body.classList.contains('dark-mode');
    return `
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
  }

  private updateIframeTheme() {
    const iframe = this.shadowRoot?.querySelector('iframe');
    if (iframe && this.mobi) {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(this.getThemeStyles() + this.mobi.text);
        iframeDoc.close();
      }
    }
  }

  private loadMobi() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = parse(reader.result as ArrayBuffer);
      this.mobi = result;
      
      this.updateComplete.then(() => {
        this.updateIframeTheme();
      });
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    if (!this.mobi) {
      return html`<loading-spinner></loading-spinner>`;
    }

    return html`
      <div class="mobi-viewer">
        <iframe class="mobi-iframe" title="Mobi Document"></iframe>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'mobi-viewer': MobiViewer;
  }
}
