import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface LogEntry {
  line: number;
  text: string;
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'unknown';
  timestamp?: string;
}

@customElement('log-viewer')
export class LogViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--log-bg, #1e1e1e);
      color: var(--log-text, #d4d4d4);
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.8125rem;
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--log-toolbar, #252526);
      border-bottom: 1px solid var(--log-border, #3c3c3c);
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 200px;
      max-width: 400px;
      padding: 0.375rem 0.75rem;
      background: var(--log-input-bg, #3c3c3c);
      border: 1px solid var(--log-border, #3c3c3c);
      border-radius: 4px;
      color: var(--log-text, #d4d4d4);
      font-size: 0.8125rem;
      outline: none;
    }

    .search-box:focus {
      border-color: var(--primary, #0078d4);
    }

    .search-box::placeholder {
      color: var(--log-muted, #808080);
    }

    .filter-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .filter-btn {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: 1px solid var(--log-border, #3c3c3c);
      border-radius: 4px;
      color: var(--log-muted, #808080);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-btn:hover {
      border-color: var(--log-text, #d4d4d4);
      color: var(--log-text, #d4d4d4);
    }

    .filter-btn.active {
      background: var(--log-active, #094771);
      border-color: var(--primary, #0078d4);
      color: var(--log-text, #d4d4d4);
    }

    .filter-btn .count {
      background: rgba(255,255,255,0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 10px;
      font-size: 0.6875rem;
    }

    .filter-btn.error { color: #f48771; }
    .filter-btn.error.active { background: rgba(244, 135, 113, 0.2); border-color: #f48771; }
    
    .filter-btn.warn { color: #cca700; }
    .filter-btn.warn.active { background: rgba(204, 167, 0, 0.2); border-color: #cca700; }
    
    .filter-btn.info { color: #3794ff; }
    .filter-btn.info.active { background: rgba(55, 148, 255, 0.2); border-color: #3794ff; }
    
    .filter-btn.debug { color: #b5cea8; }
    .filter-btn.debug.active { background: rgba(181, 206, 168, 0.2); border-color: #b5cea8; }

    .stats {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--log-muted, #808080);
    }

    .log-content {
      flex: 1;
      overflow: auto;
      padding: 0;
    }

    .log-table {
      width: 100%;
      border-collapse: collapse;
    }

    .log-row {
      display: flex;
      border-bottom: 1px solid var(--log-border-light, #2d2d2d);
    }

    .log-row:hover {
      background: var(--log-hover, #2a2d2e);
    }

    .log-row.error {
      background: rgba(244, 135, 113, 0.1);
    }

    .log-row.error:hover {
      background: rgba(244, 135, 113, 0.15);
    }

    .log-row.warn {
      background: rgba(204, 167, 0, 0.1);
    }

    .log-row.warn:hover {
      background: rgba(204, 167, 0, 0.15);
    }

    .line-number {
      flex-shrink: 0;
      width: 50px;
      padding: 0.25rem 0.5rem;
      text-align: right;
      color: var(--log-muted, #808080);
      background: var(--log-gutter, #1e1e1e);
      border-right: 1px solid var(--log-border, #3c3c3c);
      user-select: none;
    }

    .log-level {
      flex-shrink: 0;
      width: 60px;
      padding: 0.25rem 0.5rem;
      text-transform: uppercase;
      font-size: 0.6875rem;
      font-weight: 600;
      text-align: center;
    }

    .log-level.error { color: #f48771; }
    .log-level.warn { color: #cca700; }
    .log-level.info { color: #3794ff; }
    .log-level.debug { color: #b5cea8; }
    .log-level.trace { color: #808080; }
    .log-level.unknown { color: #808080; }

    .log-timestamp {
      flex-shrink: 0;
      width: 180px;
      padding: 0.25rem 0.5rem;
      color: var(--log-timestamp, #6a9955);
    }

    .log-message {
      flex: 1;
      padding: 0.25rem 0.5rem;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .highlight {
      background: rgba(255, 235, 59, 0.4);
      border-radius: 2px;
    }

    /* Syntax highlighting within messages */
    .log-message .string { color: #ce9178; }
    .log-message .number { color: #b5cea8; }
    .log-message .keyword { color: #569cd6; }
    .log-message .url { color: #3794ff; text-decoration: underline; }
    .log-message .path { color: #dcdcaa; }
    .log-message .json-key { color: #9cdcfe; }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--log-muted, #808080);
    }

    .error-msg {
      padding: 2rem;
      text-align: center;
      color: #f48771;
    }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--log-muted, #808080);
    }

    .empty svg {
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private entries: LogEntry[] = [];

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private searchQuery = '';

  @state()
  private activeFilters: Set<string> = new Set(['error', 'warn', 'info', 'debug', 'trace', 'unknown']);

  @state()
  private levelCounts: Record<string, number> = {};

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.entries = [];
    this.levelCounts = { error: 0, warn: 0, info: 0, debug: 0, trace: 0, unknown: 0 };

    try {
      const text = await this.file.text();
      const lines = text.split('\n');
      
      this.entries = lines.map((line, index) => {
        const entry = this.parseLine(line, index + 1);
        this.levelCounts[entry.level]++;
        return entry;
      }).filter(entry => entry.text.trim());

    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load log file';
    } finally {
      this.loading = false;
    }
  }

  private parseLine(text: string, lineNumber: number): LogEntry {
    const level = this.detectLevel(text);
    const timestamp = this.extractTimestamp(text);
    
    return {
      line: lineNumber,
      text: text.trim(),
      level,
      timestamp,
    };
  }

  private detectLevel(text: string): LogEntry['level'] {
    // Check for common log level patterns
    if (/\b(error|fatal|critical|exception|fail(ed)?)\b/i.test(text)) {
      return 'error';
    }
    if (/\b(warn(ing)?|caution)\b/i.test(text)) {
      return 'warn';
    }
    if (/\b(info(rmation)?)\b/i.test(text)) {
      return 'info';
    }
    if (/\bdebug\b/i.test(text)) {
      return 'debug';
    }
    if (/\b(trace|verbose)\b/i.test(text)) {
      return 'trace';
    }
    
    // Check for bracketed levels like [ERROR], [WARN]
    if (/\[(ERROR|FATAL|CRITICAL)\]/i.test(text)) return 'error';
    if (/\[(WARN(ING)?)\]/i.test(text)) return 'warn';
    if (/\[(INFO)\]/i.test(text)) return 'info';
    if (/\[(DEBUG)\]/i.test(text)) return 'debug';
    if (/\[(TRACE|VERBOSE)\]/i.test(text)) return 'trace';
    
    return 'unknown';
  }

  private extractTimestamp(text: string): string | undefined {
    // Common timestamp patterns
    const patterns = [
      // ISO 8601: 2024-01-15T10:30:45.123Z
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?)/,
      // Date time: 2024-01-15 10:30:45
      /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
      // US format: 01/15/2024 10:30:45
      /(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/,
      // Time only: 10:30:45.123
      /^(\d{2}:\d{2}:\d{2}(?:\.\d{3})?)/,
      // Bracketed: [2024-01-15 10:30:45]
      /\[(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{3})?)\]/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private toggleFilter(level: string) {
    const newFilters = new Set(this.activeFilters);
    if (newFilters.has(level)) {
      newFilters.delete(level);
    } else {
      newFilters.add(level);
    }
    this.activeFilters = newFilters;
  }

  private get filteredEntries(): LogEntry[] {
    let entries = this.entries.filter(e => this.activeFilters.has(e.level));
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      entries = entries.filter(e => e.text.toLowerCase().includes(query));
    }
    
    return entries;
  }

  private highlightText(text: string): string {
    if (!this.searchQuery) return this.escapeHtml(text);
    
    const escaped = this.escapeHtml(text);
    const query = this.escapeHtml(this.searchQuery);
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    
    return escaped.replace(regex, '<span class="highlight">$1</span>');
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private syntaxHighlight(text: string): string {
    let result = this.highlightText(text);
    
    // Highlight URLs
    result = result.replace(
      /(https?:\/\/[^\s<>"']+)/g,
      '<span class="url">$1</span>'
    );
    
    // Highlight file paths
    result = result.replace(
      /([\/\\][\w\-\.\/\\]+\.\w+)/g,
      '<span class="path">$1</span>'
    );
    
    // Highlight quoted strings
    result = result.replace(
      /(&quot;[^&]*&quot;)/g,
      '<span class="string">$1</span>'
    );
    
    // Highlight numbers
    result = result.replace(
      /\b(\d+(?:\.\d+)?)\b/g,
      '<span class="number">$1</span>'
    );
    
    return result;
  }

  private renderToolbar() {
    const levels = ['error', 'warn', 'info', 'debug'] as const;
    
    return html`
      <div class="toolbar">
        <input 
          type="text" 
          class="search-box"
          placeholder="${t('search-logs', 'Search logs...')}"
          .value=${this.searchQuery}
          @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
        />
        
        <div class="filter-buttons">
          ${levels.map(level => html`
            <button 
              class="filter-btn ${level} ${this.activeFilters.has(level) ? 'active' : ''}"
              @click=${() => this.toggleFilter(level)}
            >
              ${level.toUpperCase()}
              <span class="count">${this.levelCounts[level] || 0}</span>
            </button>
          `)}
        </div>
        
        <div class="stats">
          ${t('showing', 'Showing')} ${this.filteredEntries.length} / ${this.entries.length} ${t('lines', 'lines')}
        </div>
      </div>
    `;
  }

  private renderEntry(entry: LogEntry) {
    return html`
      <div class="log-row ${entry.level}">
        <div class="line-number">${entry.line}</div>
        <div class="log-level ${entry.level}">${entry.level}</div>
        ${entry.timestamp ? html`
          <div class="log-timestamp">${entry.timestamp}</div>
        ` : nothing}
        <div class="log-message" .innerHTML=${this.syntaxHighlight(entry.text)}></div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`<div class="error-msg">${this.error}</div>`;
    }

    const filtered = this.filteredEntries;

    return html`
      <div class="container">
        ${this.renderToolbar()}
        <div class="log-content">
          ${filtered.length === 0 ? html`
            <div class="empty">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              ${this.searchQuery 
                ? t('no-results', 'No matching entries found')
                : t('empty-log', 'No log entries to display')
              }
            </div>
          ` : html`
            <div class="log-table">
              ${filtered.map(entry => this.renderEntry(entry))}
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'log-viewer': LogViewer;
  }
}
