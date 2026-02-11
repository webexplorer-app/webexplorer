import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import '../page-layout';
import '../locale-selector';
import '../theme-toggle';
import '../file-picker';
import '../supported-files-list';
import '../credits-dialog';
import '../input-zone';
import { LocalizedLitElement } from '../localized-element';

@customElement('home-page')
export class HomePage extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: var(--size-2, 0.5rem);
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border: none;
      background: transparent;
      border-radius: var(--radius-2, 8px);
      cursor: pointer;
      color: var(--text-muted, #6b7280);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .icon-btn svg {
      width: 1.25rem;
      height: 1.25rem;
    }
    .icon-btn:hover {
      background: var(--surface-hover, #f3f4f6);
      color: var(--accent, #3b82f6);
      transform: scale(1.05);
    }
    .icon-btn:active {
      transform: scale(0.95);
    }

    /* Overflow menu for small screens */
    .menu-wrapper {
      position: relative;
    }
    .menu-btn {
      display: none;
    }
    .inline-actions {
      display: flex;
      align-items: center;
      gap: var(--size-2, 0.5rem);
    }
    .overflow-menu {
      display: none;
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 0.25rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #ddd);
      border-radius: var(--radius-2, 8px);
      box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
      z-index: 200;
      min-width: 10rem;
      padding: 0.25rem 0;
    }
    .overflow-menu.open {
      display: block;
    }
    .overflow-menu-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--primary, #333);
      font-size: 0.875rem;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }
    .overflow-menu-item:hover {
      background: var(--surface-hover, #f3f4f6);
    }
    .overflow-menu-item svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      stroke: currentColor;
    }
    .menu-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 199;
    }
    .menu-backdrop.open {
      display: block;
    }

    @media (max-width: 640px) {
      .menu-btn {
        display: flex;
      }
      .inline-actions {
        display: none;
      }
    }

    .explorer {
      display: flex;
      flex-direction: column;
      gap: var(--size-8, 2rem);
    }
    .file-input-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--size-6, 1.5rem);
      width: 100%;
    }
    .file-input-row {
      display: flex;
      align-items: center;
      gap: var(--size-4, 1rem);
      width: 100%;
      max-width: 600px;
      justify-content: center;
    }
    .supports {
      margin-top: var(--size-4, 1rem);
    }
    .supports h3 {
      margin-bottom: var(--size-4, 1rem);
      color: var(--primary, #333);
      font-weight: var(--font-weight-6, 600);
    }
  `;

  @state()
  private showCredits = false;

  @state()
  private menuOpen = false;

  private handleFileInput(e: CustomEvent<File>) {
    this.dispatchEvent(new CustomEvent('file-selected', {
      detail: e.detail,
      bubbles: true,
      composed: true
    }));
  }

  private handleFilesSelected(e: CustomEvent<FileList>) {
    const files = e.detail;
    if (files.length > 0) {
      this.dispatchEvent(new CustomEvent('file-selected', {
        detail: files[0],
        bubbles: true,
        composed: true
      }));
    }
  }

  private toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  private closeMenu() {
    this.menuOpen = false;
  }

  private handleThemeMenuClick() {
    // Directly toggle the theme (same logic as theme-toggle component)
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    }
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: !isDark } }));
    this.closeMenu();
  }

  render() {
    return html`
      <page-layout className="page--home">
        <page-header>
          <page-toolbar>
            <span slot="left" class="toolbar-actions">
              <locale-selector></locale-selector>
            </span>
            <page-title slot="center" title="Web Explorer" showIcon></page-title>
            <span slot="right" class="toolbar-actions">
              <!-- Inline buttons for larger screens -->
              <span class="inline-actions">
                <a 
                  class="icon-btn"
                  href="mailto:jichang_dev@outlook.com"
                  title=${t('contact', 'Contact')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
                <button 
                  class="icon-btn" 
                  @click=${() => this.showCredits = true}
                  title=${t('open-source-credits', 'Open Source Credits')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
                <theme-toggle></theme-toggle>
              </span>
              <!-- Overflow menu for small screens -->
              <div class="menu-wrapper">
                <button class="icon-btn menu-btn" @click=${this.toggleMenu} title=${t('menu', 'Menu')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                </button>
                <div class="menu-backdrop ${this.menuOpen ? 'open' : ''}" @click=${this.closeMenu}></div>
                <div class="overflow-menu ${this.menuOpen ? 'open' : ''}">
                  <a class="overflow-menu-item" href="mailto:jichang_dev@outlook.com" @click=${this.closeMenu}>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    ${t('contact', 'Contact')}
                  </a>
                  <button class="overflow-menu-item" @click=${() => { this.showCredits = true; this.closeMenu(); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    ${t('open-source-credits', 'Open Source Credits')}
                  </button>
                  <button class="overflow-menu-item" @click=${this.handleThemeMenuClick}>
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                    ${t('switch-theme', 'Theme')}
                  </button>
                </div>
              </div>
            </span>
          </page-toolbar>
        </page-header>
        <page-content>
          <div class="explorer">
            <div class="file-input-section">
              <input-zone @file-input=${this.handleFileInput}></input-zone>
              <div class="file-input-row">
                <file-picker @files-selected=${this.handleFilesSelected}></file-picker>
              </div>
            </div>
            <div class="supports">
              <h3>${t('supported-files', 'Supported Files')}</h3>
              <supported-files-list></supported-files-list>
            </div>
          </div>
        </page-content>
      </page-layout>
      <credits-dialog 
        ?open=${this.showCredits} 
        @close=${() => this.showCredits = false}
      ></credits-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
