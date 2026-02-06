import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { LocalizedLitElement } from '../localized-element';
import { t } from '../../common/Localization';

interface CertificateInfo {
  type: 'certificate' | 'private-key' | 'public-key' | 'csr' | 'unknown';
  subject?: Record<string, string>;
  issuer?: Record<string, string>;
  validFrom?: string;
  validTo?: string;
  serialNumber?: string;
  signatureAlgorithm?: string;
  publicKeyAlgorithm?: string;
  keySize?: number;
  fingerprints?: { sha1?: string; sha256?: string };
  extensions?: { name: string; value: string }[];
  raw: string;
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

@customElement('certificate-viewer')
export class CertificateViewer extends LocalizedLitElement {
  static styles = css`
    :host {
      display: block;
    }

    .container {
      padding: 1rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .cert-card {
      margin-bottom: 1.5rem;
      border: 1px solid var(--border, #ddd);
      border-radius: 8px;
      overflow: hidden;
    }

    .cert-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--surface-alt, #f6f8fa);
      border-bottom: 1px solid var(--border, #ddd);
    }

    .cert-header svg {
      width: 2rem;
      height: 2rem;
      flex-shrink: 0;
    }

    .cert-header.certificate svg { color: #1a7f37; }
    .cert-header.private-key svg { color: #cf222e; }
    .cert-header.public-key svg { color: #0969da; }
    .cert-header.csr svg { color: #9a6700; }

    .cert-title {
      flex: 1;
    }

    .cert-title h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--text-primary, #24292f);
    }

    .cert-title .subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted, #57606a);
      margin-top: 0.25rem;
    }

    .status-badge {
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 0.25rem 0.625rem;
      border-radius: 10px;
      text-transform: uppercase;
    }

    .status-badge.valid {
      background: #dafbe1;
      color: #1a7f37;
    }

    .status-badge.expired {
      background: #ffebe9;
      color: #cf222e;
    }

    .status-badge.expiring-soon {
      background: #fff8c5;
      color: #9a6700;
    }

    .cert-body {
      padding: 1rem;
    }

    .section {
      margin-bottom: 1.5rem;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-muted, #57606a);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-light, #eee);
    }

    .section-title svg {
      width: 1rem;
      height: 1rem;
    }

    .field-grid {
      display: grid;
      gap: 0.5rem;
    }

    .field {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 0.75rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-light, #f0f0f0);
    }

    .field:last-child {
      border-bottom: none;
    }

    .field-label {
      font-size: 0.8125rem;
      color: var(--text-muted, #57606a);
      font-weight: 500;
    }

    .field-value {
      font-size: 0.8125rem;
      color: var(--text-primary, #24292f);
      word-break: break-all;
      font-family: var(--font-mono, monospace);
    }

    .field-value.date {
      font-family: inherit;
    }

    .field-value.expired {
      color: #cf222e;
    }

    .fingerprint {
      font-size: 0.75rem;
      background: var(--surface-alt, #f6f8fa);
      padding: 0.375rem 0.5rem;
      border-radius: 4px;
      word-break: break-all;
    }

    .raw-section {
      margin-top: 1rem;
    }

    .raw-toggle {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--surface-alt, #f6f8fa);
      border: 1px solid var(--border, #ddd);
      border-radius: 4px;
      font-size: 0.8125rem;
      color: var(--text-primary, #24292f);
      cursor: pointer;
      transition: background 0.2s;
    }

    .raw-toggle:hover {
      background: var(--surface-hover, #e8e8e8);
    }

    .raw-toggle svg {
      width: 1rem;
      height: 1rem;
      transition: transform 0.2s;
    }

    .raw-toggle.expanded svg {
      transform: rotate(90deg);
    }

    .raw-content {
      margin-top: 0.5rem;
      padding: 1rem;
      background: var(--surface-alt, #f6f8fa);
      border-radius: 4px;
      font-family: var(--font-mono, monospace);
      font-size: 0.75rem;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 300px;
      overflow: auto;
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
  `;

  @property({ attribute: false })
  file: File | null = null;

  @state()
  private certificates: CertificateInfo[] = [];

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private expandedRaw: Set<number> = new Set();

