import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  audioViewer: {
    padding: "1rem",
    "& audio": {
      width: "100%",
    },
  },
});

export interface AudioViewerProps {
  file: File;
}

export function AudioViewer(props: AudioViewerProps) {
  const { file } = props;
  const styles = useStyles();

  return (
    <div className={styles.audioViewer}>
      <audio controls src={URL.createObjectURL(file)} />
    </div>
  );
}

export default AudioViewer;
