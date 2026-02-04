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
      padding: var(--size-2, 0.5rem) 0;
    }
    .container {
      margin: 0 auto;
      padding: 0 var(--size-4, 1rem);
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
      padding: var(--size-4, 1rem) 0;
    }
    .container {
      margin: 0 auto;
      padding: 0 var(--size-4, 1rem);
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
      gap: var(--size-2, 0.5rem);
    }
    .title-icon {
      width: 1.5rem;
      height: 1.5rem;
      flex-shrink: 0;
    }
    h4 {
      margin: 0;
      padding: 0;
      font-size: var(--font-size-3, 1.25rem);
      font-weight: var(--font-weight-6, 600);
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
          <img class="title-icon" src="/favicon.svg" alt="Web Explorer" />
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
      gap: var(--size-4, 1rem);
    }
    .toolbar-left {
      display: flex;
      align-items: center;
      gap: var(--size-2, 0.5rem);
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
      gap: var(--size-2, 0.5rem);
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
