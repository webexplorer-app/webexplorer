import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface FolderItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: bigint | number;
  [key: string]: unknown;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get icon type based on file extension
 */
function getIconType(item: FolderItem): string {
  if (item.type === 'directory') return 'folder';
  
  const ext = getFileExtension(item.name);
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff'].includes(ext)) {
    return 'image';
  }
  
  // Videos
  if (['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'].includes(ext)) {
    return 'video';
  }
  
  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)) {
    return 'audio';
  }
  
  // Documents
  if (['pdf'].includes(ext)) {
    return 'pdf';
  }
  if (['doc', 'docx', 'odt', 'rtf'].includes(ext)) {
    return 'document';
  }
  if (['xls', 'xlsx', 'ods', 'csv'].includes(ext)) {
    return 'spreadsheet';
  }
  if (['ppt', 'pptx', 'odp'].includes(ext)) {
    return 'presentation';
  }
  
  // Code/Text
  if (['txt', 'md', 'markdown'].includes(ext)) {
    return 'text';
  }
  if (['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs'].includes(ext)) {
    return 'javascript';
  }
  if (['html', 'htm', 'xml', 'xhtml'].includes(ext)) {
    return 'html';
  }
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return 'css';
  }
  if (['json', 'yaml', 'yml', 'toml'].includes(ext)) {
    return 'config';
  }
  if (['py', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'go', 'rs', 'swift', 'kt'].includes(ext)) {
    return 'code';
  }
  
  // Archives
  if (['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz', 'tgz'].includes(ext)) {
    return 'archive';
  }
  
  // Executables
  if (['exe', 'msi', 'dmg', 'app', 'deb', 'rpm', 'apk'].includes(ext)) {
    return 'executable';
  }
  
  // Ebooks
  if (['epub', 'mobi', 'azw', 'azw3'].includes(ext)) {
    return 'ebook';
  }
  
  // Fonts
  if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(ext)) {
    return 'font';
  }
  
  return 'file';
}

@customElement('folder-viewer')
export class FolderViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .folder-viewer {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      background: var(--background, #fff);
    }
    .folder-empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted, #666);
    }
    .folder-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .folder-list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-light, #eee);
      cursor: pointer;
      transition: background-color 0.1s;
      color: var(--text, #333);
    }
    .folder-list-item:hover {
      background-color: var(--surface-hover, #f5f5f5);
    }
    .folder-list-item:last-child {
      border-bottom: none;
    }
    .folder-item-name {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }
    .folder-item-icon {
      width: 1.25rem;
      height: 1.25rem;
      flex-shrink: 0;
    }
    .folder-item-icon svg {
      width: 100%;
      height: 100%;
    }
    .icon-folder { color: #f0c14b; }
    .icon-image { color: #e91e63; }
    .icon-video { color: #9c27b0; }
    .icon-audio { color: #00bcd4; }
    .icon-pdf { color: #f44336; }
    .icon-document { color: #2196f3; }
    .icon-spreadsheet { color: #4caf50; }
    .icon-presentation { color: #ff9800; }
    .icon-text { color: #607d8b; }
    .icon-code { color: #795548; }
    .icon-javascript { color: #ffeb3b; }
    .icon-html { color: #ff5722; }
    .icon-css { color: #03a9f4; }
    .icon-config { color: #9e9e9e; }
    .icon-archive { color: #8d6e63; }
    .icon-executable { color: #3f51b5; }
    .icon-ebook { color: #009688; }
    .icon-font { color: #673ab7; }
    .icon-file { color: #9e9e9e; }
    .folder-item-details {
      font-size: 0.75rem;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  items: FolderItem[] = [];

  private get sortedItems(): FolderItem[] {
    return [...this.items].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  private formatSize(size?: bigint | number): string {
    if (!size) return '';
    const numSize = typeof size === 'bigint' ? Number(size) : size;
    if (numSize < 1024) return `${numSize} B`;
    if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(1)} KB`;
    if (numSize < 1024 * 1024 * 1024) return `${(numSize / (1024 * 1024)).toFixed(1)} MB`;
    return `${(numSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  private renderIcon(item: FolderItem) {
    const iconType = getIconType(item);
    
    switch (iconType) {
      case 'folder':
        return html`<span class="folder-item-icon icon-folder">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
        </span>`;
      case 'image':
        return html`<span class="folder-item-icon icon-image">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </span>`;
      case 'video':
        return html`<span class="folder-item-icon icon-video">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/></svg>
        </span>`;
      case 'audio':
        return html`<span class="folder-item-icon icon-audio">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
        </span>`;
      case 'pdf':
        return html`<span class="folder-item-icon icon-pdf">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>
        </span>`;
      case 'document':
        return html`<span class="folder-item-icon icon-document">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>
        </span>`;
      case 'spreadsheet':
        return html`<span class="folder-item-icon icon-spreadsheet">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 2v3H5V5h14zm-9 5h4v9h-4v-9zm-5 0h4v9H5v-9zm14 9h-4v-9h4v9z"/></svg>
        </span>`;
      case 'presentation':
        return html`<span class="folder-item-icon icon-presentation">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM13.5 13v-2.5H16V9h-2.5V6.5H12V9H9.5v1.5H12V13z"/></svg>
        </span>`;
      case 'text':
        return html`<span class="folder-item-icon icon-text">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
        </span>`;
      case 'code':
      case 'javascript':
      case 'html':
      case 'css':
        return html`<span class="folder-item-icon icon-${iconType}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
        </span>`;
      case 'config':
        return html`<span class="folder-item-icon icon-config">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>
        </span>`;
      case 'archive':
        return html`<span class="folder-item-icon icon-archive">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg>
        </span>`;
      case 'executable':
        return html`<span class="folder-item-icon icon-executable">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10v-2h-2v-2h2v-2l4 3-4 3z"/></svg>
        </span>`;
      case 'ebook':
        return html`<span class="folder-item-icon icon-ebook">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/></svg>
        </span>`;
      case 'font':
        return html`<span class="folder-item-icon icon-font">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></svg>
        </span>`;
      default:
        return html`<span class="folder-item-icon icon-file">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
        </span>`;
    }
  }

  private handleItemClick(item: FolderItem) {
    this.dispatchEvent(new CustomEvent('item-click', {
      detail: item,
      bubbles: true,
      composed: true
    }));
  }

  render() {
    if (this.sortedItems.length === 0) {
      return html`
        <div class="folder-viewer">
          <div class="folder-empty">Empty folder</div>
        </div>
      `;
    }

    return html`
      <div class="folder-viewer">
        <ul class="folder-list">
          ${this.sortedItems.map(item => html`
            <li class="folder-list-item" @click=${() => this.handleItemClick(item)}>
              <div class="folder-item-name">
                ${this.renderIcon(item)}
                ${item.name}
              </div>
              ${item.type === 'file' && item.size ? html`
                <div class="folder-item-details">${this.formatSize(item.size)}</div>
              ` : nothing}
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'folder-viewer': FolderViewer;
  }
}
