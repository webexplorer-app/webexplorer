import { init, unarchive, type ArchiveModule, type ArchiveEntry } from "@webexplorer/archive";
import wasmUrl from "@webexplorer/archive/libarchive.wasm?url";
import * as comlink from "comlink";

export class ArchiveWorker {
  module: ArchiveModule | undefined;
  filePtr: number | null = null;
  fileLength: number = 0;
  passphrase: string | null = null;
  fileName: string = "";

  async init() {
    if (this.module) {
      return;
    }

    this.module = await init({
      locateFile: () => {
        return wasmUrl;
      },
    });
  }

  getModule(): ArchiveModule {
    if (!this.module) {
      throw new Error("module is not initialized yet");
    }

    return this.module;
  }

  async open(file: File, passphrase: string | null) {
    if (this.filePtr) {
      this.close();
    }

    this.fileName = file.name;

    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
    const array = new Int8Array(buffer);

    const module = this.getModule();

    const filePtr = module.malloc(array.length);
    module.module.HEAP8.set(array, filePtr);

    this.filePtr = filePtr;
    this.fileLength = array.length;
    this.passphrase = passphrase;
  }

  async close() {
    if (this.filePtr) {
      const module = this.getModule();

      module.free(this.filePtr);
      this.filePtr = null;
    }
  }

  entries(): Promise<ArchiveEntry[]> {
    if (!this.filePtr || !this.fileLength) {
      throw new Error("invalid file");
    }

    const module = this.getModule();
    const entries = unarchive(
      module,
      this.filePtr,
      this.fileLength,
      this.passphrase,
    );

    return entries.then((result) => {
      if (result.length > 0) {
        return result;
      }
      return this.decompressRaw();
    });
  }

  private async decompressRaw(): Promise<ArchiveEntry[]> {
    if (!this.filePtr || !this.fileLength) {
      return [];
    }

    const module = this.getModule();
    const compressed = module.module.HEAP8.slice(
      this.filePtr,
      this.filePtr + this.fileLength,
    );

    const format = this.detectCompression(compressed);
    if (!format) {
      return [];
    }

    try {
      const stream = new DecompressionStream(format);
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength));
      writer.close();

      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
      const data = new Int8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        data.set(new Int8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), offset);
        offset += chunk.length;
      }

      const name = this.getDecompressedName(compressed);
      return [
        {
          name,
          size: BigInt(totalLength),
          path: name,
          type: 32768,
          data,
        },
      ];
    } catch {
      return [];
    }
  }

  private detectCompression(data: Int8Array): CompressionFormat | null {
    if (data.length < 2) return null;
    const b0 = data[0] & 0xff;
    const b1 = data[1] & 0xff;
    // gzip magic: 0x1f 0x8b
    if (b0 === 0x1f && b1 === 0x8b) {
      return "gzip";
    }
    // deflate (zlib header): 0x78 followed by 0x01/0x5e/0x9c/0xda
    if (b0 === 0x78 && (b1 === 0x01 || b1 === 0x5e || b1 === 0x9c || b1 === 0xda)) {
      return "deflate";
    }
    return null;
  }

  private getDecompressedName(data: Int8Array): string {
    const b0 = data[0] & 0xff;
    const b1 = data[1] & 0xff;
    // Parse gzip header to extract original filename (FNAME field)
    if (b0 === 0x1f && b1 === 0x8b && data.length > 10) {
      const flags = data[3] & 0xff;
      const hasFNAME = (flags & 0x08) !== 0;
      if (hasFNAME) {
        let offset = 10;
        // Skip FEXTRA if present
        if ((flags & 0x04) !== 0 && data.length > offset + 2) {
          const extraLen = (data[offset] & 0xff) | ((data[offset + 1] & 0xff) << 8);
          offset += 2 + extraLen;
        }
        // Read null-terminated FNAME
        const nameBytes: number[] = [];
        while (offset < data.length && data[offset] !== 0) {
          nameBytes.push(data[offset] & 0xff);
          offset++;
        }
        if (nameBytes.length > 0) {
          return new TextDecoder().decode(new Uint8Array(nameBytes));
        }
      }
    }
    // Fallback: strip extension
    const name = this.fileName;
    if (name.endsWith(".gz")) return name.slice(0, -3) || "data";
    if (name.endsWith(".tgz")) return name.slice(0, -4) + ".tar";
    if (name.endsWith(".z")) return name.slice(0, -2) || "data";
    return "data";
  }
}

export const worker = new ArchiveWorker();

comlink.expose(worker);
