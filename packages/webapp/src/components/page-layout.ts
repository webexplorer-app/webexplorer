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
    }
    .page-header {
      background-color: #f5f5f5;
      border-bottom: 1px solid #ddd;
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
    h4 {
      margin: 0;
      padding: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }
  `;

  @property({ type: String })
  title = '';

  render() {
    return html`<h4>${this.title}</h4>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'page-layout': PageLayout;
    'page-header': PageHeader;
    'page-content': PageContent;
    'page-title': PageTitle;
  }
}
