import { useState } from "react";
import * as comlink from "comlink";
import { type ArchiveWorker } from "../Worker/ArchiveWorker";

export function useArchiveWorker() {
  const [worker] = useState(() => {
    const worker = new Worker(
      new URL("../Worker/ArchiveWorker.ts", import.meta.url),
      { type: 'module' }
    );
    return comlink.wrap<ArchiveWorker>(worker);
  });

  return worker;
}
