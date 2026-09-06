import { expect, test, type Page } from '@playwright/test';

const parentOrigin = 'http://localhost:5174';
const viewerOrigin = 'http://localhost:5173';

async function mountEmbed(page: Page, query: URLSearchParams) {
  await page.goto(parentOrigin);
  await page.evaluate(({ src, viewerOrigin }) => {
    (window as typeof window & { embedMessages: unknown[] }).embedMessages = [];
    window.addEventListener('message', event => {
      if (event.origin === viewerOrigin) {
        (window as typeof window & { embedMessages: unknown[] }).embedMessages.push(event.data);
      }
    });
    const iframe = document.createElement('iframe');
    iframe.src = src;
    document.body.append(iframe);
  }, { src: `${viewerOrigin}/?${query}`, viewerOrigin });
}

test('opens transferred file data from the configured iframe parent', async ({ page }) => {
  await mountEmbed(page, new URLSearchParams({ embed: '1', parentOrigin }));

  const frame = page.locator('iframe');
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string }> }).embedMessages?.some(message => message.type === 'ready'));
  await frame.evaluate((element: HTMLIFrameElement) => {
    const data = new TextEncoder().encode('{"embedded":true}');
    element.contentWindow?.postMessage({
      protocol: 'webexplorer', version: 1, type: 'open-file', requestId: 'json-1',
      data, name: 'embedded.json', mimeType: 'application/json',
    }, 'http://localhost:5173', [data.buffer]);
  });

  const embeddedViewer = page.frameLocator('iframe').locator('app-root').locator('viewer-page').locator('file-viewer');
  await expect(embeddedViewer.locator('tree-viewer')).toBeVisible();
  await expect(page.frameLocator('iframe').locator('page-header')).toHaveCount(0);
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string; ok?: boolean }> }).embedMessages?.some(message => message.type === 'open-file-result' && message.ok));
});

test('ignores a parent that does not match the configured origin', async ({ page }) => {
  await mountEmbed(page, new URLSearchParams({ embed: '1', parentOrigin: viewerOrigin }));
  const frame = page.locator('iframe');
  await expect(page.frameLocator('iframe').getByText('Waiting for a file from the host...')).toBeVisible();
  await frame.evaluate((element: HTMLIFrameElement) => {
    element.contentWindow?.postMessage({
      protocol: 'webexplorer', version: 1, type: 'open-file', requestId: 'wrong-origin',
      data: new TextEncoder().encode('{}'), name: 'ignored.json', mimeType: 'application/json',
    }, 'http://localhost:5173');
  });
  await expect(page.frameLocator('iframe').locator('viewer-page')).toHaveCount(0);
});

test('applies basic URL options and semantic styles from postMessage', async ({ page }) => {
  const query = new URLSearchParams({
    embed: '1',
    parentOrigin,
    lang: 'de-DE',
    theme: 'dark',
    accent: '#e0522d',
  });
  await mountEmbed(page, query);

  await expect(page.frameLocator('iframe').getByText('Waiting for a file from the host...')).toBeVisible();
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string }> }).embedMessages?.some(message => message.type === 'ready'));
  await page.locator('iframe').evaluate((element: HTMLIFrameElement) => {
    element.contentWindow?.postMessage({
      protocol: 'webexplorer',
      version: 1,
      type: 'configure',
      requestId: 'styles-1',
      styles: {
        background: '#101820',
        backgroundAlt: '#17232d',
        surface: '#20313f',
        surfaceHover: '#294252',
        border: '#486477',
        borderStrong: '#6b899e',
        text: '#f2f6f8',
        textSecondary: '#b8c6ce',
        codeBackground: '#0b1217',
        codeText: '#d8e2e8',
      },
    }, 'http://localhost:5173');
  });
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string; requestId?: string; ok?: boolean }> }).embedMessages?.some(message => message.type === 'configure-result' && message.requestId === 'styles-1' && message.ok));
  const viewerFrame = page.frames().find(frame => frame.url().startsWith(viewerOrigin));
  expect(viewerFrame).toBeDefined();
  const appearance = await viewerFrame!.evaluate(async () => {
    const spinner = document.createElement('loading-spinner') as HTMLElement & { updateComplete: Promise<unknown> };
    document.body.append(spinner);
    await spinner.updateComplete;
    const spinnerColor = getComputedStyle(spinner.shadowRoot!.querySelector('.spinner')!).borderTopColor;
    spinner.remove();
    return {
      language: document.documentElement.lang,
      dark: document.body.classList.contains('dark-mode'),
      colorScheme: document.documentElement.style.colorScheme,
      spinnerColor,
      styles: Object.fromEntries([
      '--accent', '--background', '--background-alt', '--surface', '--surface-hover',
      '--border', '--border-strong', '--text', '--text-secondary', '--code-background', '--code-text',
      ].map(name => [name, getComputedStyle(document.body).getPropertyValue(name).trim()])),
    };
  });
  expect(appearance).toEqual({
    language: 'de-DE',
    dark: true,
    colorScheme: 'dark',
    spinnerColor: 'rgb(224, 82, 45)',
    styles: {
      '--accent': '#e0522d',
      '--background': '#101820',
      '--background-alt': '#17232d',
      '--surface': '#20313f',
      '--surface-hover': '#294252',
      '--border': '#486477',
      '--border-strong': '#6b899e',
      '--text': '#f2f6f8',
      '--text-secondary': '#b8c6ce',
      '--code-background': '#0b1217',
      '--code-text': '#d8e2e8',
    },
  });
});

test('rejects unsupported postMessage styles', async ({ page }) => {
  await mountEmbed(page, new URLSearchParams({ embed: '1', parentOrigin }));
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string }> }).embedMessages?.some(message => message.type === 'ready'));
  await page.locator('iframe').evaluate((element: HTMLIFrameElement) => {
    element.contentWindow?.postMessage({
      protocol: 'webexplorer', version: 1, type: 'configure', requestId: 'styles-invalid',
      styles: { backgroundImage: 'url(https://example.com/tracker)' },
    }, 'http://localhost:5173');
  });
  await page.waitForFunction(() => (window as typeof window & { embedMessages?: Array<{ type?: string; requestId?: string; ok?: boolean }> }).embedMessages?.some(message => message.type === 'configure-result' && message.requestId === 'styles-invalid' && message.ok === false));
});