import { useEffect, useState } from "react";
import { makeStyles } from "@fluentui/react-components";

const useStyles = makeStyles({
  binaryViewer: {
    padding: "0 1rem",
    display: "grid",
    gridTemplateColumns: "repeat(10, 1fr)",
    "& div": {
      textAlign: "center",
    },
  },
});

export interface BinaryViewerProps {
  file: File;
}

export function BinaryViewer(props: BinaryViewerProps) {
  const { file } = props;
  const styles = useStyles();
  const [bytes, setBytes] = useState<number[]>([]);

  useEffect(() => {
    function init() {
      const reader = new FileReader();
      reader.onload = () => {
        const buffer = reader.result as ArrayBuffer;
        const view = new DataView(buffer);
        const length = view.byteLength;
        const bytes: number[] = [];
        for (let j = 0; j < length; j++) {
          const byte = view.getInt8(j);
          bytes.push(byte);
        }

        setBytes(bytes);
      };

      reader.readAsArrayBuffer(file);
    }

    init();
  }, [file, setBytes]);

  return (
    <div className={styles.binaryViewer}>
      {bytes.map((byte, index) => {
        return (
          <div key={index}>
            <span>0x{byte.toString(16).toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}
