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
    .icon-epub, .icon-mobi, .icon-azw3 { color: #009688; }
    .icon-archive { color: #8d6e63; }
    .icon-image { color: #e91e63; }
    .icon-audio { color: #00bcd4; }
    .icon-video { color: #9c27b0; }
    .icon-three { color: #ff9800; }
    .icon-csv { color: #4caf50; }
    .icon-torrent { color: #3f51b5; }
    .icon-wasm { color: #795548; }
    .icon-tab { color: #ff5722; }
    .icon-email { color: #2196f3; }

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
