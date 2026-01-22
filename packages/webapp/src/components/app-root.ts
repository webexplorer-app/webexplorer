import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { negotiateLanguages } from '@fluent/langneg';
import Cookie from 'js-cookie';
import { 
  initLocalization, 
  localizations, 
  type Locale, 
  locales, 
  setLocale 
} from '../Utils/Localization';

const localeCookieName = 'Locale';

@customElement('app-root')
export class AppRoot extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }
  `;

  @state()
  private currentRoute: 'home' | 'viewer' = 'home';

  @state()
  private selectedFile: File | null = null;

  @state()
  private locale: Locale = 'en-US';

  constructor() {
    super();
    this.initLocale();
    this.handlePopState = this.handlePopState.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.handlePopState);
    window.addEventListener('locale-changed', this.handleLocaleChanged.bind(this));
    this.updateRouteFromPath();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.handlePopState);
  }

  private initLocale() {
    const savedLocale = Cookie.get(localeCookieName) as Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      this.locale = savedLocale;
    } else {
      const negotiated = negotiateLanguages(
        navigator.languages,
        Object.keys(localizations),
        { defaultLocale: 'en-US' }
      ) as Locale[];
      this.locale = negotiated[0] || 'en-US';
    }
    initLocalization(this.locale);
  }

  private handleLocaleChanged(e: Event) {
    const customEvent = e as CustomEvent<{ locale: Locale }>;
    this.locale = customEvent.detail.locale;
    Cookie.set(localeCookieName, this.locale);
    this.requestUpdate();
  }

  private handlePopState() {
    this.updateRouteFromPath();
  }

  private updateRouteFromPath() {
    const path = window.location.pathname;
    if (path === '/viewer' && this.selectedFile) {
      this.currentRoute = 'viewer';
    } else {
      this.currentRoute = 'home';
    }
  }

  public navigate(route: 'home' | 'viewer') {
    this.currentRoute = route;
    const path = route === 'home' ? '/' : '/viewer';
    window.history.pushState({}, '', path);
  }

  private handleFileSelected(e: CustomEvent<File>) {
    this.selectedFile = e.detail;
    this.navigate('viewer');
  }

  private handleBackToHome() {
    this.selectedFile = null;
    this.navigate('home');
  }

  render() {
    if (this.currentRoute === 'viewer' && this.selectedFile) {
      return html`
        <viewer-page
          .file=${this.selectedFile}
          .locale=${this.locale}
          @back-to-home=${this.handleBackToHome}
          @locale-change=${(e: CustomEvent<Locale>) => setLocale(e.detail)}
        ></viewer-page>
      `;
    }

    return html`
      <home-page
        .locale=${this.locale}
        @file-selected=${this.handleFileSelected}
        @locale-change=${(e: CustomEvent<Locale>) => setLocale(e.detail)}
      ></home-page>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
