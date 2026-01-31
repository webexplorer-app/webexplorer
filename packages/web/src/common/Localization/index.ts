import enUS from "./en-US.ftl?raw";
import zhCN from "./zh-CN.ftl?raw";
import { FluentBundle, FluentResource } from "@fluent/bundle";

export interface Localization {
  locale: "en-US" | "zh-CN";
  content: string;
}

export type Locale = Localization["locale"];

export const localizations: Localization[] = [
  {
    locale: "en-US",
    content: enUS,
  },
  {
    locale: "zh-CN",
    content: zhCN,
  },
];

export const locales: Locale[] = ["en-US", "zh-CN"];

let currentBundle: FluentBundle | null = null;
let currentLocale: Locale = "en-US";

export function initLocalization(locale: Locale): FluentBundle {
  const localization: Localization =
    localizations.find((l) => l.locale === locale) || localizations[0];

  const resource = new FluentResource(localization.content);
  const bundle = new FluentBundle(localization.locale);
  bundle.addResource(resource);

  currentBundle = bundle;
  currentLocale = locale;

  return bundle;
}

export function getBundle(): FluentBundle {
  if (!currentBundle) {
    return initLocalization("en-US");
  }
  return currentBundle;
}

export function getCurrentLocale(): Locale {
  return currentLocale;
}

export function t(id: string, fallback?: string): string {
  const bundle = getBundle();
  const message = bundle.getMessage(id);
  if (message?.value) {
    return bundle.formatPattern(message.value);
  }
  return fallback || id;
}

export function setLocale(locale: Locale): void {
  initLocalization(locale);
  // Dispatch a custom event to notify components
  window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
}

