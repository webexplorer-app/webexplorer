import * as Comlink from "comlink";

import createFFmpeg, { FFmpegCoreModule } from 'ffmpeg-webassembly';

export class FFmpegWorker {
    wasmModule: FFmpegCoreModule | undefined;

    async init() {
        if (this.wasmModule) {
            return;
        }

        const wasmModule = await createFFmpeg({
            locateFile: (...args: any[]) => {
                console.log(args);
            }
        });

        wasmModule.setLogger((data: any) => {
            console.log(data.message);
        });

        this.wasmModule = wasmModule;
    }

    async writeFile(...args: any[]) {
        await this.init();
        return this.wasmModule!.FS.writeFile(...args);
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