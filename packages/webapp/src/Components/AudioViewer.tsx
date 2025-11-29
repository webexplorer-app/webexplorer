export interface AudioViewerProps {
  file: File;
}

export function AudioViewer(props: AudioViewerProps) {
  const { file } = props;

  return (
    <div style={{ padding: '1rem' }}>
      <audio controls src={URL.createObjectURL(file)} style={{ width: '100%' }} />
    </div>
  );
}

export default AudioViewer;