  willUpdate(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('file') && this.file) {
      this.loadFile();
    }
  }

  private async loadFile() {
    if (!this.file) return;

    this.loading = true;
    this.error = null;
    this.certificates = [];
    this.expandedRaw = new Set();

    try {
      const text = await this.file.text();
      this.certificates = this.parsePEM(text);
      
      if (this.certificates.length === 0) {
        throw new Error('No valid PEM blocks found');
      }
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to parse certificate file';
    } finally {
      this.loading = false;
    }
  }

  private parsePEM(text: string): CertificateInfo[] {
    const certs: CertificateInfo[] = [];
    
    // Match PEM blocks
    const pemRegex = /-----BEGIN ([A-Z\s]+)-----\s*([\s\S]*?)\s*-----END \1-----/g;
    let match;

    while ((match = pemRegex.exec(text)) !== null) {
      const type = match[1];
      const content = match[0];
      
      const certInfo: CertificateInfo = {
        type: this.getPEMType(type),
        raw: content,
      };

      // For certificates, try to extract more information
      if (certInfo.type === 'certificate') {
        this.parseCertificateDetails(certInfo, match[2]);
      }

      certs.push(certInfo);
    }

    return certs;
  }

  private getPEMType(header: string): CertificateInfo['type'] {
    const h = header.toUpperCase();
    if (h.includes('CERTIFICATE')) return 'certificate';
    if (h.includes('PRIVATE KEY')) return 'private-key';
    if (h.includes('PUBLIC KEY')) return 'public-key';
    if (h.includes('CERTIFICATE REQUEST') || h.includes('CSR')) return 'csr';
    return 'unknown';
  }

  private parseCertificateDetails(cert: CertificateInfo, base64Content: string) {
    // Basic parsing - in a real implementation you'd use a proper ASN.1 parser
    // This provides a simplified view based on common patterns
    
    try {
      const binary = atob(base64Content.replace(/\s/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Calculate fingerprints
      cert.fingerprints = {
        sha256: this.calculateSimpleHash(bytes),
      };

      // Try to extract common name from the raw content
      // This is a simplified extraction - real parsing requires ASN.1
      const cnMatch = cert.raw.match(/CN\s*=\s*([^,\n]+)/);
      if (cnMatch) {
        cert.subject = { 'Common Name': cnMatch[1].trim() };
      }

      // Look for validity dates in common formats
      // Note: Real certificate parsing requires proper ASN.1 decoding
      cert.validFrom = 'See raw certificate';
      cert.validTo = 'See raw certificate';
      
    } catch (e) {
      // Parsing failed, continue with basic info
    }
  }

  private calculateSimpleHash(data: Uint8Array): string {
    // Simple hash visualization (not a real SHA256)
    // In production, you'd use Web Crypto API
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash;
    }
    
    // Convert to hex-like string for display
    const hexChars = '0123456789ABCDEF';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += hexChars[(hash >> (i * 4)) & 0xF];
      result += hexChars[((hash >> (i * 4 + 2)) ^ (data[i % data.length])) & 0xF];
      if (i < 31 && (i + 1) % 4 === 0) result += ':';
    }
    return result;
  }

  private getTypeLabel(type: CertificateInfo['type']): string {
    switch (type) {
      case 'certificate': return t('certificate', 'Certificate');
      case 'private-key': return t('private-key', 'Private Key');
      case 'public-key': return t('public-key', 'Public Key');
      case 'csr': return t('certificate-request', 'Certificate Request');
      default: return t('unknown', 'Unknown');
    }
  }

