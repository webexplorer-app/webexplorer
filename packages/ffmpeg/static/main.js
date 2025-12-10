const init = import('./init');

async function readFile(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            const { result } = fileReader;
            if (result instanceof ArrayBuffer) {
                resolve(new Uint8Array(result));
            } else {
                resolve(new Uint8Array());
            }
        };
        fileReader.onerror = (event) => {
            reject(
                Error(
                    `File could not be read! Code=${event?.target?.error?.code || -1}`
                )
            );
        };
        fileReader.readAsArrayBuffer(file);
    });
}

async function transcode(ffmpeg, name) {
    try {
        console.log('transcode start')
        await ffmpeg.ffmpeg('-i', name, 'output.mp4');
        console.log('transcode stop')
        const data = await ffmpeg.readFile('output.mp4');
        console.log('play')
        const video = document.getElementById('player');
        video.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' }));
    } catch (e) {
        console.log('transcode abort')
        console.log(e);
    }
}

async function probe(ffmpeg, name) {
    await ffmpeg.ffprobe('-output_format', 'json', '-show_streams', '-o', `${name}.probe`, `-i`, `${name}`);
    const output = await ffmpeg.readFile(`${name}.probe`);
    var str = new TextDecoder().decode(output);
    var elem = document.getElementById('probe');
    elem.innerText = str;
}

async function process(evt, ffmpeg) {
    const files = evt.target.files;
    if (files[0]) {
        const file = files[0];
        const content = await readFile(file);
        const { name } = file;

        await ffmpeg.writeFile(name, content);

        await probe(ffmpeg, name);

        await transcode(ffmpeg, name);
    }
}

init.then(module => {
    module.init(process);
});
