import { useEffect, useState } from "react";

export interface TextViewerProps {
  file: File;
}

export function TextViewer(props: TextViewerProps) {
  const { file } = props;
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
    <div style={{ padding: '0 1rem', wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
      <p>{text}</p>
    </div>
  );
}
