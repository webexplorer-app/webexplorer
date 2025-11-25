import { useEffect, useState } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  textViewer: {
    padding: "0 1rem",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
});

export interface TextViewerProps {
  file: File;
}

export function TextViewer(props: TextViewerProps) {
  const { file } = props;
  const styles = useStyles();
  const [text, setText] = useState("");

  useEffect(() => {
    function init() {
      const reader = new FileReader();
      reader.onload = () => {
        setText(reader.result as string);
      };

      reader.readAsText(file);
    }

    init();
  }, [file]);

  return (
    <div className={styles.textViewer}>
      <p>{text}</p>
    </div>
  );
}
