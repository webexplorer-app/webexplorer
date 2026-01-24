import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t, locales, setLocale, getCurrentLocale, type Locale } from '../Utils/Localization';
import { LocalizedLitElement } from './localized-element';

@customElement('locale-selector')
export class LocaleSelector extends LocalizedLitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    select {
      padding: 0.5rem;
      border: 1px solid var(--border, #ccc);
      border-radius: 4px;
      font-size: 0.875rem;
      background: var(--surface, white);
      color: var(--primary, #333);
      cursor: pointer;
    }
    select:hover {
      border-color: var(--secondary, #999);
    }
    select:focus {
      outline: none;
      border-color: var(--primary, #666);
    }
  `;

  private handleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const newLocale = select.value as Locale;
    setLocale(newLocale);
  }

  render() {
    const currentLocale = getCurrentLocale();
    return html`
      <select .value=${currentLocale} @change=${this.handleChange}>
        ${locales.map(loc => html`
          <option value=${loc} ?selected=${loc === currentLocale}>${t(loc)}</option>
        `)}
      </select>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'locale-selector': LocaleSelector;
  }
}
