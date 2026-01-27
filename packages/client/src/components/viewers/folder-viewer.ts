import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface FolderItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: bigint | number;
  [key: string]: unknown;
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
      font-size: 0.875rem;
    }
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
                ${item.type === 'directory' ? '[DIR] ' : ''}${item.name}
              </div>
              ${item.type === 'file' && item.size ? html`
                <div class="folder-item-details">${this.formatSize(item.size)}</div>
              ` : ''}
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
