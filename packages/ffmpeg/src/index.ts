import createFFmpeg, { type FFmpegCoreModule } from "./ffmpeg";

export type { FFmpegCoreModule };

export async function init(overrides?: Partial<FFmpegCoreModule>) {
    return await createFFmpeg(overrides);
}
