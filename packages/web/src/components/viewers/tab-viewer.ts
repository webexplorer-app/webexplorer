import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { AlphaTabApi, LayoutMode, Settings, StaveProfile, SystemsLayoutMode } from '@coderline/alphatab';

@customElement('tab-viewer')
export class TabViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    .tab-viewer {
      width: 100%;
      background: var(--background, #fff);
    }
    .tab-container {
      width: 100%;
      min-height: 400px;
    }
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = false;

  @state()
  private error: string | null = null;

  private api: AlphaTabApi | null = null;
  private containerRef: HTMLDivElement | null = null;

  // Use light DOM to avoid Shadow DOM issues with AlphaTab
  protected createRenderRoot() {
    return this;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.api?.destroy();
    this.api = null;
  }

  firstUpdated() {
    this.injectStyles();
    this.initAlphaTab();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file && this.api) {
      this.loadFile();
    }
  }

  private injectStyles() {
    // Inject styles into light DOM since we're not using Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      tab-viewer {
        display: block;
        width: 100%;
      }
      tab-viewer .tab-viewer {
        width: 100%;
        background: var(--background, #fff);
      }
      tab-viewer .tab-container {
        width: 100%;
        min-height: 400px;
        box-sizing: border-box;
      }
      tab-viewer .at-surface {
        width: 100% !important;
        max-width: 100% !important;
      }
      tab-viewer .at-surface > div {
        position: relative !important;
        height: auto !important;
      }
      tab-viewer .at-surface svg {
        display: block;
        width: 100% !important;
        height: auto !important;
      }
      /* Dark mode support for AlphaTab SVG content */
      .dark-mode tab-viewer .tab-container {
        background: #fff;
        border-radius: 8px;
      }
      tab-viewer .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
        color: var(--text-muted, #666);
      }
      tab-viewer .error {
        padding: 1rem;
        color: var(--error, #dc3545);
        text-align: center;
      }
    `;
    this.appendChild(style);
  }

  private initAlphaTab() {
    this.containerRef = this.querySelector('.tab-container') as HTMLDivElement;
    if (!this.containerRef) return;

    const settings: Settings = new Settings();
    settings.core.engine = 'svg';
    settings.core.logLevel = 1;
    settings.core.fontDirectory = '/font/';
    settings.core.useWorkers = true;
    settings.display.scale = 1.0;
    settings.display.layoutMode = LayoutMode.Page;
    settings.display.staveProfile = StaveProfile.Default;
    settings.display.systemsLayoutMode = SystemsLayoutMode.Automatic;

    this.api = new AlphaTabApi(this.containerRef, settings);
    
    this.api.renderStarted.on(() => {
      this.loading = true;
      this.error = null;
    });

    this.api.renderFinished.on(() => {
      this.loading = false;
    });

    this.api.error.on((error) => {
      this.loading = false;
      this.error = error.message || 'Failed to render tab';
      console.error('AlphaTab error:', error);
    });

    if (this.file) {
      this.loadFile();
    }
  }

  private loadFile() {
    if (!this.file || !this.api) return;

    this.loading = true;
    this.error = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        try {
          this.api!.load(e.target.result as ArrayBuffer);
        } catch (err) {
          this.error = 'Failed to load guitar tab file';
          this.loading = false;
          console.error('AlphaTab load error:', err);
        }
      }
    };
    reader.onerror = () => {
      this.error = 'Failed to read file';
      this.loading = false;
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    return html`
      <div class="tab-viewer">
        ${this.loading ? html`<div class="loading">Loading guitar tab...</div>` : null}
        ${this.error ? html`<div class="error">${this.error}</div>` : null}
        <div class="tab-container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tab-viewer': TabViewer;
  }
}
