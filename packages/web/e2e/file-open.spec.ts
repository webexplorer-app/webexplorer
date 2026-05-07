import { test, expect, Page } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

/**
 * Helper to open a file in the app by setting it on the file input inside the
 * file-picker shadow DOM, then triggering the change event.
 */
async function openFile(page: Page, fileName: string) {
  const filePath = path.join(fixturesDir, fileName);

  // The file input is inside: app-root > home-page > file-picker > input[type=file]
  // All use shadow DOM, so we use deep locators.
  const fileInput = page.locator('app-root')
    .locator('home-page')
    .locator('file-picker')
    .locator('input[type="file"]');

  await fileInput.setInputFiles(filePath);
}

/**
 * Helper to verify the app navigated to the viewer page and rendered a viewer.
 */
async function expectViewerLoaded(page: Page, viewerTag: string, timeout = 15000) {
  // After file selection, the app navigates to viewer-page which contains file-viewer
  const fileViewer = page.locator('app-root').locator('viewer-page').locator('file-viewer');
  await expect(fileViewer).toBeVisible({ timeout });

  // The specific viewer component should be rendered inside file-viewer's shadow DOM
  const viewer = fileViewer.locator(viewerTag);
  await expect(viewer).toBeVisible({ timeout });
}

test.describe('File Opening - Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens PDF file', async ({ page }) => {
    await openFile(page, 'test.pdf');
    await expectViewerLoaded(page, 'pdf-viewer');
  });

  test('opens DOCX file', async ({ page }) => {
    await openFile(page, 'test.docx');
    await expectViewerLoaded(page, 'word-viewer');
  });

  test('opens XLSX file', async ({ page }) => {
    await openFile(page, 'test.xlsx');
    await expectViewerLoaded(page, 'excel-viewer');
  });

  test('opens RTF file', async ({ page }) => {
    await openFile(page, 'test.rtf');
    await expectViewerLoaded(page, 'rtf-viewer');
  });
});

test.describe('File Opening - Ebooks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens EPUB file', async ({ page }) => {
    await openFile(page, 'test.epub');
    await expectViewerLoaded(page, 'epub-viewer');
  });
});

test.describe('File Opening - Media', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens PNG image', async ({ page }) => {
    await openFile(page, 'test.png');
    await expectViewerLoaded(page, 'image-viewer');
  });

  test('opens SVG image', async ({ page }) => {
    await openFile(page, 'test.svg');
    await expectViewerLoaded(page, 'image-viewer');
  });

  test('opens WAV audio', async ({ page }) => {
    await openFile(page, 'test.wav');
    await expectViewerLoaded(page, 'audio-viewer');
  });

  test('opens MP4 video', async ({ page }) => {
    await openFile(page, 'test.mp4');
    await expectViewerLoaded(page, 'video-viewer');
  });
});

test.describe('File Opening - Archives', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens ZIP archive', async ({ page }) => {
    await openFile(page, 'test.zip');
    await expectViewerLoaded(page, 'archive-viewer');
  });

  test('opens gzip file', async ({ page }) => {
    await openFile(page, 'test.gz');
    await expectViewerLoaded(page, 'archive-viewer');
  });
});

test.describe('File Opening - Code', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens JavaScript file', async ({ page }) => {
    await openFile(page, 'test.js');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens TypeScript/CSS file', async ({ page }) => {
    await openFile(page, 'test.css');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens HTML file', async ({ page }) => {
    await openFile(page, 'test.html');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens Python file', async ({ page }) => {
    await openFile(page, 'test.py');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens Rust file', async ({ page }) => {
    await openFile(page, 'test.rs');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens Go file', async ({ page }) => {
    await openFile(page, 'test.go');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens Java file', async ({ page }) => {
    await openFile(page, 'test.java');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens C file', async ({ page }) => {
    await openFile(page, 'test.c');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens PHP file', async ({ page }) => {
    await openFile(page, 'test.php');
    await expectViewerLoaded(page, 'code-viewer');
  });

  test('opens JSON file', async ({ page }) => {
    await openFile(page, 'test.json');
    await expectViewerLoaded(page, 'tree-viewer');
  });

  test('opens XML file', async ({ page }) => {
    await openFile(page, 'test.xml');
    await expectViewerLoaded(page, 'tree-viewer');
  });

  test('opens YAML file', async ({ page }) => {
    await openFile(page, 'test.yaml');
    await expectViewerLoaded(page, 'default-viewer');
  });

  test('opens SQL file', async ({ page }) => {
    await openFile(page, 'test.sql');
    await expectViewerLoaded(page, 'code-viewer');
  });
});

test.describe('File Opening - Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens CSV file', async ({ page }) => {
    await openFile(page, 'test.csv');
    await expectViewerLoaded(page, 'excel-viewer');
  });

  test('opens torrent file', async ({ page }) => {
    await openFile(page, 'test.torrent');
    await expectViewerLoaded(page, 'torrent-viewer');
  });

  test('opens GeoJSON file', async ({ page }) => {
    await openFile(page, 'test.geojson');
    await expectViewerLoaded(page, 'geojson-viewer');
  });

  test('opens SQLite database file', async ({ page }) => {
    await openFile(page, 'test.db');
    await expectViewerLoaded(page, 'sqlite-viewer');
  });
});

test.describe('File Opening - Diagrams', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens Mermaid file', async ({ page }) => {
    await openFile(page, 'test.mermaid');
    await expectViewerLoaded(page, 'mermaid-viewer');
  });

  test('opens Graphviz DOT file', async ({ page }) => {
    await openFile(page, 'test.dot');
    await expectViewerLoaded(page, 'graphviz-viewer');
  });

  test('opens Vega-Lite file', async ({ page }) => {
    await openFile(page, 'test.vg.json');
    await expectViewerLoaded(page, 'vega-viewer');
  });
});

test.describe('File Opening - Other Formats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('opens Markdown file', async ({ page }) => {
    await openFile(page, 'test.md');
    await expectViewerLoaded(page, 'markdown-viewer');
  });

  test('opens iCalendar file', async ({ page }) => {
    await openFile(page, 'test.ics');
    await expectViewerLoaded(page, 'ical-viewer');
  });

  test('opens subtitle SRT file', async ({ page }) => {
    await openFile(page, 'test.srt');
    await expectViewerLoaded(page, 'subtitle-viewer');
  });

  test('opens diff/patch file', async ({ page }) => {
    await openFile(page, 'test.diff');
    await expectViewerLoaded(page, 'diff-viewer');
  });

  test('opens log file', async ({ page }) => {
    await openFile(page, 'test.log');
    await expectViewerLoaded(page, 'log-viewer');
  });

  test('opens INI config file', async ({ page }) => {
    await openFile(page, 'test.ini');
    await expectViewerLoaded(page, 'config-viewer');
  });

  test('opens plain text file', async ({ page }) => {
    await openFile(page, 'test.txt');
    await expectViewerLoaded(page, 'code-viewer');
  });
});
