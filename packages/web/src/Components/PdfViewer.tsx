import { useEffect, useState } from "react";
import "./PdfViewer.css";
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
  PdfSearchPanel,
  PdfSignatures,
  PdfThumbnails,
  PdfToolbar,
  PrinterMethod,
  ThemeContextProvider,
  StoragePdfApplicationConfigurationProvider,
} from "@unionpdf/react";
import { PdfEngineError } from "@unionpdf/models";
import { logger } from "workbox-core/_private";

export interface PdfViewerProps {
  file: File;
}

export function PdfViewer(props: PdfViewerProps) {
  const [provider] = useState(() => {
    return new StoragePdfApplicationConfigurationProvider(
      localStorage,
      "pdfviewer.configurtion"
    );
  });

  const [engine] = useState(() => {
    const engine = new WebWorkerEngine(
      new URL("./PdfViewer.worker", import.meta.url)
    );
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
    <div className="pdf__viewer">
      {file ? (
        <PdfNativeAdapterProvider>
          <LoggerContextProvider logger={logger}>
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
                        onOpenSuccess={() => {}}
                        onOpenFailure={(error: PdfEngineError) => {}}
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
                          <PdfSearchPanel />
                          <PdfAttachments />
                          <PdfSignatures />
                          <PdfDownloader />
                          <PdfPrinter method={PrinterMethod.Iframe} />
                        </PdfEditorContextProvider>
                      </PdfDocument>
                    </PdfNavigatorContextProvider>
                  </PdfApplication>
                </PdfEngineContextProvider>
              </PdfApplicationContextProvider>
            </ThemeContextProvider>
          </LoggerContextProvider>
        </PdfNativeAdapterProvider>
      ) : null}
    </div>
  );
}

export default PdfViewer;