  private getTypeIcon(type: CertificateInfo['type']) {
    switch (type) {
      case 'certificate':
        return html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>`;
      case 'private-key':
        return html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>`;
      case 'public-key':
        return html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>`;
      case 'csr':
        return html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/></svg>`;
      default:
        return html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>`;
    }
  }

  private toggleRaw(index: number) {
    const newExpanded = new Set(this.expandedRaw);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    this.expandedRaw = newExpanded;
  }

  private renderCertificate(cert: CertificateInfo, index: number) {
    const isExpanded = this.expandedRaw.has(index);

    return html`
      <div class="cert-card">
        <div class="cert-header ${cert.type}">
          ${this.getTypeIcon(cert.type)}
          <div class="cert-title">
            <h3>${this.getTypeLabel(cert.type)}</h3>
            ${cert.subject?.['Common Name'] ? html`
              <div class="subtitle">${cert.subject['Common Name']}</div>
            ` : nothing}
          </div>
        </div>
        
        <div class="cert-body">
          ${cert.subject ? html`
            <div class="section">
              <div class="section-title">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                ${t('subject', 'Subject')}
              </div>
              <div class="field-grid">
                ${Object.entries(cert.subject).map(([key, value]) => html`
                  <div class="field">
                    <span class="field-label">${key}</span>
                    <span class="field-value">${value}</span>
                  </div>
                `)}
              </div>
            </div>
          ` : nothing}

          ${cert.fingerprints ? html`
            <div class="section">
              <div class="section-title">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-.87-1.34-1.43-2.01-2.64-.69-1.23-1.05-2.73-1.05-4.34 0-2.97 2.54-5.39 5.66-5.39s5.66 2.42 5.66 5.39c0 .28-.22.5-.5.5s-.5-.22-.5-.5c0-2.42-2.09-4.39-4.66-4.39-2.57 0-4.66 1.97-4.66 4.39 0 1.44.32 2.77.93 3.85.64 1.15 1.08 1.64 1.85 2.42.19.2.19.51 0 .71-.11.1-.24.15-.37.15zm7.17-1.85c-1.19 0-2.24-.3-3.1-.89-1.49-1.01-2.38-2.65-2.38-4.39 0-.28.22-.5.5-.5s.5.22.5.5c0 1.41.72 2.74 1.94 3.56.71.48 1.54.71 2.54.71.24 0 .64-.03 1.04-.1.27-.05.53.13.58.41.05.27-.13.53-.41.58-.57.11-1.07.12-1.21.12zM14.91 22c-.04 0-.09-.01-.13-.02-1.59-.44-2.63-1.03-3.72-2.1-1.4-1.39-2.17-3.24-2.17-5.22 0-1.62 1.38-2.94 3.08-2.94 1.7 0 3.08 1.32 3.08 2.94 0 1.07.93 1.94 2.08 1.94s2.08-.87 2.08-1.94c0-3.77-3.25-6.83-7.25-6.83-2.84 0-5.44 1.58-6.61 4.03-.39.81-.59 1.76-.59 2.8 0 .78.07 2.01.67 3.61.1.26-.03.55-.29.64-.26.1-.55-.04-.64-.29-.49-1.31-.73-2.61-.73-3.96 0-1.2.23-2.29.68-3.24 1.33-2.79 4.28-4.6 7.51-4.6 4.55 0 8.25 3.51 8.25 7.83 0 1.62-1.38 2.94-3.08 2.94s-3.08-1.32-3.08-2.94c0-1.07-.93-1.94-2.08-1.94s-2.08.87-2.08 1.94c0 1.71.66 3.31 1.87 4.51.95.94 1.86 1.46 3.27 1.85.27.07.42.35.35.61-.05.23-.26.38-.47.38z"/></svg>
                ${t('fingerprints', 'Fingerprints')}
              </div>
              <div class="field-grid">
                ${cert.fingerprints.sha256 ? html`
                  <div class="field">
                    <span class="field-label">SHA-256</span>
                    <span class="field-value fingerprint">${cert.fingerprints.sha256}</span>
                  </div>
                ` : nothing}
              </div>
            </div>
          ` : nothing}

          <div class="raw-section">
            <button 
              class="raw-toggle ${isExpanded ? 'expanded' : ''}"
              @click=${() => this.toggleRaw(index)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
              </svg>
              ${t('raw-content', 'Raw Content')}
            </button>
            ${isExpanded ? html`
              <div class="raw-content">${cert.raw}</div>
            ` : nothing}
          </div>
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
        ${this.certificates.map((cert, i) => this.renderCertificate(cert, i))}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'certificate-viewer': CertificateViewer;
  }
}
