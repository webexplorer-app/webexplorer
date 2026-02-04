import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../common/Localization';
import { LocalizedLitElement } from './localized-element';

@customElement('loading-spinner')
export class LoadingSpinner extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--size-8, 2rem);
      gap: var(--size-4, 1rem);
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-light, #f3f3f3);
      border-top-color: var(--primary, #333);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    label {
      font-size: var(--font-size-0, 0.875rem);
      color: var(--text-muted, #666);
    }
  `;

  render() {
    return html`
      <div class="loading">
        <div class="spinner"></div>
        <label>${t('loading', 'Loading')}</label>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'loading-spinner': LoadingSpinner;
  }
}
