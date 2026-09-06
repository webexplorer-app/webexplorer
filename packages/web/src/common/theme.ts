export const THEME_MODES = ['light', 'dark', 'system'] as const;
export const EMBED_STYLE_PARAMETERS = [
  'accent',
  'background',
  'backgroundAlt',
  'surface',
  'surfaceHover',
  'border',
  'borderStrong',
  'text',
  'textSecondary',
  'codeBackground',
  'codeText',
] as const;

export type ThemeMode = typeof THEME_MODES[number];
export type EmbedStyleParameter = typeof EMBED_STYLE_PARAMETERS[number];
export type EmbedStyles = Partial<Record<EmbedStyleParameter, string>>;

const themeStorageKey = 'theme';
const hexColorPattern = /^#[0-9a-f]{6}$/i;
const embedStyleVariables: Record<EmbedStyleParameter, string[]> = {
  accent: ['--accent', '--focus', '--text-link'],
  background: ['--background'],
  backgroundAlt: ['--background-alt'],
  surface: ['--surface'],
  surfaceHover: ['--surface-hover'],
  border: ['--border'],
  borderStrong: ['--border-strong'],
  text: ['--text', '--text-primary', '--primary'],
  textSecondary: ['--text-secondary', '--secondary'],
  codeBackground: ['--code-background'],
  codeText: ['--code-text'],
};

export function isThemeMode(value: string | null): value is ThemeMode {
  return THEME_MODES.includes(value as ThemeMode);
}

export function getPreferredThemeMode(): ThemeMode {
  const saved = localStorage.getItem(themeStorageKey);
  return isThemeMode(saved) ? saved : 'system';
}

export function applyTheme(
  mode: ThemeMode,
  options: { persist?: boolean; notify?: boolean } = {},
): boolean {
  const dark = mode === 'dark'
    || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.body.classList.toggle('dark-mode', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';

  if (options.persist) localStorage.setItem(themeStorageKey, mode);
  if (options.notify) {
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark, mode } }));
  }
  return dark;
}

export function applyEmbedAppearance(params: URLSearchParams): boolean {
  const requestedTheme = params.get('theme');
  const mode = isThemeMode(requestedTheme) ? requestedTheme : 'system';
  const dark = applyTheme(mode);

  const accent = params.get('accent');
  if (accent && hexColorPattern.test(accent)) {
    applyEmbedStyles({ accent });
  }
  return dark;
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && hexColorPattern.test(value);
}

export function applyEmbedStyles(styles: EmbedStyles): void {
  for (const [parameter, value] of Object.entries(styles) as [EmbedStyleParameter, string][]) {
    for (const variable of embedStyleVariables[parameter]) {
      document.body.style.setProperty(variable, value);
    }
  }
}