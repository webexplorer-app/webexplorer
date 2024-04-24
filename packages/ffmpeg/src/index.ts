import createFFmpeg, { type FFmpegCoreModule } from "./ffmpeg";

export type { FFmpegCoreModule };

export function init(overrides?: Partial<FFmpegCoreModule>) {
    return createFFmpeg(overrides);
}
