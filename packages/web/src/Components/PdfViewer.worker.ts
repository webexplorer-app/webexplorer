import { handler, PdfiumEngineRunner } from '@unionpdf/engines';
import { pdfiumWasm } from '@unionpdf/engines';

async function init() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  const runner = new PdfiumEngineRunner(wasmBinary);
  /* eslint-disable-next-line no-restricted-globals */
  self.onmessage = handler(runner);
}

init();
