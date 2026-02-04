import { html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

// CodeMirror imports
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import type { Extension } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { rust } from '@codemirror/lang-rust';
import { go } from '@codemirror/lang-go';
import { html as langHtml } from '@codemirror/lang-html';
import { css as langCss } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { yaml } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  javascript: /\.(js|mjs|cjs|jsx)$/i,
  typescript: /\.(ts|tsx|mts|cts)$/i,
  python: /\.(py|pyw)$/i,
  java: /\.java$/i,
  csharp: /\.cs$/i,
  cpp: /\.(cpp|cc|cxx|hpp|hxx|c|h)$/i,
  go: /\.go$/i,
  rust: /\.rs$/i,
  ruby: /\.rb$/i,
  php: /\.php$/i,
  swift: /\.swift$/i,
  kotlin: /\.(kt|kts)$/i,
  scala: /\.scala$/i,
  lua: /\.lua$/i,
  perl: /\.(pl|pm)$/i,
  shell: /\.(sh|bash|zsh|fish)$/i,
  powershell: /\.(ps1|psm1)$/i,
  batch: /\.(bat|cmd)$/i,
  sql: /\.sql$/i,
  graphql: /\.(graphql|gql)$/i,
  html: /\.(html|htm)$/i,
  css: /\.(css|scss|sass|less)$/i,
  markdown: /\.(md|markdown|mdx)$/i,
  yaml: /\.(yaml|yml)$/i,
  json: /\.(json|jsonc)$/i,
  xml: /\.(xml|svg|plist)$/i,
  dockerfile: /dockerfile$/i,
  makefile: /makefile$/i,
};

// Map language to CodeMirror extension
function getLanguageExtension(language: string): Extension | null {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return javascript({ typescript: language === 'typescript', jsx: true });
    case 'python':
      return python();
    case 'java':
    case 'kotlin':
    case 'scala':
      return java();
    case 'cpp':
    case 'csharp':
      return cpp();
    case 'rust':
      return rust();
    case 'go':
      return go();
    case 'html':
      return langHtml();
    case 'css':
      return langCss();
    case 'sql':
      return sql();
    case 'markdown':
      return markdown();
    case 'php':
      return php();
    case 'json':
      return json();
    case 'xml':
      return xml();
    case 'yaml':
      return yaml();
    default:
      return null;
  }
}

@customElement('code-viewer')
export class CodeViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      height: 100%;
      background: var(--code-bg, #282c34);
      color: var(--code-text, #abb2bf);
    }

    .container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 1rem;
      background: var(--code-toolbar, #21252b);
      border-bottom: 1px solid var(--code-border, #181a1f);
      flex-shrink: 0;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--code-muted, #5c6370);
    }

    .language-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.5rem;
      background: var(--code-badge, #3e4451);
      border-radius: 4px;
      text-transform: uppercase;
      color: #e5c07b;
    }

    .stats {
      margin-left: auto;
      font-size: 0.75rem;
      color: var(--code-muted, #5c6370);
    }

    .editor-container {
      flex: 1;
      overflow: hidden;
    }

    .cm-editor {
      height: 100%;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace);
      font-size: 0.875rem;
    }

    .cm-editor .cm-scroller {
      overflow: auto;
    }

    .cm-editor.cm-focused {
      outline: none;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--code-muted, #5c6370);
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: #e06c75;
    }

    .toolbar-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: transparent;
      border: 1px solid var(--code-border, #181a1f);
      border-radius: 4px;
      color: var(--code-muted, #5c6370);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .toolbar-btn:hover {
      border-color: var(--code-text, #abb2bf);
      color: var(--code-text, #abb2bf);
    }

    .toolbar-btn.active {
      background: var(--code-active, #2c313a);
      border-color: #61afef;
      color: #61afef;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private content = '';

  @state()
  private lineCount = 0;

  @state()
  private language = 'plaintext';

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private wordWrap = false;

  private editorView: EditorView | null = null;

  disconnectedCallback() {
    super.disconnectedCallback();
    this.destroyEditor();
  }

  protected updated(changedProperties: PropertyValues) {
    super.updated(changedProperties);
    
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
    
    if (changedProperties.has('wordWrap') && this.editorView) {
      this.updateWordWrap();
    }
  }

  private destroyEditor() {
    if (this.editorView) {
      this.editorView.destroy();
      this.editorView = null;
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.content = '';
    this.lineCount = 0;
    this.destroyEditor();

    try {
      // Check file size - limit to 5MB for performance
      if (this.file.size > 5 * 1024 * 1024) {
        const text = await this.file.slice(0, 5 * 1024 * 1024).text();
        this.content = text + '\n\n... (file truncated at 5MB)';
      } else {
        this.content = await this.file.text();
      }

      this.lineCount = this.content.split('\n').length;
      this.language = this.detectLanguage(this.file.name);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to load file';
    } finally {
      this.loading = false;
      // Wait for the container to be rendered, then create editor
      await this.updateComplete;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.createEditor();
      });
    }
  }

  private detectLanguage(filename: string): string {
    for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (pattern.test(filename)) {
        return lang;
      }
    }
    return 'plaintext';
  }

  private createEditor() {
    this.destroyEditor();

    // Query the container from shadow DOM
    const container = this.shadowRoot?.querySelector('.editor-container') as HTMLDivElement;
    if (!container) {
      console.error('Editor container not found');
      return;
    }

    const extensions: Extension[] = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      oneDark,
      syntaxHighlighting(defaultHighlightStyle),
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
    ];

    // Add language support if available
    const langExt = getLanguageExtension(this.language);
    if (langExt) {
      extensions.push(langExt);
    }

    // Word wrap
    if (this.wordWrap) {
      extensions.push(EditorView.lineWrapping);
    }

    const state = EditorState.create({
      doc: this.content,
      extensions,
    });

    this.editorView = new EditorView({
      state,
      parent: container,
    });
  }

  private updateWordWrap() {
    // Recreate editor with new wrap setting
    this.createEditor();
  }

  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private renderToolbar() {
    return html`
      <div class="toolbar">
        <div class="file-info">
          <span class="language-badge">${this.language}</span>
        </div>
        <button 
          class="toolbar-btn ${this.wordWrap ? 'active' : ''}"
          @click=${() => this.wordWrap = !this.wordWrap}
        >
          ${t('word-wrap', 'Word Wrap')}
        </button>
        <div class="stats">
          ${this.lineCount} ${t('lines', 'lines')} · ${this.formatFileSize(this.file?.size || 0)}
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

    return html`
      <div class="container">
        ${this.renderToolbar()}
        <div class="editor-container"></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'code-viewer': CodeViewer;
  }
}
