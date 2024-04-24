import "./FFmpegViewer.css";
import { useFFmpegWorker } from "../Hooks/useFFmpegWorker";
import { useEffect, useRef, useState } from "react";
import { readFile } from '../Utils/file';
import { Localized } from "@fluent/react";

export interface FFmpegViewerProps {
    file: File;
}

export function FFmpegViewer(props: FFmpegViewerProps) {
    const { file } = props;

    const videoElementRef = useRef<HTMLVideoElement>(null);
    const worker = useFFmpegWorker();
    const [isTranscoding, setIsTranscoding] = useState(true);

    useEffect(() => {
        let isAbort = false;
        async function transcode() {
            setIsTranscoding(true);
            const buffer = await readFile(file);
            if (isAbort) {
                return;
            }

            await worker.writeFile(file.name, buffer);
            if (isAbort) {
                return;
            }

            await worker.ffmpeg('-i', file.name, `${file.name}.webm`);
            if (isAbort) {
                return;
            }

            const data = await worker.readFile(`${file.name}.webm`, buffer);
            if (isAbort) {
                return;
            }

            const videoElement = videoElementRef.current;
            if (videoElement) {
                videoElement.src = URL.createObjectURL(new Blob([data.buffer], { type: 'video/webm' }));
            }
            setIsTranscoding(false);
        }

        transcode();

        return () => {
            isAbort = true;
        }
    }, [worker, file, setIsTranscoding]);

    return (
        <div className="ffmpeg__viewer">
            {isTranscoding ? <p><Localized id="transcoding">Transcoding</Localized></p> : null}
            <video ref={videoElementRef} controls></video>
        </div>
    );
}

export default FFmpegViewer;
