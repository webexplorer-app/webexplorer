import * as comlink from 'comlink';
import { type ArchiveWorker } from '../worker/ArchiveWorker';

let workerInstance: comlink.Remote<ArchiveWorker> | null = null;

export function getArchiveWorker(): comlink.Remote<ArchiveWorker> {
  if (!workerInstance) {
    const worker = new Worker(
      new URL('../worker/ArchiveWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerInstance = comlink.wrap<ArchiveWorker>(worker);
  }
  return workerInstance;
}

export function createArchiveWorker(): comlink.Remote<ArchiveWorker> {
  const worker = new Worker(
    new URL('../worker/ArchiveWorker.ts', import.meta.url),
    { type: 'module' }
  );
  return comlink.wrap<ArchiveWorker>(worker);
}
