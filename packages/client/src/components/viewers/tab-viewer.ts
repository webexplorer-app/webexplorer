import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { AlphaTabApi, ExporterSettings, ImporterSettings, LayoutMode, NotationSettings, PlayerSettings, RenderingResources, Settings, StaveProfile, SystemsLayoutMode } from '@coderline/alphatab';

@customElement('tab-viewer')
export class TabViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .tab-viewer {
      width: 100%;
      height: calc(100vh - 150px);
      overflow: auto;
    }
    .tab-container {
      width: 100%;
      min-height: 100%;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  private api: AlphaTabApi | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.api?.destroy();
    this.api = null;
  }

  firstUpdated() {
    this.initAlphaTab();
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file && this.api) {
      this.loadFile();
    }
  }

  private initAlphaTab() {
    const container = this.shadowRoot?.querySelector('.tab-container') as HTMLDivElement;
    if (!container) return;

    const settings: Settings = {
      core: {
        engine: 'svg',
        logLevel: 1,
        fontDirectory: '/vendor/assets/fonts/',
        scriptFile: null,
        smuflFontSources: null,
        file: null,
        tex: false,
        tracks: null,
        enableLazyLoading: false,
        useWorkers: true,
        includeNoteBounds: false
      },
      display: {
        scale: 0.8,
        stretchForce: 0,
        layoutMode: LayoutMode.Page,
        staveProfile: StaveProfile.Default,
        barsPerRow: 0,
        startBar: 0,
        barCount: 0,
        barCountPerPartial: 0,
        justifyLastSystem: false,
        resources: new RenderingResources,
        padding: [],
        firstSystemPaddingTop: 0,
        systemPaddingTop: 0,
        systemPaddingBottom: 0,
        lastSystemPaddingBottom: 0,
        systemLabelPaddingLeft: 0,
        systemLabelPaddingRight: 0,
        accoladeBarPaddingRight: 0,
        notationStaffPaddingTop: 0,
        notationStaffPaddingBottom: 0,
        effectStaffPaddingTop: 0,
        effectStaffPaddingBottom: 0,
        firstStaffPaddingLeft: 0,
        staffPaddingLeft: 0,
        effectBandPaddingBottom: 0,
        systemsLayoutMode: SystemsLayoutMode.Automatic
      },
      notation: new NotationSettings,
      importer: new ImporterSettings,
      player: new PlayerSettings,
      exporter: new ExporterSettings,
      setSongBookModeSettings: function (): void {
        throw new Error('Function not implemented.');
      },
      fillFromJson: function (): void {
        throw new Error('Function not implemented.');
      }
    };

    this.api = new AlphaTabApi(container, settings);

    if (this.file) {
      this.loadFile();
    }
  }

  private loadFile() {
    if (!this.file || !this.api) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        this.api!.load(e.target.result as ArrayBuffer);
      }
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    return html`
      <div class="tab-viewer">
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
