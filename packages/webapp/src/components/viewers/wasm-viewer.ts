import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import wabt from 'wabt';

type WabtModule = Awaited<ReturnType<typeof wabt>>;

@customElement('wasm-viewer')
export class WasmViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .wasm-viewer {
      padding: 1rem;
      font-family: monospace;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.875rem;
      background: #f5f5f5;
      overflow-x: auto;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private code = '';

  @state()
  private wabtModule: WabtModule | null = null;

  async connectedCallback() {
    super.connectedCallback();
    this.wabtModule = await wabt();
  }

  updated(changedProperties: Map<string, unknown>) {
    if ((changedProperties.has('file') || changedProperties.has('wabtModule')) && this.file && this.wabtModule) {
      this.loadWasm();
    }
  }

  private loadWasm() {
    if (!this.file || !this.wabtModule) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      const mod = this.wabtModule!.readWasm(new Uint8Array(result), {
        readDebugNames: true,
      });
      if (mod) {
        this.code = mod.toText({
          foldExprs: false,
          inlineExport: false
        });
      }
    };
    reader.readAsArrayBuffer(this.file);
  }

  render() {
    return html`
      <div class="wasm-viewer">
        <p>${this.code}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'wasm-viewer': WasmViewer;
  }
}
