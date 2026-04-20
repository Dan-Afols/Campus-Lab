import { useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

type PDFViewerProps = {
  file: string;
  page: number;
};

export function PDFViewer({ file, page }: PDFViewerProps) {
  const width = useMemo(() => Math.max(280, window.innerWidth - 56), []);
  return (
    <Document file={file} loading={<p className="text-body-sm">Loading PDF...</p>}>
      <Page pageNumber={page} width={width} />
    </Document>
  );
}
