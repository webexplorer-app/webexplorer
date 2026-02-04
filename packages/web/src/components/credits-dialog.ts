import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LocalizedLitElement } from './localized-element';
import { t } from '../common/Localization';

interface OpenSourceProject {
  name: string;
  description: string;
  url: string;
  icon: string;
  category: 'framework' | 'media' | 'document' | 'utility' | 'editor';
}

const OPEN_SOURCE_PROJECTS: OpenSourceProject[] = [
  // Frameworks
  {
    name: 'Lit',
    description: 'Simple, fast web components',
    url: 'https://lit.dev',
    icon: '🔥',
    category: 'framework',
  },
  {
    name: 'Vite',
    description: 'Next generation frontend tooling',
    url: 'https://vitejs.dev',
    icon: '⚡',
    category: 'framework',
  },
  {
    name: 'TypeScript',
    description: 'JavaScript with syntax for types',
    url: 'https://www.typescriptlang.org',
    icon: '📘',
    category: 'framework',
  },
  {
    name: 'Open Props',
    description: 'Supercharged CSS variables',
    url: 'https://open-props.style',
    icon: '🎨',
    category: 'framework',
  },

  // Editor
  {
    name: 'CodeMirror',
    description: 'Extensible code editor component',
    url: 'https://codemirror.net',
    icon: '📝',
    category: 'editor',
  },

  // Media
  {
    name: 'Three.js',
    description: '3D library for WebGL',
    url: 'https://threejs.org',
    icon: '🎮',
    category: 'media',
  },
  {
    name: 'FFmpeg.wasm',
    description: 'FFmpeg compiled to WebAssembly',
    url: 'https://ffmpegwasm.netlify.app',
    icon: '🎬',
    category: 'media',
  },
  {
    name: 'alphaTab',
    description: 'Music notation rendering',
    url: 'https://www.alphatab.net',
    icon: '🎵',
    category: 'media',
  },

  // Document
  {
    name: 'UnionPDF',
    description: 'PDF rendering engine',
    url: 'https://github.com/nickyvanurk/unionpdf',
    icon: '📄',
    category: 'document',
  },
  {
    name: 'libarchive.js',
    description: 'Archive extraction in browser',
    url: 'https://github.com/nickyvanurk/libarchive.js',
    icon: '📦',
    category: 'document',
  },

  // Utility
  {
    name: 'Comlink',
    description: 'Web Workers made easy',
    url: 'https://github.com/GoogleChromeLabs/comlink',
    icon: '🔗',
    category: 'utility',
  },
  {
    name: 'WebTorrent',
    description: 'Streaming torrent client for web',
    url: 'https://webtorrent.io',
    icon: '🌊',
    category: 'utility',
  },
  {
    name: 'Fluent',
    description: 'Localization system by Mozilla',
    url: 'https://projectfluent.org',
    icon: '🌐',
    category: 'utility',
  },
  {
    name: 'wabt',
    description: 'WebAssembly binary toolkit',
    url: 'https://github.com/WebAssembly/wabt',
    icon: '🔧',
    category: 'utility',
  },
  {
    name: 'csv-parse',
    description: 'CSV parsing library',
    url: 'https://csv.js.org',
    icon: '📊',
    category: 'utility',
  },
  {
    name: 'mime',
    description: 'MIME type detection',
    url: 'https://github.com/broofa/mime',
    icon: '🏷️',
    category: 'utility',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  framework: 'Frameworks & Build Tools',
  editor: 'Code Editor',
  media: 'Media & Graphics',
  document: 'Document Processing',
  utility: 'Utilities',
};

@customElement('credits-dialog')
export class CreditsDialog extends LocalizedLitElement {
  static styles = css`
    :host {
      display: none;
    }

    :host([open]) {
      display: block;
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--size-4, 1rem);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .dialog {
      background: var(--surface, #fff);
      border-radius: var(--radius-3, 12px);
      box-shadow: var(--shadow-lg, 0 25px 50px -12px rgba(0, 0, 0, 0.25));
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--size-4, 1rem) var(--size-6, 1.5rem);
      border-bottom: 1px solid var(--border, #e5e7eb);
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: var(--size-3, 0.75rem);
      margin: 0;
      font-size: var(--font-size-3, 1.25rem);
      font-weight: var(--font-weight-6, 600);
      color: var(--text, #1f2937);
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: var(--radius-2, 6px);
      cursor: pointer;
      color: var(--text-muted, #6b7280);
      font-size: 1.25rem;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: var(--surface-hover, #f3f4f6);
      color: var(--text, #1f2937);
    }

    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--size-6, 1.5rem);
    }

    .intro {
      margin-bottom: var(--size-6, 1.5rem);
      padding: var(--size-4, 1rem);
      background: var(--surface, #f9fafb);
      border-radius: var(--radius-2, 8px);
      color: var(--text-muted, #6b7280);
      font-size: var(--font-size-0, 0.875rem);
      line-height: 1.6;
    }

    .category {
      margin-bottom: var(--size-6, 1.5rem);
    }

    .category:last-child {
      margin-bottom: 0;
    }

    .category-title {
      font-size: var(--font-size-00, 0.75rem);
      font-weight: var(--font-weight-6, 600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #6b7280);
      margin-bottom: var(--size-3, 0.75rem);
      padding-bottom: var(--size-2, 0.5rem);
      border-bottom: 1px solid var(--border, #e5e7eb);
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: var(--size-3, 0.75rem);
    }

    .project-card {
      display: flex;
      align-items: flex-start;
      gap: var(--size-3, 0.75rem);
      padding: var(--size-3, 0.875rem);
      background: var(--background, #fff);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: var(--radius-2, 8px);
    }

    .project-icon {
      font-size: 1.5rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .project-info {
      flex: 1;
      min-width: 0;
    }

    .project-name {
      font-weight: var(--font-weight-6, 600);
      font-size: var(--font-size-0, 0.875rem);
      color: var(--text-link, #0066cc);
      margin-bottom: var(--size-1, 0.25rem);
      text-decoration: none;
    }

    .project-name:hover {
      color: var(--text-link-hover, #004499);
      text-decoration: underline;
    }

    .project-name::after {
      content: ' ↗';
      font-size: 0.75rem;
    }

    .project-description {
      font-size: var(--font-size-00, 0.75rem);
      color: var(--text-muted, #6b7280);
      line-height: 1.4;
    }

    .dialog-footer {
      padding: var(--size-4, 1rem) var(--size-6, 1.5rem);
      border-top: 1px solid var(--border, #e5e7eb);
      text-align: center;
      color: var(--text-muted, #6b7280);
      font-size: var(--font-size-00, 0.75rem);
    }
  `;

  @property({ type: Boolean, reflect: true })
  open = false;

  private close() {
    this.open = false;
    this.dispatchEvent(new CustomEvent('close'));
  }

  private handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this.handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private renderCategory(category: string, projects: OpenSourceProject[]) {
    return html`
      <div class="category">
        <div class="category-title">${CATEGORY_LABELS[category] || category}</div>
        <div class="projects-grid">
          ${projects.map(project => html`
            <div class="project-card">
              <span class="project-icon">${project.icon}</span>
              <div class="project-info">
                <a 
                  class="project-name"
                  href=${project.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >${project.name}</a>
                <div class="project-description">${project.description}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.open) return null;

    // Group projects by category
    const categories = ['framework', 'editor', 'media', 'document', 'utility'];
    const groupedProjects = categories.map(cat => ({
      category: cat,
      projects: OPEN_SOURCE_PROJECTS.filter(p => p.category === cat),
    })).filter(g => g.projects.length > 0);

    return html`
      <div class="overlay" @click=${this.handleOverlayClick}>
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <div class="dialog-header">
            <h2 class="dialog-title" id="dialog-title">
              <span>❤️</span>
              ${t('open-source-credits', 'Open Source Credits')}
            </h2>
            <button class="close-btn" @click=${this.close} aria-label="Close">×</button>
          </div>
          <div class="dialog-body">
            <div class="intro">
              ${t('credits-intro', 'Web Explorer is built on the shoulders of giants. We are grateful to all the open source projects that make this application possible.')}
            </div>
            ${groupedProjects.map(g => this.renderCategory(g.category, g.projects))}
          </div>
          <div class="dialog-footer">
            ${t('credits-footer', 'Made with ❤️ using open source software')}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'credits-dialog': CreditsDialog;
  }
}
