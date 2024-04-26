import { PdfiumEngineRunner } from '@unionpdf/engines';
import pdfiumWasm from "@unionpdf/engines/wasm/pdfium.wasm?url"

async function init() {
  const response = await fetch(pdfiumWasm);
  const wasmBinary = await response.arrayBuffer();
  const runner = new PdfiumEngineRunner(wasmBinary);
  runner.prepare();
}

init();
