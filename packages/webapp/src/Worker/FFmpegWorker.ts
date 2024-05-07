import { init, FFmpegCoreModule } from '@webexplorer/ffmpeg';
import wasmUrl from "@webexplorer/ffmpeg/ffmpeg.wasm?url";
import * as Comlink from "comlink";

export class FFmpegWorker {
  wasmModule: FFmpegCoreModule | undefined;

  async init() {
    if (this.wasmModule) {
      return;
    }

    const wasmModule = await init({
      locateFile: () => {
        return wasmUrl;
      },
    });

    this.wasmModule = wasmModule;
  }

  async writeFile(...args: any[]) {
    await this.init();
    const result = this.wasmModule!.FS.writeFile(...args);
    return result;
  }

  async readFile(...args: any[]) {
    await this.init();
    return this.wasmModule!.FS.readFile(...args);
  }

  async ffmpeg(...args: any[]) {
    await this.init();
    return this.wasmModule!.ffmpeg(...args);
  }

  async ffprobe(...args: any[]) {
    await this.init();
    return this.wasmModule!.ffprobe(...args);
  }
}

const ffmpeg = new FFmpegWorker();

Comlink.expose(ffmpeg);