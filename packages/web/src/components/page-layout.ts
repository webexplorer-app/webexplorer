import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('page-layout')
export class PageLayout extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
  `;

  @property({ type: String })
  className = '';

  render() {
    return html`
      <div class=${this.className}>
        <slot></slot>
      </div>
    `;
  }
}

@customElement('page-header')
export class PageHeader extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .page-header {
      background-color: var(--surface, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      padding: 0.5rem 0;
    }
    .container {
      margin: 0 auto;
      padding: 0 1rem;
    }
  `;

  render() {
    return html`
      <div class="page-header">
        <div class="container">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

@customElement('page-content')
export class PageContent extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .page-content {
      padding: 1rem 0;
    }
    .container {
      margin: 0 auto;
      padding: 0 1rem;
    }
  `;

  render() {
    return html`
      <div class="page-content">
        <div class="container">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

@customElement('page-title')
export class PageTitle extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .title-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .title-icon {
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }
    h4 {
      margin: 0;
      padding: 0;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: var(--primary, #333);
    }
  `;

  @property({ type: String })
  title = '';

  @property({ type: Boolean })
  showIcon = false;

  render() {
    return html`
      <div class="title-container">
        ${this.showIcon ? html`
          <svg class="title-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none">
            <path d="M7 4 L19 4 L25 10 L25 27 C25 28.1 24.1 29 23 29 L9 29 C7.9 29 7 28.1 7 27 L7 6 C7 4.9 7.9 4 9 4 Z" fill="#FFFFFF" stroke="#0066CC" stroke-width="1.5"/>
            <path d="M19 4 L19 10 L25 10 Z" fill="#E6F0FA" stroke="#0066CC" stroke-width="1"/>
            <line x1="11" y1="13" x2="18" y2="13" stroke="#0066CC" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
            <line x1="11" y1="16" x2="15" y2="16" stroke="#0066CC" stroke-width="1.2" stroke-linecap="round" opacity="0.35"/>
            <circle cx="19" cy="21" r="5" fill="#FFFFFF" stroke="#0066CC" stroke-width="1.5"/>
            <line x1="23" y1="25" x2="27" y2="29" stroke="#0066CC" stroke-width="2" stroke-linecap="round"/>
            <ellipse cx="19" cy="21" rx="2.5" ry="1.5" fill="#0066CC"/>
            <circle cx="19" cy="21" r="0.8" fill="#FFFFFF"/>
          </svg>
        ` : null}
        <h4>${this.title}</h4>
      </div>
    `;
  }
}

@customElement('page-toolbar')
export class PageToolbar extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .toolbar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 1rem;
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-start;
    }
    .toolbar-center {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 0;
    }
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      justify-content: flex-end;
    }
  `;

  render() {
    return html`
      <div class="toolbar">
        <div class="toolbar-left">
          <slot name="left"></slot>
        </div>
        <div class="toolbar-center">
          <slot name="center"></slot>
        </div>
        <div class="toolbar-right">
          <slot name="right"></slot>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-layout': PageLayout;
    'page-header': PageHeader;
    'page-content': PageContent;
    'page-title': PageTitle;
    'page-toolbar': PageToolbar;
  }
}
