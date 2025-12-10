import { FS, EmscripenModule, EmscriptenModuleFactory } from '@types/emscripten';

/**
 * Arguments passed to setLogger callback function.
 */
export interface Log {
    /** file descriptor of the log, must be `stdout` or `stderr` */
    type: string;
    message: string;
}

/**
 * Arguments passed to setProgress callback function.
 */
export interface Progress {
    /** progress of the operation, interval = [0, 1] */
    progress: number;
    /** time of transcoded media in microseconds, ex: if a video is 10 seconds long, when time is 1000000 means 1 second of the video is transcoded already. */
    time: number;
}

/**
 * FFmpeg core module, an object to interact with ffmpeg.
 */
export interface FFmpegCoreModule extends EmscriptenModule {
    /** return code of the ffmpeg exec, error when ret != 0 */
    ret: number;
    timeout: number;

    ffmpeg: (...args: string[]) => number;
    ffprobe: (...args: string[]) => number;
    reset: () => void;
    setLogger: (logger: (log: Log) => void) => void;
    setTimeout: (timeout: number) => void;
    setProgress: (handler: (progress: Progress) => void) => void;

    FS: FS;
}

/**
 * Factory of FFmpegCoreModule.
 */
export type FFmpegCoreModuleFactory = EmscriptenModuleFactory<FFmpegCoreModule>;

const createFFmpeg: FFmpegCoreModuleFactory;

export default createFFmpeg;
