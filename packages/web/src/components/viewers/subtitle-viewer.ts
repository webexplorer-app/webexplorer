import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface SubtitleCue {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

@customElement('subtitle-viewer')
export class SubtitleViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }
    .subtitle-viewer {
    }
    .subtitle-container {
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
    }
    
    .subtitle-header {
      padding: 1rem;
      background: var(--surface-alt, #f5f5f5);
      border-bottom: 1px solid var(--border, #ddd);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .subtitle-count {
      font-size: 0.875rem;
      color: var(--text-secondary, #666);
    }
    
    .subtitle-list {
      padding: 0;
      margin: 0;
      list-style: none;
    }
    
    .subtitle-cue {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-light, #eee);
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
    }
    
    .subtitle-cue:hover {
      background: var(--surface-hover, #f9f9f9);
    }
    
    .cue-index {
      font-weight: 600;
      color: var(--text-secondary, #666);
      font-size: 0.875rem;
      min-width: 2.5rem;
    }
    
    .cue-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .cue-time {
      font-size: 0.75rem;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
      color: var(--primary, #0066CC);
    }
    
    .cue-text {
      color: var(--text, #333);
      line-height: 1.4;
      white-space: pre-wrap;
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
  private cues: SubtitleCue[] = [];

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadSubtitle();
    }
  }

  private async loadSubtitle() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;

    try {
      const text = await this.file.text();
      const extension = this.file.name.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        case 'srt':
          this.cues = this.parseSrt(text);
          break;
        case 'vtt':
          this.cues = this.parseVtt(text);
          break;
        case 'ass':
        case 'ssa':
          this.cues = this.parseAss(text);
          break;
        default:
          this.cues = this.parseSrt(text); // Try SRT as fallback
      }
      
      this.loading = false;
    } catch (e) {
      console.error('Failed to parse subtitle:', e);
      this.error = `${t('loading-failure', 'Failed to load subtitle')}: ${e instanceof Error ? e.message : 'Unknown error'}`;
      this.loading = false;
    }
  }

  private parseSrt(text: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const blocks = text.trim().split(/\n\n+/);
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;
      
      const index = parseInt(lines[0], 10);
      if (isNaN(index)) continue;
      
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      
      const text = lines.slice(2).join('\n').replace(/<[^>]+>/g, ''); // Strip HTML tags
      
      cues.push({
        index,
        startTime: timeMatch[1].replace(',', '.'),
        endTime: timeMatch[2].replace(',', '.'),
        text,
      });
    }
    
    return cues;
  }

  private parseVtt(text: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const lines = text.split('\n');
    
    let index = 0;
    let i = 0;
    
    // Skip WEBVTT header
    while (i < lines.length && !lines[i].includes('-->')) {
      i++;
    }
    
    while (i < lines.length) {
      const timeMatch = lines[i].match(/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})/);
      
      if (timeMatch) {
        index++;
        const textLines: string[] = [];
        i++;
        
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
          textLines.push(lines[i].replace(/<[^>]+>/g, '')); // Strip HTML/VTT tags
          i++;
        }
        
        cues.push({
          index,
          startTime: this.normalizeTime(timeMatch[1]),
          endTime: this.normalizeTime(timeMatch[2]),
          text: textLines.join('\n'),
        });
      } else {
        i++;
      }
    }
    
    return cues;
  }

  private parseAss(text: string): SubtitleCue[] {
    const cues: SubtitleCue[] = [];
    const lines = text.split('\n');
    
    let index = 0;
    
    for (const line of lines) {
      if (line.startsWith('Dialogue:')) {
        const parts = line.substring(9).split(',');
        if (parts.length >= 10) {
          index++;
          const startTime = parts[1].trim();
          const endTime = parts[2].trim();
          // Text is everything after the 9th comma, joined back together
          const text = parts.slice(9).join(',')
            .replace(/\{[^}]+\}/g, '') // Remove ASS style tags
            .replace(/\\N/g, '\n') // Convert line breaks
            .replace(/\\n/g, '\n');
          
          cues.push({
            index,
            startTime: this.normalizeAssTime(startTime),
            endTime: this.normalizeAssTime(endTime),
            text,
          });
        }
      }
    }
    
    return cues;
  }

  private normalizeTime(time: string): string {
    // Ensure format is HH:MM:SS.mmm
    const parts = time.split(':');
    if (parts.length === 2) {
      return `00:${time}`;
    }
    return time;
  }

  private normalizeAssTime(time: string): string {
    // ASS format: H:MM:SS.cc -> HH:MM:SS.ccc
    const parts = time.split(':');
    if (parts.length === 3) {
      const hours = parts[0].padStart(2, '0');
      const mins = parts[1].padStart(2, '0');
      const secsAndCents = parts[2].split('.');
      const secs = secsAndCents[0].padStart(2, '0');
      const cents = (secsAndCents[1] || '00').padEnd(3, '0');
      return `${hours}:${mins}:${secs}.${cents}`;
    }
    return time;
  }

  render() {
    if (!this.file) {
      return html`<div class="subtitle-viewer">${t('no-file-selected', 'No file selected')}</div>`;
    }

    if (this.loading) {
      return html`<div class="subtitle-viewer"><div class="loading">${t('loading', 'Loading...')}</div></div>`;
    }

    if (this.error) {
      return html`<div class="subtitle-viewer"><div class="error">${this.error}</div></div>`;
    }

    return html`
      <div class="subtitle-viewer">
        <div class="subtitle-container">
          <div class="subtitle-header">
            <span class="subtitle-count">${this.cues.length} ${t('subtitles', 'subtitles')}</span>
          </div>
          <ul class="subtitle-list">
            ${this.cues.map(cue => html`
              <li class="subtitle-cue">
                <span class="cue-index">#${cue.index}</span>
                <div class="cue-content">
                  <span class="cue-time">${cue.startTime} → ${cue.endTime}</span>
                  <span class="cue-text">${cue.text}</span>
                </div>
              </li>
            `)}
          </ul>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'subtitle-viewer': SubtitleViewer;
  }
}
