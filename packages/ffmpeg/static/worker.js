import * as Comlink from "comlink";

import createFFmpeg from '../src/ffmpeg.js';
import wasm from 'url:../src/ffmpeg.wasm';

export class FFmpeg {
    async init() {
        if (this.wasmModule) {
            return;
        }

        console.log('init module')
        this.wasmModule = await createFFmpeg({
            locateFile: () => {
                console.log('locate file: ', wasm, arguments);
                return wasm;
            }
        });
        console.log('init module succeed')
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