import * as Comlink from "/node_modules/comlink/dist/esm/comlink.js";

import createFFmpeg from '/src/esm/ffmpeg.js';

export class FFmpeg {
    async init() {
        if (this.wasmModule) {
            return;
        }

        this.wasmModule = await createFFmpeg();
        this.wasmModule.setLogger(data => {
            console.log(data.message);
        });
    }

    async writeFile(...args) {
        await this.init();
        return this.wasmModule.FS.writeFile(...args);
    }

    async readFile(...args) {
        await this.init();
        return this.wasmModule.FS.readFile(...args);
    }

    async ffmpeg(...args) {
        await this.init();
        return this.wasmModule.ffmpeg(...args);
    }

    async ffprobe(...args) {
        await this.init();
        return this.wasmModule.ffprobe(...args);
    }
}

const ffmpeg = new FFmpeg();

Comlink.expose(ffmpeg);