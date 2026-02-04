import { html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface VEvent {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  dtstart?: Date;
  dtend?: Date;
  organizer?: string;
  attendees?: string[];
  rrule?: string;
  status?: string;
  categories?: string[];
}

interface VContact {
  fn?: string;
  n?: { family?: string; given?: string; middle?: string; prefix?: string; suffix?: string };
  nickname?: string;
  email?: string[];
  tel?: { type?: string; value: string }[];
  adr?: { type?: string; street?: string; city?: string; region?: string; postal?: string; country?: string }[];
  org?: string;
  title?: string;
  url?: string[];
  bday?: string;
  note?: string;
  photo?: string;
}

@customElement('ical-viewer')
export class ICalViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .container {
      background: var(--surface, #fff);
      border-radius: 8px;
      overflow: hidden;
    }

    .header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border, #eee);
      background: var(--surface-alt, #f5f5f5);
    }

    .header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--text-primary, #333);
    }

    .header .count {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
      margin-top: 0.25rem;
    }

    .list {
      display: flex;
      flex-direction: column;
    }

    .item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-light, #eee);
      transition: background 0.2s;
    }

    .item:last-child {
      border-bottom: none;
    }

    .item:hover {
      background: var(--surface-hover, #f9f9f9);
    }

    /* Event styles */
    .event-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary, #333);
      margin-bottom: 0.5rem;
    }

    .event-time {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-primary, #333);
      margin-bottom: 0.25rem;
    }

    .event-time svg {
      width: 1rem;
      height: 1rem;
      color: var(--text-muted, #666);
    }

    .event-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }

    .event-location svg {
      width: 1rem;
      height: 1rem;
    }

    .event-description {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-light, #eee);
      font-size: 0.875rem;
      color: var(--text-secondary, #555);
      white-space: pre-wrap;
    }

    .event-status {
      display: inline-block;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      margin-left: 0.5rem;
      text-transform: uppercase;
    }

    .status-confirmed {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-tentative {
      background: #fff3e0;
      color: #ef6c00;
    }

    .status-cancelled {
      background: #ffebee;
      color: #c62828;
    }

    /* Contact styles */
    .contact-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .contact-avatar {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: var(--primary, #3b82f6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .contact-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .contact-name {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary, #333);
    }

    .contact-title {
      font-size: 0.875rem;
      color: var(--text-muted, #666);
    }

    .contact-details {
      display: grid;
      gap: 0.5rem;
    }

    .contact-field {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .contact-field svg {
      width: 1rem;
      height: 1rem;
      color: var(--text-muted, #666);
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .contact-field-value {
      color: var(--text-primary, #333);
    }

    .contact-field-value a {
      color: var(--text-link, #3b82f6);
      text-decoration: none;
    }

    .contact-field-value a:hover {
      text-decoration: underline;
    }

    .contact-note {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-light, #eee);
      font-size: 0.875rem;
      color: var(--text-secondary, #555);
      white-space: pre-wrap;
    }

    .error {
      padding: 2rem;
      text-align: center;
      color: var(--error, #dc2626);
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted, #666);
    }
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private events: VEvent[] = [];

  @state()
  private contacts: VContact[] = [];

  @state()
  private fileType: 'ics' | 'vcf' | null = null;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.events = [];
    this.contacts = [];

    try {
      const text = await this.file.text();
      const ext = this.file.name.split('.').pop()?.toLowerCase();

      if (ext === 'ics' || text.includes('BEGIN:VCALENDAR')) {
        this.fileType = 'ics';
        this.events = this.parseICS(text);
      } else if (ext === 'vcf' || text.includes('BEGIN:VCARD')) {
        this.fileType = 'vcf';
        this.contacts = this.parseVCF(text);
      } else {
        throw new Error('Unknown file format');
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse file';
    } finally {
      this.loading = false;
    }
  }

  private parseICS(text: string): VEvent[] {
    const events: VEvent[] = [];
    const lines = this.unfoldLines(text);
    
    let currentEvent: VEvent | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');
        const keyBase = key.split(';')[0];

        switch (keyBase) {
          case 'UID':
            currentEvent.uid = value;
            break;
          case 'SUMMARY':
            currentEvent.summary = this.unescapeValue(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = this.unescapeValue(value);
            break;
          case 'LOCATION':
            currentEvent.location = this.unescapeValue(value);
            break;
          case 'DTSTART':
            currentEvent.dtstart = this.parseICSDate(value, key);
            break;
          case 'DTEND':
            currentEvent.dtend = this.parseICSDate(value, key);
            break;
          case 'ORGANIZER':
            currentEvent.organizer = value.replace(/^mailto:/i, '');
            break;
          case 'ATTENDEE':
            if (!currentEvent.attendees) currentEvent.attendees = [];
            currentEvent.attendees.push(value.replace(/^mailto:/i, ''));
            break;
          case 'RRULE':
            currentEvent.rrule = value;
            break;
          case 'STATUS':
            currentEvent.status = value;
            break;
          case 'CATEGORIES':
            currentEvent.categories = value.split(',').map(c => c.trim());
            break;
        }
      }
    }

    return events.sort((a, b) => {
      if (!a.dtstart) return 1;
      if (!b.dtstart) return -1;
      return a.dtstart.getTime() - b.dtstart.getTime();
    });
  }

  private parseVCF(text: string): VContact[] {
    const contacts: VContact[] = [];
    const lines = this.unfoldLines(text);
    
    let currentContact: VContact | null = null;

    for (const line of lines) {
      if (line === 'BEGIN:VCARD') {
        currentContact = {};
      } else if (line === 'END:VCARD' && currentContact) {
        contacts.push(currentContact);
        currentContact = null;
      } else if (currentContact) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;
        
        const keyPart = line.substring(0, colonIndex);
        const value = line.substring(colonIndex + 1);
        const [keyBase, ...params] = keyPart.split(';');
        const type = params.find(p => p.startsWith('TYPE='))?.replace('TYPE=', '') || '';

        switch (keyBase.toUpperCase()) {
          case 'FN':
            currentContact.fn = this.unescapeValue(value);
            break;
          case 'N':
            const [family, given, middle, prefix, suffix] = value.split(';');
            currentContact.n = { family, given, middle, prefix, suffix };
            break;
          case 'NICKNAME':
            currentContact.nickname = this.unescapeValue(value);
            break;
          case 'EMAIL':
            if (!currentContact.email) currentContact.email = [];
            currentContact.email.push(value);
            break;
          case 'TEL':
            if (!currentContact.tel) currentContact.tel = [];
            currentContact.tel.push({ type, value });
            break;
          case 'ADR':
            if (!currentContact.adr) currentContact.adr = [];
            const [, , street, city, region, postal, country] = value.split(';');
            currentContact.adr.push({ type, street, city, region, postal, country });
            break;
          case 'ORG':
            currentContact.org = this.unescapeValue(value);
            break;
          case 'TITLE':
            currentContact.title = this.unescapeValue(value);
            break;
          case 'URL':
            if (!currentContact.url) currentContact.url = [];
            currentContact.url.push(value);
            break;
          case 'BDAY':
            currentContact.bday = value;
            break;
          case 'NOTE':
            currentContact.note = this.unescapeValue(value);
            break;
          case 'PHOTO':
            if (params.some(p => p.includes('ENCODING=BASE64') || p.includes('ENCODING=b'))) {
              const mediaType = params.find(p => p.includes('TYPE=') || p.includes('MEDIATYPE='))
                ?.replace(/TYPE=|MEDIATYPE=/i, '') || 'jpeg';
              currentContact.photo = `data:image/${mediaType};base64,${value}`;
            } else if (value.startsWith('http')) {
              currentContact.photo = value;
            }
            break;
        }
      }
    }

    return contacts.sort((a, b) => (a.fn || '').localeCompare(b.fn || ''));
  }

  private unfoldLines(text: string): string[] {
    // Handle line folding (lines starting with space/tab are continuations)
    const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\r?\n[ \t]/g, '');
    return unfolded.split(/\r?\n/).filter(line => line.trim());
  }

  private unescapeValue(value: string): string {
    return value
      .replace(/\\n/gi, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  private parseICSDate(value: string, key: string): Date | undefined {
    try {
      // Check for TZID parameter
      const tzMatch = key.match(/TZID=([^;:]+)/);
      
      // Handle date-only format (YYYYMMDD)
      if (value.length === 8 && /^\d{8}$/.test(value)) {
        const year = parseInt(value.slice(0, 4));
        const month = parseInt(value.slice(4, 6)) - 1;
        const day = parseInt(value.slice(6, 8));
        return new Date(year, month, day);
      }
      
      // Handle datetime format (YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ)
      const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
      if (match) {
        const [, year, month, day, hour, min, sec, isUTC] = match;
        if (isUTC || !tzMatch) {
          return new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(min),
            parseInt(sec)
          ));
        } else {
          return new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(min),
            parseInt(sec)
          );
        }
      }
      
      return undefined;
    } catch {
      return undefined;
    }
  }

  private formatDate(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  private formatTime(date: Date | undefined): string {
    if (!date) return '';
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatDateRange(start: Date | undefined, end: Date | undefined): string {
    if (!start) return '';
    
    const startDate = this.formatDate(start);
    const startTime = this.formatTime(start);
    
    if (!end) {
      return startTime ? `${startDate} ${startTime}` : startDate;
    }
    
    const endDate = this.formatDate(end);
    const endTime = this.formatTime(end);
    
    // Same day
    if (startDate === endDate) {
      return `${startDate} ${startTime} - ${endTime}`;
    }
    
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }

  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private formatAddress(adr: VContact['adr']): string {
    if (!adr || adr.length === 0) return '';
    const a = adr[0];
    const parts = [a.street, a.city, a.region, a.postal, a.country].filter(Boolean);
    return parts.join(', ');
  }

  private renderEvent(event: VEvent): TemplateResult {
    return html`
      <div class="item">
        <div class="event-title">
          ${event.summary || 'Untitled Event'}
          ${event.status ? this.renderStatus(event.status) : null}
        </div>
        <div class="event-time">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
          ${this.formatDateRange(event.dtstart, event.dtend)}
        </div>
        ${event.location ? html`
          <div class="event-location">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            ${event.location}
          </div>
        ` : null}
        ${event.description ? html`
          <div class="event-description">${event.description}</div>
        ` : null}
      </div>
    `;
  }

  private renderStatus(status: string): TemplateResult {
    const statusClass = `event-status status-${status.toLowerCase()}`;
    return html`<span class="${statusClass}">${status}</span>`;
  }

  private renderContact(contact: VContact): TemplateResult {
    const name = contact.fn || 'Unnamed Contact';
    
    return html`
      <div class="item">
        <div class="contact-header">
          <div class="contact-avatar">
            ${contact.photo
              ? html`<img src="${contact.photo}" alt="${name}" />`
              : this.getInitials(name)
            }
          </div>
          <div>
            <div class="contact-name">${name}</div>
            ${contact.title || contact.org ? html`
              <div class="contact-title">
                ${contact.title}${contact.title && contact.org ? ' · ' : ''}${contact.org}
              </div>
            ` : null}
          </div>
        </div>
        <div class="contact-details">
          ${contact.email?.map(email => html`
            <div class="contact-field">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <span class="contact-field-value">
                <a href="mailto:${email}">${email}</a>
              </span>
            </div>
          `)}
          ${contact.tel?.map(tel => html`
            <div class="contact-field">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span class="contact-field-value">
                <a href="tel:${tel.value}">${tel.value}</a>
                ${tel.type ? html` (${tel.type})` : null}
              </span>
            </div>
          `)}
          ${contact.adr && contact.adr.length > 0 ? html`
            <div class="contact-field">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span class="contact-field-value">${this.formatAddress(contact.adr)}</span>
            </div>
          ` : null}
          ${contact.url?.map(url => html`
            <div class="contact-field">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
              </svg>
              <span class="contact-field-value">
                <a href="${url}" target="_blank" rel="noopener">${url}</a>
              </span>
            </div>
          `)}
          ${contact.bday ? html`
            <div class="contact-field">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2zm4.6 9.99l-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01zM18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9z"/>
              </svg>
              <span class="contact-field-value">${contact.bday}</span>
            </div>
          ` : null}
        </div>
        ${contact.note ? html`
          <div class="contact-note">${contact.note}</div>
        ` : null}
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

    if (this.fileType === 'ics') {
      return html`
        <div class="container">
          <div class="header">
            <h2>${t('calendar-events', 'Calendar Events')}</h2>
            <div class="count">${this.events.length} ${t('events', 'events')}</div>
          </div>
          <div class="list">
            ${this.events.map(event => this.renderEvent(event))}
          </div>
        </div>
      `;
    }

    if (this.fileType === 'vcf') {
      return html`
        <div class="container">
          <div class="header">
            <h2>${t('contacts', 'Contacts')}</h2>
            <div class="count">${this.contacts.length} ${t('contacts-count', 'contacts')}</div>
          </div>
          <div class="list">
            ${this.contacts.map(contact => this.renderContact(contact))}
          </div>
        </div>
      `;
    }

    return html`<div class="error">Unknown file format</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ical-viewer': ICalViewer;
  }
}
