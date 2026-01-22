import * as comlink from 'comlink';
import { type FFmpegWorker } from '../worker/FFmpegWorker';

let workerInstance: comlink.Remote<FFmpegWorker> | null = null;

export function getFFmpegWorker(): comlink.Remote<FFmpegWorker> {
  if (!workerInstance) {
    const worker = new Worker(
      new URL('../../Worker/FFmpegWorker.ts', import.meta.url),
      { type: 'module' }
    );
    workerInstance = comlink.wrap<FFmpegWorker>(worker);
  }
  return workerInstance;
}

export function createFFmpegWorker(): comlink.Remote<FFmpegWorker> {
  const worker = new Worker(
    new URL('../../Worker/FFmpegWorker.ts', import.meta.url),
    { type: 'module' }
  );
  return comlink.wrap<FFmpegWorker>(worker);
}
