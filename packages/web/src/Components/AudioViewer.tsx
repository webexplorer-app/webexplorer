import "./AudioViewer.css";

export interface AudioViewerProps {
  file: File;
}

export function AudioViewer(props: AudioViewerProps) {
  const { file } = props;

  return (
    <div className="audio__viewer">
      <audio controls src={URL.createObjectURL(file)} />
    </div>
  );
}

export default AudioViewer;
