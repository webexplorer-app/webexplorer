import { expect, test } from '@playwright/test';

test('previews a Jupyter notebook without executing its outputs', async ({ page }) => {
  await page.goto('/');

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: { kernelspec: { display_name: 'Python 3', language: 'python' } },
    cells: [
      { cell_type: 'markdown', metadata: {}, source: ['# Notebook title\n', 'Markdown text'] },
      {
        cell_type: 'code', execution_count: 7, metadata: {}, source: ['print("hello")'],
        outputs: [
          { output_type: 'stream', name: 'stdout', text: ['hello\n'] },
          { output_type: 'display_data', data: { 'image/png': 'iVBORw0KGgo=' }, metadata: {} },
          { output_type: 'display_data', data: { 'text/html': '<script>parent.notebookOutputExecuted=true</script><b>HTML output</b>' }, metadata: {} },
        ],
      },
    ],
  };

  const fileInput = page.locator('app-root')
    .locator('home-page')
    .locator('file-picker')
    .locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: 'analysis.ipynb',
    mimeType: 'application/x-ipynb+json',
    buffer: Buffer.from(JSON.stringify(notebook)),
  });

  const viewer = page.locator('app-root')
    .locator('viewer-page')
    .locator('file-viewer')
    .locator('notebook-viewer');
  await expect(viewer).toBeVisible();
  await expect(viewer.getByText('Python 3')).toBeVisible();
  await expect(viewer.getByText('# Notebook title')).toBeVisible();
  await expect(viewer.getByText('print("hello")')).toBeVisible();
  await expect(viewer.getByText('hello', { exact: true })).toBeVisible();
  await expect(viewer.locator('img[alt="Notebook output"]')).toHaveCount(1);
  await expect(viewer.locator('iframe[title="Notebook HTML output"]')).toHaveAttribute('sandbox', '');
  await expect.poll(() => page.evaluate(() => (window as Window & { notebookOutputExecuted?: boolean }).notebookOutputExecuted)).toBeUndefined();
});