import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { createArchiveWorker } from '../../common/archive-worker';
import type { ArchiveEntry } from '@webexplorer/archive';
import { t } from '../../common/Localization';

@customElement('opendocument-viewer')
export class OpenDocumentViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .odf-viewer {
      margin: 1rem;
    }
    .odf-container {
      background: white;
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      padding: 2rem;
      overflow-x: auto;
      color: #000;
      line-height: 1.6;
    }
    
    /* Basic styling for content */
    .odf-container h1 { font-size: 2rem; margin-top: 0; }
    .odf-container h2 { font-size: 1.5rem; }
    .odf-container h3 { font-size: 1.25rem; }
    .odf-container p { margin: 0.5rem 0; }
    
    .odf-container table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    
    .odf-container th,
    .odf-container td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }
    
    .odf-container th {
      background: #f5f5f5;
    }
    
    /* Presentation styles */
    .slide {
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 2rem;
      margin-bottom: 1rem;
      background: #fff;
      min-height: 200px;
    }
    
    .slide-header {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #0066CC;
    }
    
    .slide-number {
      font-size: 0.75rem;
      color: #666;
      margin-bottom: 0.5rem;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
      color: var(--text-secondary, #666);
    }
    .error {
      color: var(--error, #dc2626);
      padding: 1rem;
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private content: string = '';

  @state()
  private fileType: 'text' | 'spreadsheet' | 'presentation' = 'text';

  private worker = createArchiveWorker();

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadDocument();
    }
  }

  private async loadDocument() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      await this.worker.init();
      await this.worker.open(this.file, '');
      const entries = await this.worker.entries();
      
      // Determine file type from mimetype file or extension
      this.fileType = this.determineType(entries, this.file.name);
      
      // Find and parse content.xml
      const contentEntry = entries.find(e => e.path === 'content.xml');
      if (!contentEntry) {
        throw new Error('No content.xml found in document');
      }

      const textDecoder = new TextDecoder('utf-8');
      const xmlContent = textDecoder.decode(contentEntry.data);
      
      // Parse based on document type
      switch (this.fileType) {
        case 'text':
          this.content = this.parseTextDocument(xmlContent);
          break;
        case 'spreadsheet':
          this.content = this.parseSpreadsheet(xmlContent);
          break;
        case 'presentation':
          this.content = this.parsePresentation(xmlContent);
          break;
      }
      
      this.loading = false;
    } catch (e) {
      console.error('Failed to load OpenDocument:', e);
      this.error = `${t('loading-failure', 'Failed to load document')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private determineType(_entries: ArchiveEntry[], fileName: string): 'text' | 'spreadsheet' | 'presentation' {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'ods') return 'spreadsheet';
    if (ext === 'odp') return 'presentation';
    return 'text';
  }

  private parseTextDocument(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    
    let html = '';
    const textNS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
    
    // Get all paragraphs and headings
    const body = doc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'text')[0];
    if (!body) return '<p>No content found</p>';
    
    const processNode = (node: Element): string => {
      let result = '';
      const tagName = node.localName;
      
      if (tagName === 'p') {
        const text = this.getTextContent(node);
        result += `<p>${text}</p>`;
      } else if (tagName === 'h') {
        const level = node.getAttributeNS(textNS, 'outline-level') || '1';
        const text = this.getTextContent(node);
        result += `<h${level}>${text}</h${level}>`;
      } else if (tagName === 'list') {
        result += '<ul>';
        for (const child of Array.from(node.children)) {
          if (child.localName === 'list-item') {
            result += '<li>' + this.getTextContent(child) + '</li>';
          }
        }
        result += '</ul>';
      }
      
      return result;
    };
    
    for (const child of Array.from(body.children)) {
      html += processNode(child as Element);
    }
    
    return html || '<p>No content found</p>';
  }

  private parseSpreadsheet(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    
    let html = '';
    const tableNS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
    
    const tables = doc.getElementsByTagNameNS(tableNS, 'table');
    
    for (let t = 0; t < tables.length; t++) {
      const table = tables[t];
      const tableName = table.getAttributeNS(tableNS, 'name') || `Sheet ${t + 1}`;
      
      html += `<h3>${tableName}</h3><table>`;
      
      const rows = table.getElementsByTagNameNS(tableNS, 'table-row');
      for (let r = 0; r < Math.min(rows.length, 100); r++) { // Limit rows
        const row = rows[r];
        html += '<tr>';
        
        const cells = row.getElementsByTagNameNS(tableNS, 'table-cell');
        for (let c = 0; c < Math.min(cells.length, 26); c++) { // Limit columns
          const cell = cells[c];
          const text = this.getTextContent(cell);
          const repeat = parseInt(cell.getAttributeNS(tableNS, 'number-columns-repeated') || '1');
          
          for (let i = 0; i < Math.min(repeat, 10); i++) {
            html += `<td>${text}</td>`;
          }
        }
        
        html += '</tr>';
      }
      
      html += '</table>';
    }
    
    return html || '<p>No content found</p>';
  }

  private parsePresentation(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    
    let html = '';
    const drawNS = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';
    
    const pages = doc.getElementsByTagNameNS(drawNS, 'page');
    
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      
      html += `<div class="slide">`;
      html += `<div class="slide-number">${t('slide', 'Slide')} ${i + 1}</div>`;
      
      // Get frames and their text content
      const frames = page.getElementsByTagNameNS(drawNS, 'frame');
      let isFirst = true;
      
      for (const frame of Array.from(frames)) {
        const text = this.getTextContent(frame);
        if (text.trim()) {
          if (isFirst) {
            html += `<div class="slide-header">${text}</div>`;
            isFirst = false;
          } else {
            html += `<p>${text}</p>`;
          }
        }
      }
      
      html += '</div>';
    }
    
    return html || '<p>No content found</p>';
  }

  private getTextContent(element: Element): string {
    let text = '';
    const textNS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
    
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.localName === 's' && el.namespaceURI === textNS) {
          // Space element
          const count = parseInt(el.getAttributeNS(textNS, 'c') || '1');
          text += ' '.repeat(count);
        } else if (el.localName === 'tab') {
          text += '\t';
        } else if (el.localName === 'line-break') {
          text += '<br>';
        }
        for (const child of Array.from(node.childNodes)) {
          walk(child);
        }
      }
    };
    
    walk(element);
    return text;
  }

  render() {
    if (!this.file) {
      return html`<div class="odf-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="odf-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="odf-viewer"><div class="error">${this.error}</div></div>`;
    }

    return html`
      <div class="odf-viewer">
        <div class="odf-container" .innerHTML=${this.content}></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'opendocument-viewer': OpenDocumentViewer;
  }
}
