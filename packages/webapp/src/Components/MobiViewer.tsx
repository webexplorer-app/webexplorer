import { useEffect, useRef, useState } from "react";
import { type Mobi, parse } from "@webexplorer/mobi";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  mobiViewer: {
    margin: "1rem",
    "& iframe": {
      width: "100%",
      height: "calc(100vh - 6rem)",
    },
  },
});

export type MobiViewerProps = {
  file: File;
};

export function MobiViewer(props: MobiViewerProps) {
  const { file } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mobi, setMobi] = useState<Mobi | null>(null);

  useEffect(() => {
    async function render() {
      const reader = new FileReader();
      reader.onload = () => {
        const result = parse(reader.result as ArrayBuffer);
        setMobi(result);

        if (containerRef.current) {
          const container = containerRef.current;
          const parser = new DOMParser();
          const doc = parser.parseFromString(result.text, "text/html");
          doc.body.childNodes.forEach((node) => {
            if (node instanceof Element) {
              container.appendChild(node);
            }
          });
        }
      };

      reader.readAsArrayBuffer(file);
    }

    render();
  }, [file, setMobi]);

  const styles = useStyles();

  if (!mobi) {
    return null;
  }

  return (
    <div className={styles.mobiViewer}>
      <div ref={containerRef}></div>
    </div>
  );
}

export default MobiViewer;
