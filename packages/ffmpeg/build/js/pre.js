/**
 * Constants
 */

const SIZE_I32 = 4;
const FFMPEG_DEFAULT_ARGS = ["./ffmpeg", "-nostdin", "-y"];
const FFPROBE_DEFAULT_ARGS = ["./ffprobe"];

function stringToPtr(str) {
    const len = Module["lengthBytesUTF8"](str) + 1;
    const ptr = Module["_malloc"](len);
    Module["stringToUTF8"](str, ptr, len);

    return ptr;
}

function stringsToPtr(strs) {
    const len = strs.length;
    const ptr = Module["_malloc"](len * SIZE_I32);
    for (let i = 0; i < len; i++) {
        Module["setValue"](ptr + SIZE_I32 * i, stringToPtr(strs[i]), "i32");
    }

    return ptr;
}
function ffmpeg(..._args) {
    const args = [...FFMPEG_DEFAULT_ARGS, ..._args];
    try {
        return Module["_ffmpeg"](args.length, stringsToPtr(args));
    } catch (e) {
        if (!e.message.startsWith("Aborted")) {
            throw e;
        }
        return 1;
    }
}

function ffprobe(..._args) {
    try {
        const args = [...FFPROBE_DEFAULT_ARGS, ..._args];
        return Module["_ffprobe"](args.length, stringsToPtr(args));
    } catch (e) {
        if (!e.message.startsWith("Aborted")) {
            throw e;
        }
        return 1;
    }
}

Module["ffmpeg"] = ffmpeg;
Module["ffprobe"] = ffprobe;