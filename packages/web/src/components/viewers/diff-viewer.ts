import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  oldLineNo?: number;
  newLineNo?: number;
}

interface DiffFile {
  oldFile: string;
  newFile: string;
  hunks: DiffHunk[];
  isBinary: boolean;
  isNew: boolean;
  isDeleted: boolean;
  isRenamed: boolean;
}

@customElement('diff-viewer')
export class DiffViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--surface, #fff);
      overflow: auto;
    }

    .container {
      padding: 1rem;
    }

    .file-diff {
      margin-bottom: 2rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 8px;
      overflow: hidden;
    }

    .file-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--surface-alt, #f6f8fa);
      border-bottom: 1px solid var(--border, #ddd);
      font-family: var(--font-mono, monospace);
      font-size: 0.875rem;
    }

    .file-header svg {
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
    }

    .file-name {
      font-weight: 600;
      color: var(--text-primary, #24292f);
      word-break: break-all;
    }

    .file-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      text-transform: uppercase;
    }

    .file-badge.new {
      background: #dafbe1;
      color: #1a7f37;
    }

    .file-badge.deleted {
      background: #ffebe9;
      color: #cf222e;
    }

    .file-badge.renamed {
      background: #ddf4ff;
      color: #0969da;
    }

    .file-badge.binary {
      background: #fff8c5;
      color: #9a6700;
    }

    .hunk {
      border-top: 1px solid var(--border, #ddd);
    }

    .hunk:first-child {
      border-top: none;
    }

    .hunk-header {
      padding: 0.5rem 1rem;
      background: var(--diff-hunk-bg, #f1f8ff);
      color: var(--diff-hunk-text, #57606a);
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      border-bottom: 1px solid var(--border, #ddd);
    }

    .diff-table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--font-mono, monospace);
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .diff-line {
      display: flex;
    }

    .line-no {
      flex-shrink: 0;
      width: 50px;
      padding: 0 0.5rem;
      text-align: right;
      color: var(--text-muted, #8b949e);
      background: var(--surface-alt, #f6f8fa);
      user-select: none;
      border-right: 1px solid var(--border, #ddd);
    }

    .line-no.old {
      border-right: none;
    }

    .line-sign {
      flex-shrink: 0;
      width: 20px;
      text-align: center;
      font-weight: 600;
      user-select: none;
    }

    .line-content {
      flex: 1;
      padding: 0 0.5rem;
      white-space: pre-wrap;
      word-break: break-all;
    }

    /* Add line */
    .diff-line.add {
      background: var(--diff-add-bg, #e6ffec);
    }

    .diff-line.add .line-no {
      background: var(--diff-add-line-bg, #ccffd8);
    }

    .diff-line.add .line-sign {
      color: var(--diff-add-sign, #1a7f37);
    }

    .diff-line.add .line-content {
      color: var(--diff-add-text, #24292f);
    }

    /* Remove line */
    .diff-line.remove {
      background: var(--diff-remove-bg, #ffebe9);
    }

    .diff-line.remove .line-no {
      background: var(--diff-remove-line-bg, #ffd7d5);
    }

    .diff-line.remove .line-sign {
      color: var(--diff-remove-sign, #cf222e);
    }

    .diff-line.remove .line-content {
      color: var(--diff-remove-text, #24292f);
    }

    /* Context line */
    .diff-line.context {
      background: var(--surface, #fff);
    }

    .diff-line.context .line-sign {
      color: var(--text-muted, #8b949e);
    }

    .stats {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
      font-size: 0.75rem;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .stat.additions {
      color: #1a7f37;
    }

    .stat.deletions {
      color: #cf222e;
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

    .summary {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-alt, #f6f8fa);
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .summary-item svg {
      width: 1rem;
      height: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private files: DiffFile[] = [];

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private totalAdditions = 0;

  @state()
  private totalDeletions = 0;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.files = [];
    this.totalAdditions = 0;
    this.totalDeletions = 0;

    try {
      const text = await this.file.text();
      this.files = this.parseDiff(text);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse diff file';
    } finally {
      this.loading = false;
    }
  }

  private parseDiff(text: string): DiffFile[] {
    const files: DiffFile[] = [];
    const lines = text.split('\n');
    
    let currentFile: DiffFile | null = null;
    let currentHunk: DiffHunk | null = null;
    let oldLineNo = 0;
    let newLineNo = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // New file header (diff --git a/file b/file)
      if (line.startsWith('diff --git') || line.startsWith('diff -')) {
        if (currentFile) {
          files.push(currentFile);
        }
        currentFile = {
          oldFile: '',
          newFile: '',
          hunks: [],
          isBinary: false,
          isNew: false,
          isDeleted: false,
          isRenamed: false,
        };
        currentHunk = null;
        
        // Parse file names from git diff
        const gitMatch = line.match(/diff --git a\/(.+) b\/(.+)/);
        if (gitMatch) {
          currentFile.oldFile = gitMatch[1];
          currentFile.newFile = gitMatch[2];
        }
      }

      // Old file name (--- a/file)
      else if (line.startsWith('---')) {
        if (currentFile) {
          const match = line.match(/^--- (?:a\/)?(.+)$/);
          if (match) {
            currentFile.oldFile = match[1] === '/dev/null' ? '' : match[1];
            if (match[1] === '/dev/null') {
              currentFile.isNew = true;
            }
          }
        }
      }

      // New file name (+++ b/file)
      else if (line.startsWith('+++')) {
        if (currentFile) {
          const match = line.match(/^\+\+\+ (?:b\/)?(.+)$/);
          if (match) {
            currentFile.newFile = match[1] === '/dev/null' ? '' : match[1];
            if (match[1] === '/dev/null') {
              currentFile.isDeleted = true;
            }
          }
        }
      }

      // Binary file
      else if (line.startsWith('Binary files')) {
        if (currentFile) {
          currentFile.isBinary = true;
        }
      }

      // Renamed file
      else if (line.startsWith('rename from') || line.startsWith('similarity index')) {
        if (currentFile) {
          currentFile.isRenamed = true;
        }
      }

      // Hunk header (@@ -1,5 +1,6 @@)
      else if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
        if (match && currentFile) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            lines: [],
          };
          oldLineNo = currentHunk.oldStart;
          newLineNo = currentHunk.newStart;
          currentFile.hunks.push(currentHunk);
          
          // Add header line
          currentHunk.lines.push({
            type: 'header',
            content: line,
          });
        }
      }

      // Diff content lines
      else if (currentHunk) {
        if (line.startsWith('+') && !line.startsWith('+++')) {
          currentHunk.lines.push({
            type: 'add',
            content: line.slice(1),
            newLineNo: newLineNo++,
          });
          this.totalAdditions++;
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          currentHunk.lines.push({
            type: 'remove',
            content: line.slice(1),
            oldLineNo: oldLineNo++,
          });
          this.totalDeletions++;
        } else if (line.startsWith(' ') || line === '') {
          currentHunk.lines.push({
            type: 'context',
            content: line.slice(1) || '',
            oldLineNo: oldLineNo++,
            newLineNo: newLineNo++,
          });
        }
      }
    }

    if (currentFile) {
      files.push(currentFile);
    }

    return files;
  }

  private getFileStats(file: DiffFile): { additions: number; deletions: number } {
    let additions = 0;
    let deletions = 0;
    
    for (const hunk of file.hunks) {
      for (const line of hunk.lines) {
        if (line.type === 'add') additions++;
        if (line.type === 'remove') deletions++;
      }
    }
    
    return { additions, deletions };
  }

  private renderFileDiff(file: DiffFile) {
    const stats = this.getFileStats(file);
    const displayName = file.newFile || file.oldFile || 'Unknown file';

    return html`
      <div class="file-diff">
        <div class="file-header">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          <span class="file-name">${displayName}</span>
          ${file.isNew ? html`<span class="file-badge new">${t('new', 'New')}</span>` : nothing}
          ${file.isDeleted ? html`<span class="file-badge deleted">${t('deleted', 'Deleted')}</span>` : nothing}
          ${file.isRenamed ? html`<span class="file-badge renamed">${t('renamed', 'Renamed')}</span>` : nothing}
          ${file.isBinary ? html`<span class="file-badge binary">${t('binary', 'Binary')}</span>` : nothing}
          <div class="stats">
            <span class="stat additions">+${stats.additions}</span>
            <span class="stat deletions">-${stats.deletions}</span>
          </div>
        </div>
        ${file.isBinary ? html`
          <div class="hunk-header">${t('binary-file', 'Binary file not shown')}</div>
        ` : file.hunks.map(hunk => this.renderHunk(hunk))}
      </div>
    `;
  }

  private renderHunk(hunk: DiffHunk) {
    return html`
      <div class="hunk">
        <div class="hunk-header">
          @@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@
        </div>
        <div class="diff-table">
          ${hunk.lines.filter(l => l.type !== 'header').map(line => this.renderLine(line))}
        </div>
      </div>
    `;
  }

  private renderLine(line: DiffLine) {
    let sign = ' ';
    if (line.type === 'add') sign = '+';
    if (line.type === 'remove') sign = '-';

    return html`
      <div class="diff-line ${line.type}">
        <span class="line-no old">${line.oldLineNo ?? ''}</span>
        <span class="line-no new">${line.newLineNo ?? ''}</span>
        <span class="line-sign">${sign}</span>
        <span class="line-content">${line.content}</span>
      </div>
    `;
  }

  private renderSummary() {
    return html`
      <div class="summary">
        <div class="summary-item">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
          </svg>
          ${this.files.length} ${t('files-changed', 'files changed')}
        </div>
        <div class="summary-item stat additions">
          +${this.totalAdditions} ${t('additions', 'additions')}
        </div>
        <div class="summary-item stat deletions">
          -${this.totalDeletions} ${t('deletions', 'deletions')}
        </div>
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

    if (this.files.length === 0) {
      return html`<div class="error">${t('empty-diff', 'No diff content found')}</div>`;
    }

    return html`
      <div class="container">
        ${this.renderSummary()}
        ${this.files.map(file => this.renderFileDiff(file))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'diff-viewer': DiffViewer;
  }
}
