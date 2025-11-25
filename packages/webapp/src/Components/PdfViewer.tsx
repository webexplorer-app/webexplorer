import { useEffect, useRef, useState } from "react";
import { makeStyles } from "@fluentui/react-components";
import { NoopLogger } from "@unionpdf/models";

const useStyles = makeStyles({
  pdfViewer: {
    position: "relative",
    padding: "2px 1rem",
  },
  pdfPanelMountPoint: {
    position: "absolute",
    top: "48px",
    left: "0",
    zIndex: "999",
  },
  pdfViewerPages: {
    display: "flex",
    alignItems: "center",
    flexDirection: "column",
  },
  pdfPage: {
    display: "block",
    margin: "2px 0",
    border: "1px solid #ccc",
  },
  formPassword: {
    maxWidth: "100%",
    width: "20rem",
  },
  formField: {
    margin: "0 0 1rem 0",
  },
  formFieldLabel: {
    display: "inline-block",
    padding: "0.5rem",
  },
  formFieldInput: {
    padding: "0.5rem",
  },
  formFieldButton: {
    padding: "0.5rem",
  },
  formSubmit: {
    margin: "2rem 0 0 0",
  },
});
import { WebWorkerEngine } from "@unionpdf/engines";
import {
  PdfEngineContextProvider,
  PdfDocument,
  PdfNavigatorContextProvider,
  PdfPages,
  LoggerContextProvider,
  PdfApplication,
  PdfApplicationContextProvider,
  PdfAttachments,
  PdfBookmarks,
  PdfDownloader,
  PdfEditorContextProvider,
  PdfMetadata,
  PdfNativeAdapterProvider,
  PdfPageAnnotationComponentContextProvider,
  PdfPageAnnotationsLayer,
  PdfPageCanvasLayer,
  PdfPageDefaultAnnotation,
  PdfPageEditorLayer,
  PdfPageTextLayer,
  PdfPrinter,
  PdfSearch,
  PdfSignatures,
  PdfThumbnails,
  PdfToolbar,
  PrinterMethod,
  ThemeContextProvider,
  StoragePdfApplicationConfigurationProvider,
  PdfEditor,
  PanelMountPointContextProvider,
} from "@unionpdf/react";

export interface PdfViewerProps {
  file: File;
}

export function PdfViewer(props: PdfViewerProps) {
  const styles = useStyles();
  const [provider] = useState(() => {
    return new StoragePdfApplicationConfigurationProvider(
      localStorage,
      "pdfviewer.configuration"
    );
  });
  const panelMountPointElemRef = useRef<HTMLDivElement>(null);

  const [engine] = useState(() => {
    const worker = new Worker(new URL("../Worker/PdfWorker.ts", import.meta.url), {
      type: "module",
    });
    const engine = new WebWorkerEngine(worker);
    engine.initialize();

    return engine;
  });
  const [file, setFile] = useState<{
    id: string;
    name: string;
    content: ArrayBuffer;
  } | null>(null);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      setFile({
        id: props.file.name,
        name: props.file.name,
        content: result,
      });
    };

    reader.readAsArrayBuffer(props.file);

    return () => {
      reader.abort();
    };
  }, [props.file, engine]);

  return (
    <div className={styles.pdfViewer}>
      <div
        className={styles.pdfPanelMountPoint}
        ref={panelMountPointElemRef}
      />
      {file ? (<PanelMountPointContextProvider
        domElem={panelMountPointElemRef.current}
      >
        <PdfNativeAdapterProvider>
          <LoggerContextProvider logger={new NoopLogger()}>
            <ThemeContextProvider
              theme={{
                background: "blue",
              }}
            >
              <PdfApplicationContextProvider provider={provider}>
                <PdfEngineContextProvider engine={engine}>
                  <PdfApplication>
                    <PdfNavigatorContextProvider>
                      <PdfDocument
                        file={file}
                        password=""
                        onOpenSuccess={() => { }}
                        onOpenFailure={() => { }}
                      >
                        <PdfEditorContextProvider>
                          <PdfToolbar />
                          <PdfPageAnnotationComponentContextProvider
                            component={PdfPageDefaultAnnotation}
                          >
                            <PdfPages
                              prerenderRange={[-1, 1]}
                              cacheRange={[-1, 1]}
                              pageLayers={[
                                PdfPageCanvasLayer,
                                PdfPageTextLayer,
                                PdfPageAnnotationsLayer,
                                PdfPageEditorLayer,
                              ]}
                            />
                          </PdfPageAnnotationComponentContextProvider>
                          <PdfMetadata />
                          <PdfThumbnails
                            layout={{
                              direction: "vertical",
                              itemsCount: 2,
                            }}
                            size={{ width: 100, height: 100 }}
                            scaleFactor={0.25}
                          />
                          <PdfBookmarks />
                          <PdfSearch />
                          <PdfAttachments />
                          <PdfSignatures />
                          <PdfDownloader />
                          <PdfPrinter method={PrinterMethod.Iframe} />
                          <PdfEditor />
                        </PdfEditorContextProvider>
                      </PdfDocument>
                    </PdfNavigatorContextProvider>
                  </PdfApplication>
                </PdfEngineContextProvider>
              </PdfApplicationContextProvider>
            </ThemeContextProvider>
          </LoggerContextProvider>
        </PdfNativeAdapterProvider>
      </PanelMountPointContextProvider>
      ) : null}

    </div>
  );
}

export default PdfViewer;
