import { useMemo } from "react";
import * as comlink from "comlink";
import { type FFmpegWorker } from "../Worker/FFmpegWorker";

export function useFFmpegWorker() {
  const worker = useMemo(() => {
    const worker = new Worker(
      new URL("url:../Worker/FFmpegWorker.ts", import.meta.url),
      { type: 'module' }
    );
    return comlink.wrap<FFmpegWorker>(worker);
  }, []);

  return worker;
}
