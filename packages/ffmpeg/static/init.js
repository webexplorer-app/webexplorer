import * as Comlink from "comlink";

export async function init(process) {
    const elm = document.getElementById('uploader');
    elm.addEventListener('change', (evt) => {
        const worker = new Worker(new URL("./worker.js", import.meta.url), {
            type: 'module'
        });
        const ffmpeg = Comlink.wrap(worker);

        process(evt, ffmpeg);
    });
}
