export interface VideoViewerProps {
  file: File;
}

export function VideoViewer(props: VideoViewerProps) {
  const { file } = props;

  return (
    <div>
      <video controls src={URL.createObjectURL(file)} style={{ width: '100%' }} />
    </div>
  );
}

export default VideoViewer;
