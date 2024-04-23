import { useState } from "react";
import * as comlink from "comlink";
import { FFmpegWorker } from "../Worker/FFmpegWorker";

export function useFFmpegWorker() {
  const [worker] = useState(() => {
    const worker = new Worker(
      new URL("../Worker/FFmpegWorker.ts", import.meta.url)
    );
    return comlink.wrap<FFmpegWorker>(worker);
  });

  return worker;
}
