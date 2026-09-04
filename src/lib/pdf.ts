import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Load the worker from the same origin (bundled as an asset by Vite)
// instead of a CDN, so extraction works offline/in sandboxed previews.
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Best-effort text extraction from a PDF file.
 * Throws with a readable message when the document can't be parsed.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  try {
    const doc = await loadingTask.promise;
    const chunks: string[] = [];
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      const line = content.items
        .map((item) => ("str" in item ? (item as { str: string }).str : ""))
        .join(" ");
      chunks.push(line.trim());
      page.cleanup();
    }
    return chunks.join("\n").trim();
  } finally {
    // Free the document and worker regardless of parse success.
    await loadingTask.destroy().catch(() => undefined);
  }
}
