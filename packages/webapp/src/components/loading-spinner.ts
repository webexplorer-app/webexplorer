import { html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { t } from '../Utils/Localization';
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
      padding: 2rem;
      gap: 1rem;
    }
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border-light, #f3f3f3);
      border-top: 3px solid var(--primary, #333);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    label {
      color: var(--text-muted, #666);
      font-size: 0.875rem;
    }
  `;

  render() {
    return html`
      <div class="loading">
        <div class="loading-spinner"></div>
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
