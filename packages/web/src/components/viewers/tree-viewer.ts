import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface TreeNode {
  key: string;
  value: unknown;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: TreeNode[];
  expanded?: boolean;
  depth: number;
}

@customElement('tree-viewer')
export class TreeViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
    }

    .container {
      padding: 1rem;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .toolbar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .toolbar button {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      background: var(--background, #fff);
      color: var(--text-primary, #333);
      border-radius: 4px;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .toolbar button:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    .toolbar button svg {
      width: 1rem;
      height: 1rem;
    }

    .search-box {
      flex: 1;
      max-width: 300px;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 0.8125rem;
      outline: none;
    }

    .search-box:focus {
      border-color: var(--primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .stats {
      margin-left: auto;
      font-size: 0.8125rem;
      color: var(--text-muted, #666);
      display: flex;
      align-items: center;
    }

    .node {
      display: flex;
      flex-direction: column;
    }

    .node-row {
      display: flex;
      align-items: flex-start;
      padding: 0.125rem 0;
      border-radius: 2px;
    }

    .node-row:hover {
      background: var(--surface-hover, #f0f0f0);
    }

    .node-row.highlight {
      background: rgba(255, 235, 59, 0.3);
    }

    .toggle {
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      color: var(--text-muted, #666);
      user-select: none;
    }

    .toggle:hover {
      color: var(--text-primary, #333);
    }

    .toggle svg {
      width: 0.75rem;
      height: 0.75rem;
      transition: transform 0.15s;
    }

    .toggle.expanded svg {
      transform: rotate(90deg);
    }

    .toggle.leaf {
      visibility: hidden;
    }

    .key {
      color: var(--json-key, #881391);
      margin-right: 0.25rem;
    }

    .key::after {
      content: ':';
      color: var(--text-muted, #666);
    }

    .array-index {
      color: var(--text-muted, #666);
      margin-right: 0.25rem;
    }

    .array-index::after {
      content: ':';
    }

    .value {
      word-break: break-word;
    }

    .value.string {
      color: var(--json-string, #0b7500);
    }

    .value.string::before,
    .value.string::after {
      content: '"';
      color: var(--json-string, #0b7500);
    }

    .value.number {
      color: var(--json-number, #1750eb);
    }

    .value.boolean {
      color: var(--json-boolean, #d32f2f);
    }

    .value.null {
      color: var(--json-null, #9e9e9e);
      font-style: italic;
    }

    .bracket {
      color: var(--text-muted, #666);
    }

    .bracket.open::after {
      content: ' ';
    }

    .collapsed-preview {
      color: var(--text-muted, #999);
      font-style: italic;
      margin-left: 0.25rem;
    }

    .children {
      margin-left: 1.25rem;
      border-left: 1px dashed var(--border-light, #ddd);
      padding-left: 0.25rem;
    }

    /* XML specific styles */
    .tag-name {
      color: var(--xml-tag, #881391);
    }

    .attr-name {
      color: var(--xml-attr, #994500);
    }

    .attr-value {
      color: var(--xml-attr-value, #0b7500);
    }

    .text-content {
      color: var(--text-primary, #333);
    }

    .comment {
      color: var(--xml-comment, #6a737d);
      font-style: italic;
    }

    .cdata {
      color: var(--xml-cdata, #6a737d);
      background: var(--surface-alt, #f5f5f5);
      padding: 0 0.25rem;
      border-radius: 2px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-muted, #666);
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: var(--error, #dc2626);
    }

    .error pre {
      margin-top: 1rem;
      padding: 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-radius: 4px;
      text-align: left;
      overflow-x: auto;
      font-size: 0.8125rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private tree: TreeNode | null = null;

  @state()
  private fileType: 'json' | 'xml' = 'json';

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private errorDetail: string | null = null;

  @state()
  private searchQuery = '';

  @state()
  private nodeCount = 0;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.errorDetail = null;
    this.tree = null;
    this.nodeCount = 0;

    try {
      const text = await this.file.text();
      const ext = this.file.name.split('.').pop()?.toLowerCase();

      if (ext === 'xml' || ext === 'svg' || ext === 'html' || ext === 'xhtml') {
        this.fileType = 'xml';
        this.tree = this.parseXML(text);
      } else {
        this.fileType = 'json';
        this.tree = this.parseJSON(text);
      }
    } catch (e) {
      if (e instanceof Error) {
        this.error = e.message;
        if (e.name === 'SyntaxError') {
          this.errorDetail = e.message;
        }
      } else {
        this.error = 'Failed to parse file';
      }
    } finally {
      this.loading = false;
    }
  }

  private parseJSON(text: string): TreeNode {
    const data = JSON.parse(text);
    return this.buildTree('root', data, 0);
  }

  private parseXML(text: string): TreeNode {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'application/xml');
    
    const errorNode = doc.querySelector('parsererror');
    if (errorNode) {
      throw new Error('Invalid XML: ' + errorNode.textContent);
    }

    return this.buildXMLTree(doc.documentElement, 0);
  }

  private buildTree(key: string, value: unknown, depth: number): TreeNode {
    this.nodeCount++;
    
    if (value === null) {
      return { key, value, type: 'null', depth };
    }

    if (Array.isArray(value)) {
      const children = value.map((item, index) => 
        this.buildTree(String(index), item, depth + 1)
      );
      return { 
        key, 
        value, 
        type: 'array', 
        children, 
        expanded: depth < 2,
        depth 
      };
    }

    if (typeof value === 'object') {
      const children = Object.entries(value).map(([k, v]) => 
        this.buildTree(k, v, depth + 1)
      );
      return { 
        key, 
        value, 
        type: 'object', 
        children, 
        expanded: depth < 2,
        depth 
      };
    }

    return { 
      key, 
      value, 
      type: typeof value as 'string' | 'number' | 'boolean',
      depth 
    };
  }

  private buildXMLTree(element: Element, depth: number): TreeNode {
    this.nodeCount++;
    
    const children: TreeNode[] = [];
    
    // Add attributes as special children
    for (const attr of element.attributes) {
      children.push({
        key: `@${attr.name}`,
        value: attr.value,
        type: 'string',
        depth: depth + 1,
      });
    }

    // Add child elements
    for (const child of element.childNodes) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(this.buildXMLTree(child as Element, depth + 1));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) {
          children.push({
            key: '#text',
            value: text,
            type: 'string',
            depth: depth + 1,
          });
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        children.push({
          key: '#comment',
          value: child.textContent,
          type: 'string',
          depth: depth + 1,
        });
      } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
        children.push({
          key: '#cdata',
          value: child.textContent,
          type: 'string',
          depth: depth + 1,
        });
      }
    }

    return {
      key: element.tagName,
      value: null,
      type: 'object',
      children: children.length > 0 ? children : undefined,
      expanded: depth < 2,
      depth,
    };
  }

  private toggleNode(node: TreeNode) {
    node.expanded = !node.expanded;
    this.requestUpdate();
  }

  private expandAll(node: TreeNode = this.tree!) {
    if (node.children) {
      node.expanded = true;
      node.children.forEach(child => this.expandAll(child));
    }
    this.requestUpdate();
  }

  private collapseAll(node: TreeNode = this.tree!) {
    if (node.children) {
      node.expanded = false;
      node.children.forEach(child => this.collapseAll(child));
    }
    this.requestUpdate();
  }

  private matchesSearch(node: TreeNode): boolean {
    if (!this.searchQuery) return false;
    const query = this.searchQuery.toLowerCase();
    
    if (node.key.toLowerCase().includes(query)) return true;
    if (node.value !== null && 
        typeof node.value !== 'object' && 
        String(node.value).toLowerCase().includes(query)) {
      return true;
    }
    return false;
  }

  private getCollapsedPreview(node: TreeNode): string {
    if (!node.children) return '';
    
    if (node.type === 'array') {
      return `${node.children.length} items`;
    }
    
    if (node.type === 'object') {
      if (this.fileType === 'xml') {
        return `...`;
      }
      const keys = node.children.slice(0, 3).map(c => c.key);
      const suffix = node.children.length > 3 ? ', ...' : '';
      return `{ ${keys.join(', ')}${suffix} }`;
    }
    
    return '';
  }

  private renderNode(node: TreeNode): unknown {
    const hasChildren = !!(node.children && node.children.length > 0);
    const isExpanded = !!node.expanded;
    const isHighlighted = this.matchesSearch(node);
    const isArrayItem = node.depth > 0 && /^\d+$/.test(node.key);

    return html`
      <div class="node">
        <div class="node-row ${isHighlighted ? 'highlight' : ''}">
          <span 
            class="toggle ${hasChildren ? (isExpanded ? 'expanded' : '') : 'leaf'}"
            @click=${() => hasChildren && this.toggleNode(node)}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </span>
          
          ${node.depth === 0 && this.fileType === 'json' ? nothing : 
            isArrayItem 
              ? html`<span class="array-index">${node.key}</span>`
              : this.fileType === 'xml' && !node.key.startsWith('@') && !node.key.startsWith('#')
                ? html`<span class="tag-name">&lt;${node.key}&gt;</span>`
                : node.key.startsWith('@')
                  ? html`<span class="attr-name">${node.key.slice(1)}</span><span>=</span>`
                  : node.key.startsWith('#')
                    ? nothing
                    : html`<span class="key">${node.key}</span>`
          }
          
          ${this.renderValue(node, hasChildren, isExpanded)}
        </div>
        
        ${hasChildren && isExpanded ? html`
          <div class="children">
            ${node.children!.map(child => this.renderNode(child))}
          </div>
        ` : nothing}
      </div>
    `;
  }

  private renderValue(node: TreeNode, hasChildren: boolean, isExpanded: boolean) {
    if (node.type === 'array') {
      if (!isExpanded && hasChildren) {
        return html`
          <span class="bracket open">[</span>
          <span class="collapsed-preview">${this.getCollapsedPreview(node)}</span>
          <span class="bracket">]</span>
        `;
      }
      return html`<span class="bracket">[${!hasChildren ? ']' : ''}</span>`;
    }

    if (node.type === 'object') {
      if (this.fileType === 'xml') {
        if (!isExpanded && hasChildren) {
          return html`<span class="collapsed-preview">${this.getCollapsedPreview(node)}</span>`;
        }
        return nothing;
      }
      
      if (!isExpanded && hasChildren) {
        return html`
          <span class="bracket open">{</span>
          <span class="collapsed-preview">${this.getCollapsedPreview(node)}</span>
          <span class="bracket">}</span>
        `;
      }
      return html`<span class="bracket">{${!hasChildren ? '}' : ''}</span>`;
    }

    if (node.key === '#comment') {
      return html`<span class="comment">&lt;!-- ${node.value} --&gt;</span>`;
    }

    if (node.key === '#cdata') {
      return html`<span class="cdata">&lt;![CDATA[${node.value}]]&gt;</span>`;
    }

    if (node.key === '#text') {
      return html`<span class="text-content">${node.value}</span>`;
    }

    if (node.key.startsWith('@')) {
      return html`<span class="attr-value">"${node.value}"</span>`;
    }

    return html`<span class="value ${node.type}">${node.type === 'null' ? 'null' : String(node.value)}</span>`;
  }

  private renderToolbar() {
    return html`
      <div class="toolbar">
        <button @click=${() => this.expandAll()} title="${t('expand-all', 'Expand All')}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 5.83L15.17 9l1.41-1.41L12 3 7.41 7.59 8.83 9 12 5.83zm0 12.34L8.83 15l-1.41 1.41L12 21l4.59-4.59L15.17 15 12 18.17z"/>
          </svg>
          ${t('expand-all', 'Expand All')}
        </button>
        <button @click=${() => this.collapseAll()} title="${t('collapse-all', 'Collapse All')}">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 18.59L8.83 20 12 16.83 15.17 20l1.41-1.41L12 14l-4.59 4.59zm9.18-13.18L15.17 4 12 7.17 8.83 4 7.41 5.41 12 10l4.59-4.59z"/>
          </svg>
          ${t('collapse-all', 'Collapse All')}
        </button>
        <input 
          type="text" 
          class="search-box"
          placeholder="${t('search', 'Search...')}"
          .value=${this.searchQuery}
          @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
        />
        <div class="stats">
          ${this.nodeCount} ${t('nodes', 'nodes')}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`
        <div class="error">
          <div>${this.error}</div>
          ${this.errorDetail ? html`<pre>${this.errorDetail}</pre>` : nothing}
        </div>
      `;
    }

    if (!this.tree) {
      return html`<div class="error">No data to display</div>`;
    }

    return html`
      ${this.renderToolbar()}
      <div class="container">
        ${this.renderNode(this.tree)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tree-viewer': TreeViewer;
  }
}
