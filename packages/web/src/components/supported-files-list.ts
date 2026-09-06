import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { t } from '../common/Localization';
import { SUPPORTED_FILE_TYPES, type SupportedFileType } from '../common/supported-types.js';
import { LocalizedLitElement } from './localized-element';

type FileCategory = SupportedFileType['category'];
type CategoryFilter = 'all' | FileCategory;

const CATEGORIES: Array<{ id: CategoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'document', label: 'Documents' },
  { id: 'media', label: 'Media' },
  { id: 'archive', label: 'Archives' },
  { id: 'ebook', label: 'Ebooks' },
  { id: 'data', label: 'Data' },
  { id: 'code', label: 'Code' },
  { id: 'other', label: 'Other' },
];

const FEATURED_TYPE_IDS = new Set(['pdf', 'word', 'excel', 'image', 'video', 'archive', 'psd', 'dicom']);

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

    .browser { border: 1px solid var(--border, #ddd); border-radius: 8px; overflow: hidden; }
    .controls { display: flex; gap: 0.75rem; align-items: center; padding: 0.75rem; background: var(--surface, #f5f5f5); border-bottom: 1px solid var(--border, #ddd); }
    .search { box-sizing: border-box; flex: 1; min-width: 0; height: 2.4rem; padding: 0 0.75rem; border: 1px solid var(--border, #ccc); border-radius: 4px; background: var(--background, #fff); color: var(--text-primary, #333); font: inherit; }
    .result-count { color: var(--text-muted, #666); font-size: 0.8125rem; white-space: nowrap; }
    .category-filter { display: flex; align-items: center; gap: 0.4rem; color: var(--text-muted, #666); font-size: 0.8125rem; white-space: nowrap; }
    .category-select { box-sizing: border-box; height: 2.4rem; padding: 0 2rem 0 0.65rem; border: 1px solid var(--border, #ccc); border-radius: 4px; background: var(--background, #fff); color: var(--text-primary, #333); font: inherit; cursor: pointer; }
    .table-wrap { overflow-x: auto; }

    table {
      border-collapse: collapse;
      font-size: 0.875rem;
      border: 0;
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
    .icon-iwork { color: #5c6bc0; }
    .icon-epub, .icon-mobi, .icon-azw3 { color: #009688; }
    .icon-archive { color: #8d6e63; }
    .icon-image { color: #e91e63; }
    .icon-psd { color: #1976d2; }
    .icon-dicom { color: #00838f; }
    .icon-audio { color: #00bcd4; }
    .icon-video { color: #9c27b0; }
    .icon-three { color: #ff9800; }
    .icon-csv { color: #4caf50; }
    .icon-sqlite { color: #003b57; }
    .icon-parquet { color: #7a5c00; }
    .icon-notebook { color: #d05a24; }
    .icon-torrent { color: #3f51b5; }
    .icon-wasm { color: #795548; }
    .icon-tab { color: #ff5722; }
    .icon-email { color: #2196f3; }
    .icon-mbox { color: #0277bd; }
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
    .icon-fiddler { color: #1565c0; }
    .icon-clipboard { color: #7e57c2; }
    .icon-url { color: #0288d1; }
    .icon-ffmpeg { color: #7b1fa2; }
    .icon-mermaid { color: #ff3670; }
    .icon-graphviz { color: #0d47a1; }
    .icon-vega { color: #4c78a8; }
    .icon-drawio { color: #f08705; }
    .icon-excalidraw { color: #6965db; }
    .icon-geojson { color: #2e7d32; }
    .icon-plantuml { color: #c62828; }

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

    .empty { padding: 2rem; text-align: center; color: var(--text-muted, #666); }
    .expand { display: flex; justify-content: center; padding: 0.75rem; border-top: 1px solid var(--border, #ddd); background: var(--surface, #f5f5f5); }
    .expand button { min-height: 2.25rem; padding: 0 0.85rem; border: 1px solid var(--border, #ccc); border-radius: 4px; background: var(--background, #fff); color: var(--text-primary, #333); cursor: pointer; }
    @media (max-width: 640px) { .controls { align-items: stretch; flex-direction: column; } .search { flex: none; width: 100%; } .category-filter { justify-content: space-between; } .category-select { flex: 1; max-width: 13rem; } .result-count { align-self: flex-end; } th, td { padding: 0.65rem 0.75rem; } }
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

  @state()
  private activeCategory: CategoryFilter = 'all';

  @state()
  private query = '';

  @state()
  private expanded = false;

  private getDisplayName(nameKey: string, defaultName: string): string {
    return t(nameKey, defaultName);
  }

  private getFilteredTypes() {
    const category = this.category || this.activeCategory;
    const query = this.query.trim().toLowerCase().replace(/^\./, '');
    return SUPPORTED_FILE_TYPES.filter(fileType => {
      const matchesCategory = category === 'all' || fileType.category === category;
      const searchable = `${fileType.defaultName} ${fileType.extensions.join(' ')} ${fileType.category}`.toLowerCase();
      return matchesCategory && (!query || searchable.includes(query));
    });
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
      case 'iwork':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h7v8H3V4c0-.55.45-1 1-1zm9 0h7c.55 0 1 .45 1 1v7h-8V3zM3 13h8v8H4c-.55 0-1-.45-1-1v-7zm10 0h8v7c0 .55-.45 1-1 1h-7v-8zM5 5v4h4V5H5zm10 0v4h4V5h-4zM5 15v4h4v-4H5zm10 0v4h4v-4h-4z"/></svg>
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
      case 'psd':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 7l10 5 10-5-10-5zm-7.5 9.5L2 12.75l10 5 10-5-2.5-1.25L12 15.25 4.5 11.5zm0 5L2 17.75l10 5 10-5-2.5-1.25L12 20.25 4.5 16.5z"/></svg>
        </span>`;
      case 'dicom':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 3h5v2H5v4H3V4c0-.55.45-1 1-1zm11 0h5c.55 0 1 .45 1 1v5h-2V5h-4V3zM3 15h2v4h4v2H4c-.55 0-1-.45-1-1v-5zm16 0h2v5c0 .55-.45 1-1 1h-5v-2h4v-4zM11 7h2v4h4v2h-4v4h-2v-4H7v-2h4V7z"/></svg>
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
      case 'parquet':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h5v18H3V3zm6 0h5v8H9V3zm0 9h5v9H9v-9zm6-9h6v5h-6V3zm0 6h6v6h-6V9zm0 7h6v5h-6v-5z"/></svg>
        </span>`;
      case 'notebook':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3h2v2h10V3h2v2h1c.55 0 1 .45 1 1v14c0 .55-.45 1-1 1h-1v2h-2v-2H7v2H5v-2H4c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h1V3zm2 4H5v12h14V7h-2v2h-2V7H9v2H7V7zm2 5h6v2H9v-2zm0 4h4v2H9v-2z"/></svg>
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
      case 'mbox':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 10h-4c0 1.66-1.34 3-3 3s-3-1.34-3-3H5V5h14v8zM7 7h10v2H7V7zm0 3h10v2H7v-2z"/></svg>
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
      case 'fiddler':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5.5-2.5l7.51-3.49L17.5 6.5 9.99 9.99 6.5 17.5zm5.5-6.6c.61 0 1.1.49 1.1 1.1s-.49 1.1-1.1 1.1-1.1-.49-1.1-1.1.49-1.1 1.1-1.1z"/></svg>
        </span>`;
      case 'clipboard':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/></svg>
        </span>`;
      case 'url':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>
        </span>`;
      case 'ffmpeg':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4zm-6.5 9.5L10 12l1.5-1.5L10 9l2-2 4 4-4 4-2-2z"/></svg>
        </span>`;
      case 'mermaid':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5zm4 4h-2v-2h2v2zm0-4h-2V7h2v5z"/><path d="M5 8l3 3-3 3M19 8l-3 3 3 3" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>`;
      case 'graphviz':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="12" cy="18" r="3"/><line x1="6" y1="9" x2="12" y2="15" stroke="currentColor" stroke-width="2"/><line x1="18" y1="9" x2="12" y2="15" stroke="currentColor" stroke-width="2"/></svg>
        </span>`;
      case 'vega':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zm0-4h8v-2H5v2zm0-4h14v-2H5v2zm0-4h8V6H5v2zm0-6v2h14V2H5z" opacity=".3"/><path d="M3 22h18V2H3v20zM5 4h4v4H5V4zm0 6h14v2H5v-2zm0 4h8v2H5v-2zm0 4h14v2H5v-2z"/></svg>
        </span>`;
      case 'drawio':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="3" width="8" height="6" rx="1"/><rect x="14" y="3" width="8" height="6" rx="1"/><rect x="8" y="15" width="8" height="6" rx="1"/><line x1="6" y1="9" x2="6" y2="12" stroke="currentColor" stroke-width="2"/><line x1="18" y1="9" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="15" stroke="currentColor" stroke-width="2"/></svg>
        </span>`;
      case 'excalidraw':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
        </span>`;
      case 'geojson':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </span>`;
      case 'plantuml':
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v2H3V3zm0 4h8v2H3V7zm0 4h8v2H3v-2zm12-8h6v2h-6V3zm0 4h6v2h-6V7zm0 4h6v2h-6v-2z"/><path d="M9 15l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>`;
      default:
        return html`<span class="${iconClass}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
        </span>`;
    }
  }

  render() {
    const filteredTypes = this.getFilteredTypes();
    const isBrowsing = this.expanded || Boolean(this.query) || this.activeCategory !== 'all' || Boolean(this.category);
    const types = isBrowsing ? filteredTypes : filteredTypes.filter(fileType => FEATURED_TYPE_IDS.has(fileType.id));

    return html`
      <div class="browser">
        <div class="controls">
          <input class="search" type="search" placeholder=${t('search-formats', 'Search formats or extensions')} .value=${this.query} @input=${(event: InputEvent) => this.query = (event.target as HTMLInputElement).value}>
          ${this.category ? null : html`<label class="category-filter">
            <span>${t('category-header', 'Category')}</span>
            <select class="category-select" .value=${this.activeCategory} @change=${(event: Event) => this.activeCategory = (event.target as HTMLSelectElement).value as CategoryFilter}>
              ${CATEGORIES.map(category => html`<option value=${category.id}>${t(`category-${category.id}`, category.label)}</option>`)}
            </select>
          </label>`}
          <span class="result-count">${filteredTypes.length} ${filteredTypes.length === 1 ? t('format', 'format') : t('formats', 'formats')}</span>
        </div>
        <div class="table-wrap">
          ${types.length ? html`<table>
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
          </table>` : html`<div class="empty">${t('no-matching-formats', 'No matching formats')}</div>`}
        </div>
        ${!isBrowsing && filteredTypes.length > types.length ? html`<div class="expand"><button @click=${() => this.expanded = true}>${t('view-all-formats', 'View all supported formats')} (${filteredTypes.length})</button></div>` : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'supported-files-list': SupportedFilesList;
  }
}
