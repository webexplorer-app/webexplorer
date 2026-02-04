import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { t } from '../common/Localization';
import { SUPPORTED_FILE_TYPES, type SupportedFileType } from '../common/supported-types.js';
import { LocalizedLitElement } from './localized-element';

/**
 * Component that displays a list of supported file types
 * 
 * @element supported-files-list
 */
@customElement('supported-files-list')
export class SupportedFilesList extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    table {
      border-collapse: collapse;
      font-size: 0.875rem;
      border: 1px solid var(--border, #ddd);
      width: 100%;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    th,
    td {
      border-bottom: 1px solid var(--border-light, #eee);
      padding: 0.75rem 1rem;
      text-align: left;
    }

    th {
      background-color: var(--surface, #f5f5f5);
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    td {
      background-color: var(--background, #fff);
      color: var(--text-primary, #333);
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background-color: var(--surface-hover, #e8e8e8);
    }

    .file-type-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .file-type-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }

    .file-type-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Icon colors - consistent with folder-viewer */
    .icon-pdf { color: #f44336; }
    .icon-word { color: #2b579a; }
    .icon-excel { color: #217346; }
    .icon-powerpoint { color: #d24726; }
    .icon-rtf { color: #6b7280; }
    .icon-opendocument { color: #ff6f00; }
    .icon-epub, .icon-mobi, .icon-azw3 { color: #009688; }
    .icon-archive { color: #8d6e63; }
    .icon-image { color: #e91e63; }
    .icon-audio { color: #00bcd4; }
    .icon-video { color: #9c27b0; }
    .icon-three { color: #ff9800; }
    .icon-csv { color: #4caf50; }
    .icon-sqlite { color: #003b57; }
    .icon-torrent { color: #3f51b5; }
    .icon-wasm { color: #795548; }
    .icon-tab { color: #ff5722; }
    .icon-email { color: #2196f3; }
    .icon-code { color: #607d8b; }
    .icon-markdown { color: #42a5f5; }
    .icon-font { color: #ab47bc; }
    .icon-subtitle { color: #ffa726; }
    .icon-ical { color: #4caf50; }
    .icon-comic { color: #ff7043; }
    .icon-tree { color: #26a69a; }
    .icon-log { color: #78909c; }
    .icon-config { color: #8d6e63; }
    .icon-hex { color: #546e7a; }
    .icon-diff { color: #e65100; }
    .icon-certificate { color: #00897b; }

    .extension {
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace);
      color: var(--text-link, #0066cc);
      font-size: 0.8125rem;
    }

    .note {
      color: var(--text-muted, #999);
      font-size: 0.75rem;
      font-style: italic;
      margin-left: 0.25rem;
    }
  `;

  /**
   * Whether to show the file type categories
   */
  @property({ type: Boolean, attribute: 'show-category' })
  showCategory = false;

  /**
   * Filter by category
   */
  @property({ type: String })
  category?: string;

  private getDisplayName(nameKey: string, defaultName: string): string {
    return t(nameKey, defaultName);
  }

  private getFilteredTypes() {
    if (this.category) {
      return SUPPORTED_FILE_TYPES.filter(ft => ft.category === this.category);
    }
    return SUPPORTED_FILE_TYPES;
  }

  private renderIcon(fileType: SupportedFileType) {
    const iconClass = `file-type-icon icon-${fileType.id}`;
    
    switch (fileType.id) {
      case 'pdf':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
        </span>`;
      case 'word':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 9h-2v5.5L9 13H7.5l2.5 6h2l2.5-6H13L11 16.5V11zm5 10H6V4h7v5h5v12z"/></svg>
        </span>`;
      case 'excel':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm1 16h-2v-2h2v2zm0-4h-2v-2h2v2zm-4 4H9v-2h2v2zm0-4H9v-2h2v2zm7 4h-2v-2h2v2zm0-4h-2v-2h2v2zM13 9V3.5L18.5 9H13z"/></svg>
        </span>`;
      case 'powerpoint':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-3 15H9v-5h2c1.1 0 2-.9 2-2s-.9-2-2-2H7.5v9H11zm2-10V3.5L18.5 9H13zm-2 3h-1v2h1c.55 0 1-.45 1-1s-.45-1-1-1z"/></svg>
        </span>`;
      case 'rtf':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8zm0 4h8v2H8zm0-8h3v2H8z"/></svg>
        </span>`;
      case 'opendocument':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8zm0 4h5v2H8z"/></svg>
        </span>`;
      case 'epub':
      case 'mobi':
      case 'azw3':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
        </span>`;
      case 'archive':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg>
        </span>`;
      case 'image':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </span>`;
      case 'audio':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </span>`;
      case 'video':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
        </span>`;
      case 'three':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z"/></svg>
        </span>`;
      case 'csv':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h14zm-9 5h4v9h-4v-9zm-5 0h4v9H5v-9zm14 9h-4v-9h4v9z"/></svg>
        </span>`;
      case 'sqlite':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c3.86 0 7 1.57 7 3.5S15.86 12 12 12 5 10.43 5 8.5 8.14 5 12 5zm0 14c-3.86 0-7-1.57-7-3.5v-2c1.41 1.16 4.01 2 7 2s5.59-.84 7-2v2c0 1.93-3.14 3.5-7 3.5zm0-5c-3.86 0-7-1.57-7-3.5v-2c1.41 1.16 4.01 2 7 2s5.59-.84 7-2v2c0 1.93-3.14 3.5-7 3.5z"/></svg>
        </span>`;
      case 'torrent':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </span>`;
      case 'wasm':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </span>`;
      case 'tab':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
        </span>`;
      case 'email':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
        </span>`;
      case 'code':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </span>`;
      case 'markdown':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.88v6.38h1.93zM19.69 12h-1.92V8.81h-1.93V12h-1.93l2.89 3.28L19.69 12z"/></svg>
        </span>`;
      case 'font':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></svg>
        </span>`;
      case 'subtitle':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z"/></svg>
        </span>`;
      case 'ical':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>
        </span>`;
      case 'comic':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
        </span>`;
      case 'tree':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 11V3h-7v3H9V3H2v8h7V8h2v10h4v3h7v-8h-7v3h-2V8h2v3z"/></svg>
        </span>`;
      case 'log':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 12h8v2H8zm0 4h8v2H8zm0-8h3v2H8z"/></svg>
        </span>`;
      case 'config':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </span>`;
      case 'hex':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 4v2h14V4H5zm0 10h4v6h6v-6h4l-7-7-7 7z"/></svg>
        </span>`;
      case 'diff':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4-3h-2v-4h2v4zm0-6h-2V6h2v2zm4 9h-2V7h2v10z"/></svg>
        </span>`;
      case 'certificate':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        </span>`;
      default:
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
        </span>`;
    }
  }

  render() {
    const types = this.getFilteredTypes();

    return html`
      <table>
        <thead>
          <tr>
            <th>${t('file-type-header', 'File Type')}</th>
            <th>${t('extension-header', 'Extension')}</th>
            ${this.showCategory
              ? html`<th>${t('category-header', 'Category')}</th>`
              : null}
          </tr>
        </thead>
        <tbody>
          ${types.map(
            ft => html`
              <tr>
                <td>
                  <div class="file-type-cell">
                    ${this.renderIcon(ft)}
                    ${this.getDisplayName(ft.nameKey, ft.defaultName)}
                  </div>
                </td>
                <td>
                  <span class="extension"
                    >${ft.extensions.map(e => `.${e}`).join(' ')}</span
                  >
                  ${ft.note ? html`<span class="note">(${ft.note})</span>` : null}
                </td>
                ${this.showCategory ? html`<td>${ft.category}</td>` : null}
              </tr>
            `
          )}
        </tbody>
      </table>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'supported-files-list': SupportedFilesList;
  }
}
