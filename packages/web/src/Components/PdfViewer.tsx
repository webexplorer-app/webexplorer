import { useEffect, useState } from "react";
import "./PdfViewer.css";
import { WebWorkerEngine } from "@unionpdf/engines";
import {
  PdfEngineContextProvider,
  PdfDocument,
  PdfNavigatorContextProvider,
  PdfPages,
  PdfPageAnnotationBase,
  PdfPageAnnotationComponentProps,
  PdfPageAnnotations,
  PdfPageCanvas,
  PdfPageContentComponentProps,
  PdfPageLinkAnnotation,
  PdfPageTextAnnotation,
  PdfNavigator,
} from "@unionpdf/react";
import {
  PdfAnnotationSubtype,
} from "@unionpdf/models";

function PdfPageAnnotation(props: PdfPageAnnotationComponentProps) {
  const { page, annotation, rotation, scaleFactor } = props;
  switch (annotation.type) {
    case PdfAnnotationSubtype.LINK:
      return (
        <PdfPageLinkAnnotation
          page={page}
          annotation={annotation}
          rotation={rotation}
          scaleFactor={scaleFactor}
        />
      );
    case PdfAnnotationSubtype.TEXT:
      return (
        <PdfPageTextAnnotation
          page={page}
          annotation={annotation}
          rotation={rotation}
          scaleFactor={scaleFactor}
        />
      );
    default:
      return <PdfPageAnnotationBase {...props} />;
  }
}

function PdfPageContent(props: PdfPageContentComponentProps) {
  return (
    <>
      <PdfPageCanvas {...props} />
      <PdfPageAnnotations {...props} annotationComponent={PdfPageAnnotation} />
    </>
  );
}

export interface PdfViewerProps {
  file: File;
}

export function PdfViewer(props: PdfViewerProps) {
  const [engine] = useState(() => {
    const engine = new WebWorkerEngine(new URL("./PdfViewer.worker.ts", import.meta.url));
    engine.initialize();

    return engine;
  });
  const [file, setFile] = useState<{ id: string; source: ArrayBuffer } | null>(
    null
  );

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as ArrayBuffer;
      setFile({
        id: props.file.name,
        source: result,
      });
    };

    reader.readAsArrayBuffer(props.file);

    return () => {
      reader.abort();
    };
  }, [props.file, engine]);

  const [pdfNavigator] = useState(() => {
    return new PdfNavigator();
  });

  return (
    <div className="pdf__viewer">
      {file ? (
        <PdfEngineContextProvider engine={engine}>
          <PdfNavigatorContextProvider navigator={pdfNavigator}>
            <PdfDocument
              id={file.id}
              source={file.source}
              onOpenSuccess={() => {}}
              onOpenFailure={() => {}}
            >
              <PdfPages
                prerenderRange={[-1, 1]}
                cacheRange={[-5, 5]}
                pageContentComponent={PdfPageContent}
              />
            </PdfDocument>
          </PdfNavigatorContextProvider>
        </PdfEngineContextProvider>
      ) : null}
    </div>
  );
}

export default PdfViewer;
