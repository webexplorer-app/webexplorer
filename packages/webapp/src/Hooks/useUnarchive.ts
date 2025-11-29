import { useState, useEffect } from "react";
import * as comlink from "comlink";
import { ArchiveWorker } from "../Worker/ArchiveWorker";
import type { ArchiveEntry } from "../../../archive/dist/esm";

export function useUnarchive(
  worker: comlink.Remote<ArchiveWorker>,
  file: File,
  passphrase: string,
) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);

  useEffect(() => {
    async function unarchive() {
      await worker.init();
      await worker.open(file, passphrase);
      const entries = await worker.entries();
      setEntries(entries);
    }

    unarchive();
  }, [worker, file, passphrase]);

  return [entries];
}
