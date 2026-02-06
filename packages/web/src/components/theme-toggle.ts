import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('theme-toggle')
export class ThemeToggle extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      border: 1px solid var(--border, #ccc);
      border-radius: var(--radius-2, 4px);
      background: var(--surface, #f5f5f5);
      color: var(--text-muted, #6b7280);
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    button svg {
      width: 1.125rem;
      height: 1.125rem;
    }
    button:hover {
      background-color: var(--surface-hover, #e8e8e8);
    }
  `;

  @state()
  private isDarkMode = false;

  connectedCallback() {
    super.connectedCallback();
    // Check for saved preference or system preference
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDarkMode = saved === 'dark';
    } else {
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.applyTheme();
  }

  private applyTheme() {
    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  private toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  render() {
    return html`
      <button 
        @click=${this.toggleTheme} 
        title="${this.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}"
      >
        ${this.isDarkMode 
          ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
          : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
        }
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'theme-toggle': ThemeToggle;
  }
}
