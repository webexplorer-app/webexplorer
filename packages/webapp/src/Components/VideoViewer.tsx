import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  videoViewer: {
    "& video": {
      width: "100%",
    },
  },
});

export interface VideoViewerProps {
  file: File;
}

export function VideoViewer(props: VideoViewerProps) {
  const { file } = props;
  const styles = useStyles();

  return (
    <div className={styles.videoViewer}>
      <video controls src={URL.createObjectURL(file)} />
    </div>
  );
}

export default VideoViewer;
