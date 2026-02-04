import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { createArchiveWorker } from '../../common/archive-worker';
import type { ArchiveEntry } from '@webexplorer/archive';
import './folder-viewer';

type FileSystemItem = {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: bigint;
  entry?: ArchiveEntry;
  children?: Map<string, FileSystemItem>;
};

@customElement('archive-viewer')
export class ArchiveViewer extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    .archive-viewer {
      padding: 1rem;
    }
    .archive-navigation {
      margin-bottom: 1rem;
    }
    .archive-breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0.5rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }
    .breadcrumb-item {
      display: flex;
      align-items: center;
    }
    .breadcrumb-button {
      background: none;
      border: none;
      color: var(--primary, #0078d4);
      cursor: pointer;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .breadcrumb-button:hover {
      background: var(--surface-hover, #e0e0e0);
    }
    .breadcrumb-divider {
      color: var(--text-muted, #999);
      margin: 0 0.25rem;
    }
    .breadcrumb-current {
      color: var(--text, #333);
      padding: 0.25rem 0.5rem;
    }
    .archive-error-message {
      color: var(--error, #d32f2f);
      text-align: center;
      padding: 2rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private entries: ArchiveEntry[] = [];

  @state()
  private currentPath = '';

  @state()
  private viewMode: 'folder' | 'file' = 'folder';

  @state()
  private selectedFile: ArchiveEntry | null = null;

  @state()
  private extractedFile: File | null = null;

  private worker = createArchiveWorker();

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadArchive();
    }
  }

  private async loadArchive() {
    if (!this.file) return;

    await this.worker.init();
    await this.worker.open(this.file, '');
    const entries = await this.worker.entries();
    this.entries = entries;
  }

  private get fileSystem(): Map<string, FileSystemItem> {
    const root = new Map<string, FileSystemItem>();

    this.entries.forEach((entry) => {
      const path = entry.path;
      const parts = path.split('/').filter(Boolean);

      let current = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += (currentPath ? '/' : '') + part;
        const isLast = index === parts.length - 1;

        if (!current.has(part)) {
          const item: FileSystemItem = {
            name: part,
            path: currentPath,
            type: isLast && entry.type === 32768 ? 'file' : 'directory',
            size: isLast && entry.type === 32768 ? entry.size : undefined,
            entry: isLast && entry.type === 32768 ? entry : undefined,
            children: new Map(),
          };
          current.set(part, item);
        }

        const item = current.get(part)!;
        if (!isLast && item.children) {
          current = item.children;
        }
      });
    });

    return root;
  }

  private get currentItems(): FileSystemItem[] {
    if (!this.currentPath) {
      return Array.from(this.fileSystem.values());
    }

    const parts = this.currentPath.split('/').filter(Boolean);
    let current = this.fileSystem;

    for (const part of parts) {
      const item = current.get(part);
      if (item?.children) {
        current = item.children;
      } else {
        return [];
      }
    }

    return Array.from(current.values());
  }

  private get folderItems() {
    return this.currentItems.map((item) => ({
      name: item.name,
      path: item.path,
      type: item.type,
      size: item.size,
      entry: item.entry,
    }));
  }

  private get breadcrumbParts(): string[] {
    if (!this.currentPath) return [];
    return this.currentPath.split('/').filter(Boolean);
  }

  private handleNavigate(path: string) {
    this.currentPath = path;
    this.viewMode = 'folder';
    this.selectedFile = null;
    this.extractedFile = null;
  }

  private handleItemClick(e: CustomEvent) {
    const item = e.detail;
    if (item.type === 'directory') {
      this.handleNavigate(item.path);
    } else if (item.entry) {
      const entry = item.entry as ArchiveEntry;
      this.selectedFile = entry;
      this.viewMode = 'file';

      if (entry.data) {
        const uint8Array = new Uint8Array(entry.data);
        const blob = new Blob([uint8Array]);
        const extractedFile = new File([blob], item.name, { type: '' });
        this.extractedFile = extractedFile;
      } else {
        this.extractedFile = null;
      }
    }
  }

  render() {
    return html`
      <div class="archive-viewer">
        <div class="archive-navigation">
          <nav class="archive-breadcrumb">
            <div class="breadcrumb-item">
              <button class="breadcrumb-button" @click=${() => this.handleNavigate('')}>
                ${this.file?.name}
              </button>
            </div>
            ${this.breadcrumbParts.map((part, index) => {
              const path = this.breadcrumbParts.slice(0, index + 1).join('/');
              return html`
                <span class="breadcrumb-item">
                  <span class="breadcrumb-divider">/</span>
                  <button class="breadcrumb-button" @click=${() => this.handleNavigate(path)}>
                    ${part}
                  </button>
                </span>
              `;
            })}
            ${this.viewMode === 'file' && this.selectedFile ? html`
              <span class="breadcrumb-item">
                <span class="breadcrumb-divider">/</span>
                <span class="breadcrumb-current">${this.selectedFile.name}</span>
              </span>
            ` : ''}
          </nav>
        </div>
        ${this.viewMode === 'folder' ? html`
          <folder-viewer
            .items=${this.folderItems}
            @item-click=${this.handleItemClick}
          ></folder-viewer>
        ` : html`
          <div class="archive-file-viewer">
            <div class="archive-file-content">
              ${this.extractedFile ? html`
                <file-viewer .file=${this.extractedFile}></file-viewer>
              ` : html`
                <p class="archive-error-message">Failed to extract file.</p>
              `}
            </div>
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'archive-viewer': ArchiveViewer;
  }
}
