import { LitElement } from 'lit';

/**
 * A base class for LitElement components that automatically re-render
 * when the global locale changes.
 */
export class LocalizedLitElement extends LitElement {
  private _localeChangeHandler: ((e: Event) => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    this._localeChangeHandler = () => {
      this.requestUpdate();
    };
    window.addEventListener('locale-changed', this._localeChangeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._localeChangeHandler) {
      window.removeEventListener('locale-changed', this._localeChangeHandler);
      this._localeChangeHandler = null;
    }
  }
}
