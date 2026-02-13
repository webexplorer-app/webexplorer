import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { t } from '../../common/Localization';
import { LocalizedLitElement } from '../localized-element';
import { SUPPORTED_FILE_TYPES, type SupportedFileType } from '../../common/supported-types';

interface ViewerOption {
  fileType: SupportedFileType;
  categoryLabel: string;
  categoryIcon: string;
}

@customElement('default-viewer')
export class DefaultViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      padding: 2rem;
      text-align: center;
    }

    .icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.6;
    }

    .title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text, #1f2937);
      margin: 0 0 0.5rem 0;
    }

    .message {
      font-size: 1rem;
      color: var(--text-muted, #6b7280);
      margin: 0 0 0.5rem 0;
      max-width: 400px;
    }

    .file-info {
      font-size: 0.875rem;
      color: var(--text-muted, #9ca3af);
      margin: 0 0 2rem 0;
      padding: 0.5rem 1rem;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 6px;
      font-family: var(--font-mono, monospace);
    }

    .contact-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--primary, #3b82f6);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .contact-btn:hover {
      background: var(--primary-hover, #2563eb);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .contact-btn:active {
      transform: translateY(0);
    }

    .contact-icon {
      font-size: 1.125rem;
    }

    /* Open-with panel */
    .open-with {
      margin-top: 2rem;
      width: 100%;
      max-width: 420px;
    }

    .open-with-title {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted, #6b7280);
      margin: 0 0 0.75rem 0;
    }

    .search-input {
      width: 100%;
      box-sizing: border-box;
      padding: 0.625rem 0.875rem 0.625rem 2.25rem;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 8px;
      background: var(--bg-secondary, #f9fafb) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%239ca3af' viewBox='0 0 16 16'%3E%3Cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.242.156a5 5 0 1 1 0-10 5 5 0 0 1 0 10z'/%3E%3C/svg%3E") no-repeat 0.75rem center;
      color: var(--text, #1f2937);
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .search-input::placeholder {
      color: var(--text-muted, #9ca3af);
    }

    .search-input:focus {
      border-color: var(--primary, #3b82f6);
    }

    .viewer-list {
      margin-top: 0.5rem;
      max-height: 260px;
      overflow-y: auto;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 8px;
    }

    .viewer-item {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 0.75rem;
      padding: 0.625rem 0.875rem;
      background: none;
      border: none;
      border-bottom: 1px solid var(--border, #e5e7eb);
      color: var(--text, #1f2937);
      font-size: 0.8125rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .viewer-item:last-child {
      border-bottom: none;
    }

    .viewer-item:hover {
      background: var(--bg-hover, #eff6ff);
    }

    .viewer-item:active {
      background: var(--bg-active, #dbeafe);
    }

    .viewer-item-icon {
      font-size: 1.125rem;
      flex-shrink: 0;
      width: 1.5rem;
      text-align: center;
    }

    .viewer-item-info {
      flex: 1;
      min-width: 0;
    }

    .viewer-item-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .viewer-item-exts {
      font-size: 0.6875rem;
      color: var(--text-muted, #9ca3af);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .viewer-item-category {
      font-size: 0.6875rem;
      color: var(--text-muted, #9ca3af);
      padding: 0.125rem 0.375rem;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .no-results {
      padding: 1.5rem;
      text-align: center;
      color: var(--text-muted, #9ca3af);
      font-size: 0.8125rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private searchQuery = '';

  private getFileExtension(): string {
    if (!this.file) return '';
    const name = this.file.name;
    const lastDot = name.lastIndexOf('.');
    return lastDot >= 0 ? name.substring(lastDot) : '';
  }

  private getCategoryIcon(category: string): string {
    switch (category) {
      case 'document': return '\u{1F4C4}';
      case 'ebook': return '\u{1F4DA}';
      case 'media': return '\u{1F3AC}';
      case 'archive': return '\u{1F4E6}';
      case 'data': return '\u{1F4CA}';
      case 'code': return '\u{1F4BB}';
      case 'other': return '\u{1F527}';
      default: return '\u{1F4C1}';
    }
  }

  private getCategoryLabel(category: string): string {
    switch (category) {
      case 'document': return t('category-document', 'Documents');
      case 'ebook': return t('category-ebook', 'Ebooks');
      case 'media': return t('category-media', 'Media');
      case 'archive': return t('category-archive', 'Archives');
      case 'data': return t('category-data', 'Data');
      case 'code': return t('category-code', 'Code');
      case 'other': return t('category-other', 'Other');
      default: return category;
    }
  }

  private getAllViewerOptions(): ViewerOption[] {
    const seen = new Set<string>();
    const options: ViewerOption[] = [];
    for (const ft of SUPPORTED_FILE_TYPES) {
      if (!seen.has(ft.viewer)) {
        seen.add(ft.viewer);
        options.push({
          fileType: ft,
          categoryLabel: this.getCategoryLabel(ft.category),
          categoryIcon: this.getCategoryIcon(ft.category),
        });
      }
    }
    return options;
  }

  private getFilteredOptions(): ViewerOption[] {
    const all = this.getAllViewerOptions();
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter(o =>
      o.fileType.defaultName.toLowerCase().includes(q) ||
      o.fileType.extensions.some(ext => ext.includes(q)) ||
      o.categoryLabel.toLowerCase().includes(q)
    );
  }

  private onSearchInput(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  private selectViewer(fileType: SupportedFileType) {
    this.dispatchEvent(new CustomEvent('viewer-selected', {
      detail: { viewerId: fileType.id, viewer: fileType.viewer, lazyLoad: fileType.lazyLoad },
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    if (!this.file) return html``;

    const extension = this.getFileExtension();
    const mimeType = this.file.type || 'unknown';
    const filtered = this.getFilteredOptions();

    return html`
      <div class="container">
        <div class="icon">\u{1F4C4}</div>
        <h2 class="title">${t('unsupported-file', 'Unsupported File Type')}</h2>
        <p class="message">
          ${t('unsupported-file-message', 'This file type is not currently supported. If you would like us to add support for this format, please let us know!')}
        </p>
        <p class="file-info">
          ${extension} \u00b7 ${mimeType}
        </p>
        <a 
          class="contact-btn" 
          href="mailto:jichang_dev@outlook.com?subject=File%20Support%20Request%3A%20${encodeURIComponent(extension)}&body=Hi%2C%0A%0AI%20would%20like%20to%20request%20support%20for%20the%20following%20file%20type%3A%0A%0AExtension%3A%20${encodeURIComponent(extension)}%0AMIME%20Type%3A%20${encodeURIComponent(mimeType)}%0A%0AThank%20you!"
        >
          <span class="contact-icon">\u2709\uFE0F</span>
          ${t('request-support', 'Request Support')}
        </a>

        <div class="open-with">
          <p class="open-with-title">${t('try-open-with', 'Try opening with a viewer:')}</p>
          <input
            class="search-input"
            type="text"
            placeholder="${t('search-viewer', 'Search viewers...')}"
            .value=${this.searchQuery}
            @input=${this.onSearchInput}
          />
          <div class="viewer-list">
            ${filtered.length > 0
              ? filtered.map(o => html`
                <button class="viewer-item" @click=${() => this.selectViewer(o.fileType)}>
                  <span class="viewer-item-icon">${o.categoryIcon}</span>
                  <span class="viewer-item-info">
                    <div class="viewer-item-name">${o.fileType.defaultName}</div>
                    <div class="viewer-item-exts">${o.fileType.extensions.map(e => '.' + e).join(' ')}</div>
                  </span>
                  <span class="viewer-item-category">${o.categoryLabel}</span>
                </button>
              `)
              : html`<div class="no-results">${t('no-viewers-found', 'No matching viewers')}</div>`
            }
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'default-viewer': DefaultViewer;
  }
}
