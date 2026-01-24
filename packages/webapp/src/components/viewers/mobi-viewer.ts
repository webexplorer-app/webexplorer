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
      height: calc(100vh - 150px);
      border: none;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private mobi: Mobi | null = null;

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadMobi();
    }
  }

  private loadMobi() {
    if (!this.file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = parse(reader.result as ArrayBuffer);
      this.mobi = result;
      
      this.updateComplete.then(() => {
        const iframe = this.shadowRoot?.querySelector('iframe');
        if (iframe && result) {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
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
              </style>
            `;
            iframeDoc.open();
            iframeDoc.write(themeStyle + result.text);
            iframeDoc.close();
          }
        }
      });
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    if (!this.mobi) {
      return html``;
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
