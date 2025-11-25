import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  imageViewer: {
    padding: "1rem 0",
    textAlign: "center",
    "& img": {
      maxWidth: "100%",
    },
  },
});

export interface ImageViewerProps {
  file: File;
}

export function ImageViewer(props: ImageViewerProps) {
  const { file } = props;
  const styles = useStyles();

  return (
    <div className={styles.imageViewer}>
      <img alt={file.name} src={URL.createObjectURL(file)} />
    </div>
  );
}

export default ImageViewer;
