import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface ConfigSection {
  name: string;
  line: number;
  entries: ConfigEntry[];
}

interface ConfigEntry {
  key: string;
  value: string;
  line: number;
  comment?: string;
}

@customElement('config-viewer')
export class ConfigViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--surface, #fff);
    }

    .container {
      display: flex;
      height: 100%;
    }

    .sidebar {
      width: 220px;
      flex-shrink: 0;
      border-right: 1px solid var(--border, #ddd);
      background: var(--surface-alt, #f5f5f5);
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 0.75rem 1rem;
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-muted, #666);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border, #ddd);
    }

    .section-list {
      padding: 0.5rem 0;
    }

    .section-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      color: var(--text-primary, #333);
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .section-item:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    .section-item.active {
      background: var(--primary-light, #e3f2fd);
      color: var(--primary, #1976d2);
      font-weight: 500;
    }

    .section-item svg {
      width: 1rem;
      height: 1rem;
      opacity: 0.6;
    }

    .section-count {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--text-muted, #999);
      background: var(--surface, #fff);
      padding: 0.125rem 0.375rem;
      border-radius: 10px;
    }

    .content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0;
      margin-bottom: 0.5rem;
      border-bottom: 2px solid var(--primary, #1976d2);
    }

    .section-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary, #1976d2);
    }

    .section-header svg {
      width: 1.25rem;
      height: 1.25rem;
      color: var(--primary, #1976d2);
    }

    .entries {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .entry {
      display: grid;
      grid-template-columns: minmax(150px, 1fr) 2fr;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-alt, #f9f9f9);
      border-radius: 4px;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.8125rem;
    }

    .entry:hover {
      background: var(--surface-hover, #f0f0f0);
    }

    .entry-key {
      color: var(--config-key, #881391);
      font-weight: 500;
      word-break: break-word;
    }

    .entry-value {
      color: var(--config-value, #0b7500);
      word-break: break-word;
    }

    .entry-value.number {
      color: var(--config-number, #1750eb);
    }

    .entry-value.boolean {
      color: var(--config-boolean, #d32f2f);
    }

    .entry-value.url {
      color: var(--config-url, #1976d2);
    }

    .entry-value.path {
      color: var(--config-path, #6a1b9a);
    }

    .entry-comment {
      grid-column: 1 / -1;
      color: var(--text-muted, #666);
      font-style: italic;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .line-number {
      font-size: 0.6875rem;
      color: var(--text-muted, #999);
      margin-left: 0.5rem;
    }

    .global-section .section-header h2 {
      color: var(--text-secondary, #555);
    }

    .global-section .section-header {
      border-bottom-color: var(--text-muted, #999);
    }

    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-muted, #666);
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

    @media (max-width: 768px) {
      .sidebar {
        width: 180px;
      }
      
      .entry {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private sections: ConfigSection[] = [];

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private activeSection: string | null = null;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.sections = [];

    try {
      const text = await this.file.text();
      const ext = this.file.name.split('.').pop()?.toLowerCase();
      
      if (ext === 'toml') {
        this.sections = this.parseTOML(text);
      } else if (ext === 'properties' || ext === 'env') {
        this.sections = this.parseProperties(text);
      } else {
        this.sections = this.parseINI(text);
      }

      if (this.sections.length > 0) {
        this.activeSection = this.sections[0].name;
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse config file';
    } finally {
      this.loading = false;
    }
  }

  private parseINI(text: string): ConfigSection[] {
    const sections: ConfigSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: ConfigSection = { name: 'Global', line: 0, entries: [] };
    let pendingComment: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      // Skip empty lines
      if (!line) {
        pendingComment = undefined;
        continue;
      }

      // Comment line
      if (line.startsWith('#') || line.startsWith(';')) {
        pendingComment = line.slice(1).trim();
        continue;
      }

      // Section header [section]
      const sectionMatch = line.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        if (currentSection.entries.length > 0 || currentSection.name !== 'Global') {
          sections.push(currentSection);
        }
        currentSection = { name: sectionMatch[1], line: lineNumber, entries: [] };
        pendingComment = undefined;
        continue;
      }

      // Key-value pair
      const kvMatch = line.match(/^([^=]+)=(.*)$/);
      if (kvMatch) {
        currentSection.entries.push({
          key: kvMatch[1].trim(),
          value: kvMatch[2].trim(),
          line: lineNumber,
          comment: pendingComment,
        });
        pendingComment = undefined;
      }
    }

    // Add the last section
    if (currentSection.entries.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  private parseTOML(text: string): ConfigSection[] {
    const sections: ConfigSection[] = [];
    const lines = text.split('\n');
    
    let currentSection: ConfigSection = { name: 'Global', line: 0, entries: [] };
    let pendingComment: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (!line) {
        pendingComment = undefined;
        continue;
      }

      // Comment
      if (line.startsWith('#')) {
        pendingComment = line.slice(1).trim();
        continue;
      }

      // Section header [section] or [[array]]
      const sectionMatch = line.match(/^\[+([^\]]+)\]+$/);
      if (sectionMatch) {
        if (currentSection.entries.length > 0 || currentSection.name !== 'Global') {
          sections.push(currentSection);
        }
        currentSection = { name: sectionMatch[1], line: lineNumber, entries: [] };
        pendingComment = undefined;
        continue;
      }

      // Key-value pair (TOML supports = with optional quotes)
      const kvMatch = line.match(/^([^=]+)=\s*(.*)$/);
      if (kvMatch) {
        let value = kvMatch[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        currentSection.entries.push({
          key: kvMatch[1].trim(),
          value: value,
          line: lineNumber,
          comment: pendingComment,
        });
        pendingComment = undefined;
      }
    }

    if (currentSection.entries.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  }

  private parseProperties(text: string): ConfigSection[] {
    const entries: ConfigEntry[] = [];
    const lines = text.split('\n');
    let pendingComment: string | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const lineNumber = i + 1;

      if (!line) {
        pendingComment = undefined;
        continue;
      }

      if (line.startsWith('#') || line.startsWith('!')) {
        pendingComment = line.slice(1).trim();
        continue;
      }

      // Properties can use = or : as separator
      const kvMatch = line.match(/^([^=:]+)[=:](.*)$/);
      if (kvMatch) {
        entries.push({
          key: kvMatch[1].trim(),
          value: kvMatch[2].trim(),
          line: lineNumber,
          comment: pendingComment,
        });
        pendingComment = undefined;
      }
    }

    return [{ name: 'Properties', line: 0, entries }];
  }

  private getValueType(value: string): string {
    // Check for boolean
    if (/^(true|false|yes|no|on|off)$/i.test(value)) {
      return 'boolean';
    }
    // Check for number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number';
    }
    // Check for URL
    if (/^https?:\/\//i.test(value)) {
      return 'url';
    }
    // Check for path
    if (/^[\/\\]|^[a-zA-Z]:[\/\\]/.test(value)) {
      return 'path';
    }
    return 'string';
  }

  private scrollToSection(name: string) {
    this.activeSection = name;
    const element = this.shadowRoot?.querySelector(`[data-section="${name}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private renderSidebar() {
    return html`
      <div class="sidebar">
        <div class="sidebar-header">${t('sections', 'Sections')}</div>
        <div class="section-list">
          ${this.sections.map(section => html`
            <div 
              class="section-item ${this.activeSection === section.name ? 'active' : ''}"
              @click=${() => this.scrollToSection(section.name)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
              </svg>
              ${section.name}
              <span class="section-count">${section.entries.length}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private renderSection(section: ConfigSection) {
    const isGlobal = section.name === 'Global' || section.name === 'Properties';
    
    return html`
      <div class="section ${isGlobal ? 'global-section' : ''}" data-section="${section.name}">
        <div class="section-header">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
          </svg>
          <h2>${section.name}</h2>
          <span class="line-number">line ${section.line || 1}</span>
        </div>
        <div class="entries">
          ${section.entries.map(entry => this.renderEntry(entry))}
        </div>
      </div>
    `;
  }

  private renderEntry(entry: ConfigEntry) {
    const valueType = this.getValueType(entry.value);
    
    return html`
      <div class="entry">
        <div class="entry-key">${entry.key}</div>
        <div class="entry-value ${valueType}">${entry.value || '(empty)'}</div>
        ${entry.comment ? html`
          <div class="entry-comment">${entry.comment}</div>
        ` : nothing}
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading">${t('loading', 'Loading...')}</div>`;
    }

    if (this.error) {
      return html`<div class="error">${this.error}</div>`;
    }

    if (this.sections.length === 0) {
      return html`<div class="empty">${t('empty-config', 'No configuration entries found')}</div>`;
    }

    return html`
      <div class="container">
        ${this.sections.length > 1 ? this.renderSidebar() : nothing}
        <div class="content">
          ${this.sections.map(section => this.renderSection(section))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'config-viewer': ConfigViewer;
  }
}
