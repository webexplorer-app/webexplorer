import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../Utils/Localization';
import { LocalizedLitElement } from './localized-element';

@customElement('file-picker')
export class FilePicker extends LocalizedLitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    .filepicker {
      display: inline-block;
    }
    .filepicker-input {
      display: none;
    }
    .filepicker-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 0.875rem;
    }
    .filepicker-button:hover {
      background-color: #f0f0f0;
    }
    .filepicker-button svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  `;

  @state()
  private inputId = `filepicker-${Date.now()}`;

  private handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.dispatchEvent(new CustomEvent('files-selected', {
        detail: input.files,
        bubbles: true,
        composed: true
      }));
    }
  }

  private handleButtonClick() {
    const input = this.shadowRoot?.querySelector('input') as HTMLInputElement;
    input?.click();
  }

  render() {
    return html`
      <div class="filepicker">
        <input
          type="file"
          id=${this.inputId}
          class="filepicker-input"
          @change=${this.handleChange}
        />
        <button class="filepicker-button" @click=${this.handleButtonClick}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          ${t('choose-file', 'Choose File')}
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'file-picker': FilePicker;
  }
}
