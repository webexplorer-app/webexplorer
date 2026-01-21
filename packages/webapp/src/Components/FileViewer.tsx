import React, { Suspense } from "react";
import { mimeType } from "../Utils/file";
import { Loading } from "./Loading";
import { useDocumentTitle } from "./DocumentTitle";

const TabViewer = React.lazy(() => import("./TabViewer"));
const PdfViewer = React.lazy(() => import("./PdfViewer"));
const ArchiveViewer = React.lazy(() => import("./ArchiveViewer"));
const ThreeViewer = React.lazy(() => import("./ThreeViewer"));
const EmailViewer = React.lazy(() => import("./EmailViewer"));
const EPubViewer = React.lazy(() => import("./EPubViewer"));
const MobiViewer = React.lazy(() => import("./MobiViewer"));
const TorrentViewer = React.lazy(() => import("./TorrentViewer"));
const AudioViewer = React.lazy(() => import("./AudioViewer"));
const VideoViewer = React.lazy(() => import("./VideoViewer"));
const ImageViewer = React.lazy(() => import("./ImageViewer"));
const CSVViewer = React.lazy(() => import("./CSVViewer"));
const WasmViewer = React.lazy(() => import("./WasmViewer"));
const FFmpegViewer = React.lazy(() => import("./FFmpegViewer"));
const DefaultViewer = React.lazy(() => import("./DefaultViewer"));

export interface FileViewerProps {
  file: File;
}

export function FileViewer(props: FileViewerProps) {
  const { file } = props;
  let viewer = null;

  const fileType = mimeType(file);
  switch (fileType) {
    case "application/pdf":
      viewer = <PdfViewer file={file} />;
      break;
    case "application/epub+zip":
      viewer = <EPubViewer file={file} />;
      break;
    case "application/x-azw3":
    case "application/x-mobipocket-ebook":
      viewer = <MobiViewer file={file} />;
      break;
    case "application/zip":
    case "application/x-tar":
    case "application/x-compressed":
    case "application/vnd.rar":
    case "application/x-zip-compressed":
    case "application/x-gzip":
      viewer = <ArchiveViewer file={file} />;
      break;
    case "model/stl":
      viewer = <ThreeViewer file={file} format="stl" />;
      break;
    case "model/gltf-binary":
    case "model/gltf+json":
      viewer = <ThreeViewer file={file} format="gltf" />;
      break;
    case "model/obj":
      viewer = <ThreeViewer file={file} format="obj" />;
      break;
    case "model/3mf":
      viewer = <ThreeViewer file={file} format="3mf" />;
      break;
    case "application/x-gtp":
      viewer = <TabViewer file={file} />;
      break;
    case "application/x-bittorrent":
      viewer = <TorrentViewer file={file} />;
      break;
    case "video/mp4":
    case "video/webm":
    case "video/ogg":
    case "video/mov":
    case "video/quicktime":
      viewer = <VideoViewer file={file} />;
      break;
    case "audio/mpeg":
    case "audio/flac":
    case "audio/aac":
    case "audio/ogg":
    case "audio/wav":
    case "audio/mp3":
      viewer = <AudioViewer file={file} />;
      break;
    case "image/png":
    case "image/jpeg":
    case "image/jpg":
    case "image/webp":
    case "image/apng":
    case "image/bmp":
    case "image/.avif":
    case "image/svg+xml":
    case "image/x-icon":
    case "image/tiff":
      viewer = <ImageViewer file={file} />;
      break;
    case "text/csv":
      viewer = <CSVViewer file={file} />;
      break;
    case "application/vnd.ms-outlook":
      viewer = <EmailViewer file={file} />;
      break;
    case "application/wasm":
      viewer = <WasmViewer file={file} />;
      break;
    default:
      if (fileType?.startsWith('video/')) {
        viewer = <FFmpegViewer file={file} />
      } else {
        viewer = <DefaultViewer file={file} />;
      }
  }

  useDocumentTitle({ title: file.name });

  return (
    <div>
      <Suspense fallback={<Loading />}>{viewer}</Suspense>
    </div>
  );
}
