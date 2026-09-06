import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { negotiateLanguages } from '@fluent/langneg';
import Cookie from 'js-cookie';
import { 
  initLocalization, 
  type Locale, 
  locales, 
} from '../common/Localization';
import {
  EMBED_PROTOCOL,
  EMBED_PROTOCOL_VERSION,
  EmbedRequestError,
  messageTypeFromMessage,
  parseEmbedConfigureRequest,
  parseEmbedOpenFileRequest,
  requestIdFromMessage,
} from '../common/embed-protocol';
import {
  EMBED_STYLE_PARAMETERS,
  THEME_MODES,
  applyEmbedAppearance,
  applyEmbedStyles,
  applyTheme,
  getPreferredThemeMode,
} from '../common/theme';

const localeCookieName = 'Locale';

function isEmbedPage(): boolean {
  return window.parent !== window && new URLSearchParams(window.location.search).get('embed') === '1';
}

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
    .embed-status {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 1rem;
      box-sizing: border-box;
      color: var(--text-secondary, #666);
      text-align: center;
    }
    .embed-error { color: var(--error, #dc2626); }
  `;

  @state()
  private currentRoute: 'home' | 'viewer' = 'home';

  @state()
  private selectedFile: File | null = null;

  @state()
  private darkMode = false;

  @state()
  private embedMode = false;

  @state()
  private embedError: string | null = null;

  private embedParentOrigin: string | null = null;

  constructor() {
    super();
    this.initLocale();
    this.handlePopState = this.handlePopState.bind(this);
    this.handleThemeChanged = this.handleThemeChanged.bind(this);
    this.handleEmbedMessage = this.handleEmbedMessage.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('locale-changed', this.handleLocaleChanged.bind(this));
    window.addEventListener('theme-changed', this.handleThemeChanged);
    this.configureEmbedMode();
    if (!this.embedMode) applyTheme(getPreferredThemeMode());
    this.darkMode = document.body.classList.contains('dark-mode');
    this.updateRouteFromPath();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('theme-changed', this.handleThemeChanged);
    window.removeEventListener('message', this.handleEmbedMessage);
  }

  private initLocale() {
    const requestedLocale = isEmbedPage()
      ? new URLSearchParams(window.location.search).get('lang') as Locale | null
      : null;
    const savedLocale = Cookie.get(localeCookieName) as Locale;
    let locale: Locale;
    if (requestedLocale && locales.includes(requestedLocale)) {
      locale = requestedLocale;
    } else if (savedLocale && locales.includes(savedLocale)) {
      locale = savedLocale;
    } else {
      const negotiated = negotiateLanguages(
        navigator.languages,
        locales,
        { defaultLocale: 'en-US' }
      ) as Locale[];
      locale = negotiated[0] || 'en-US';
    }
    initLocalization(locale);
    document.documentElement.lang = locale;
  }

  private handleLocaleChanged(e: Event) {
    const customEvent = e as CustomEvent<{ locale: Locale }>;
    Cookie.set(localeCookieName, customEvent.detail.locale);
  }

  private handlePopState() {
    this.updateRouteFromPath();
  }

  private handleThemeChanged(e: Event) {
    const customEvent = e as CustomEvent<{ dark: boolean }>;
    this.darkMode = customEvent.detail.dark;
  }

  private updateRouteFromPath() {
    const path = window.location.pathname;
    if (path === '/viewer' && this.selectedFile) {
      this.currentRoute = 'viewer';
    } else {
      this.currentRoute = 'home';
    }
  }

  private configureEmbedMode() {
    const params = new URLSearchParams(window.location.search);
    if (!isEmbedPage()) return;

    this.embedMode = true;
    const configuredOrigin = params.get('parentOrigin');
    try {
      if (!configuredOrigin) throw new Error('The parentOrigin query parameter is required');
      const url = new URL(configuredOrigin);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('The parent origin must use HTTP or HTTPS');
      this.configureEmbedAppearance(params);
      this.embedParentOrigin = url.origin;
      window.addEventListener('message', this.handleEmbedMessage);
      queueMicrotask(() => this.postEmbedMessage({
        type: 'ready',
        capabilities: {
          languages: locales,
          themes: THEME_MODES,
          styles: EMBED_STYLE_PARAMETERS,
        },
      }));
    } catch (error) {
      this.embedError = error instanceof Error ? error.message : 'Invalid parent origin';
    }
  }

  private configureEmbedAppearance(params: URLSearchParams) {
    this.darkMode = applyEmbedAppearance(params);
  }

  private postEmbedMessage(message: Record<string, unknown>) {
    if (!this.embedParentOrigin) return;
    window.parent.postMessage({ protocol: EMBED_PROTOCOL, version: EMBED_PROTOCOL_VERSION, ...message }, this.embedParentOrigin);
  }

  private handleEmbedMessage(event: MessageEvent) {
    if (!this.embedParentOrigin || event.source !== window.parent || event.origin !== this.embedParentOrigin) return;

    const messageType = messageTypeFromMessage(event.data);
    try {
      if (messageType === 'configure') {
        const { requestId, styles } = parseEmbedConfigureRequest(event.data);
        applyEmbedStyles(styles);
        this.postEmbedMessage({ type: 'configure-result', requestId, ok: true });
        return;
      }
      const { requestId, file } = parseEmbedOpenFileRequest(event.data);
      this.openFile(file);
      this.postEmbedMessage({
        type: 'open-file-result',
        requestId,
        ok: true,
        file: { name: file.name, size: file.size, type: file.type },
      });
    } catch (error) {
      const embedError = error instanceof EmbedRequestError
        ? error
        : new EmbedRequestError('invalid-request', 'Could not process the message');
      this.postEmbedMessage({
        type: messageType === 'configure' ? 'configure-result' : 'open-file-result',
        requestId: requestIdFromMessage(event.data),
        ok: false,
        error: { code: embedError.code, message: embedError.message },
      });
    }
  }

  public navigate(route: 'home' | 'viewer') {
    this.currentRoute = route;
    const path = route === 'viewer' ? '/viewer' : '/';
    window.history.pushState({}, '', `${path}${this.embedMode ? window.location.search : ''}`);
  }

  private handleFileSelected(e: CustomEvent<File>) {
    this.openFile(e.detail);
  }

  private openFile(file: File) {
    this.selectedFile = file;
    this.navigate('viewer');
    window.scrollTo(0, 0);
  }

  private handleBackToHome() {
    this.selectedFile = null;
    this.navigate('home');
    window.scrollTo(0, 0);
  }

  render() {
    if (this.currentRoute === 'viewer' && this.selectedFile) {
      return html`
        <viewer-page
          .file=${this.selectedFile}
          .darkMode=${this.darkMode}
          .embedMode=${this.embedMode}
          @back-to-home=${this.handleBackToHome}
        ></viewer-page>
      `;
    }

    if (this.embedMode) {
      return html`<div class="embed-status ${this.embedError ? 'embed-error' : ''}">
        ${this.embedError || 'Waiting for a file from the host...'}
      </div>`;
    }

    return html`
      <home-page
        @file-selected=${this.handleFileSelected}
      ></home-page>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
