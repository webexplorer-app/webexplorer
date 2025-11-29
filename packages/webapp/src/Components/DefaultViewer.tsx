import { Localized } from "@fluent/react";
import { type ReactNode, useState } from "react";
import { BinaryViewer } from "./BinaryViewer";
import { TextViewer } from "./TextViewer";

export interface DefaultViewerProps {
  file: File;
}

export type FallbackViewer = "BinaryViewer" | "TextViewer";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function DefaultViewer(props: DefaultViewerProps) {
  const { file } = props;
  const [fallbackViewer, setFallbackViewer] =
    useState<FallbackViewer>("TextViewer");

  let viewer: ReactNode | null = null;
  if (file.size > MAX_FILE_SIZE) {
    viewer = (
      <div>
        <p className="text__center">
          <Localized id="file-is-too-large">File is too large</Localized>
        </p>
        <p className="text__center">{file.type}</p>
      </div>
    );
  } else {
    switch (fallbackViewer) {
      case "BinaryViewer":
        viewer = <BinaryViewer file={file} />;
        break;
      case "TextViewer":
        viewer = <TextViewer file={file} />;
        break;
    }
  }

  return (
    <div>
      <header style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', padding: '1rem' }}>
        <h4 style={{ flex: '1', margin: '0', padding: '0' }}>
          <Localized id="default-viewer">Default Viewer</Localized>
        </h4>
        <select
          value={fallbackViewer}
          onChange={(evt) => {
            setFallbackViewer(evt.target.value as FallbackViewer);
          }}
          style={{ display: 'inline-block', marginRight: '1rem', padding: '0.5rem' }}
        >
          <Localized id="text">
            <option value="TextViewer">Text</option>
          </Localized>
          <Localized id="binary">
            <option value="BinaryViewer">Binary</option>
          </Localized>
        </select>
      </header>
      <section>{viewer}</section>
    </div>
  );
}

export default DefaultViewer;
