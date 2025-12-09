import { useEffect, useRef, useState } from "react";
import { type Mobi, parse } from "@webexplorer/mobi";
import "./MobiViewer.css";

export type MobiViewerProps = {
  file: File;
};

export function MobiViewer(props: MobiViewerProps) {
  const { file } = props;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [mobi, setMobi] = useState<Mobi | null>(null);

  useEffect(() => {
    async function render() {
      const reader = new FileReader();
      reader.onload = () => {
        const result = parse(reader.result as ArrayBuffer);
        setMobi(result);

        if (iframeRef.current) {
          const iframe = iframeRef.current;
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(result.text);
            iframeDoc.close();
          }
        }
      };

      reader.readAsArrayBuffer(file);
    }

    render();
  }, [file]);

  if (!mobi) {
    return null;
  }

  return (
    <div className="mobi-viewer">
      <iframe
        ref={iframeRef}
        className="mobi-iframe"
        title="Mobi Document"
      />
    </div>
  );
}

export default MobiViewer;
