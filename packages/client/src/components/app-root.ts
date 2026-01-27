import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { negotiateLanguages } from '@fluent/langneg';
import Cookie from 'js-cookie';
import { 
  initLocalization, 
  localizations, 
  type Locale, 
  locales, 
} from '../common/Localization';

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
  private currentRoute: 'home' | 'viewer' | 'create' = 'home';

  @state()
  private selectedFile: File | null = null;

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
    let locale: Locale;
    if (savedLocale && locales.includes(savedLocale)) {
      locale = savedLocale;
    } else {
      const negotiated = negotiateLanguages(
        navigator.languages,
        Object.keys(localizations),
        { defaultLocale: 'en-US' }
      ) as Locale[];
      locale = negotiated[0] || 'en-US';
    }
    initLocalization(locale);
  }

  private handleLocaleChanged(e: Event) {
    const customEvent = e as CustomEvent<{ locale: Locale }>;
    Cookie.set(localeCookieName, customEvent.detail.locale);
  }

  private handlePopState() {
    this.updateRouteFromPath();
  }

  private updateRouteFromPath() {
    const path = window.location.pathname;
    if (path === '/viewer' && this.selectedFile) {
      this.currentRoute = 'viewer';
    } else if (path === '/create') {
      this.currentRoute = 'create';
    } else {
      this.currentRoute = 'home';
    }
  }

  public navigate(route: 'home' | 'viewer' | 'create') {
    this.currentRoute = route;
    let path: string;
    switch (route) {
      case 'viewer':
        path = '/viewer';
        break;
      case 'create':
        path = '/create';
        break;
      default:
        path = '/';
    }
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

  private handleNavigateCreate() {
    this.navigate('create');
  }

  render() {
    if (this.currentRoute === 'viewer' && this.selectedFile) {
      return html`
        <viewer-page
          .file=${this.selectedFile}
          @back-to-home=${this.handleBackToHome}
        ></viewer-page>
      `;
    }

    if (this.currentRoute === 'create') {
      return html`
        <create-page
          @back-to-home=${this.handleBackToHome}
        ></create-page>
      `;
    }

    return html`
      <home-page
        @file-selected=${this.handleFileSelected}
        @navigate-create=${this.handleNavigateCreate}
      ></home-page>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-root': AppRoot;
  }
}
