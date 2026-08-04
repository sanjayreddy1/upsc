/**
 * OCR Service — Tesseract.js + PDF.js pipeline
 * Handles image and PDF text extraction in the browser
 */

import Tesseract from 'tesseract.js';

// ── Image OCR ──────────────────────────────────────────────────────────

export async function scanImage(file, onProgress) {
  try {
    const result = await Tesseract.recognize(file, 'eng', {
      logger: (info) => {
        if (onProgress && info.status === 'recognizing text') {
          onProgress(Math.round(info.progress * 100));
        }
      },
    });
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words?.length || 0,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract text from image. Please try a clearer image.');
  }
}

// ── PDF OCR ──────────────────────────────────────────────────────────────

import * as pdfjsLib from 'pdfjs-dist/build/pdf.mjs';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function scanPDF(file, onProgress) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;

    let allText = '';
    let totalConfidence = 0;
    let processedPages = 0;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Always render to canvas and OCR to ensure we capture text within diagrams and images.
      const scale = 2.0; // Higher scale = better OCR accuracy
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      await page.render({ canvasContext: ctx, viewport }).promise;

      // Run OCR on the rendered page
      const ocrResult = await Tesseract.recognize(canvas, 'eng', {
        logger: (info) => {
          if (onProgress && info.status === 'recognizing text') {
            const pageProgress = (pageNum - 1 + info.progress) / totalPages;
            onProgress(Math.round(pageProgress * 100));
          }
        },
      });

      allText += `\n--- Page ${pageNum} ---\n${ocrResult.data.text}`;
      totalConfidence += ocrResult.data.confidence;
      processedPages++;

      // Clean up canvas
      canvas.remove();
    }

    return {
      text: allText.trim(),
      confidence: processedPages > 0 ? totalConfidence / processedPages : 0,
      pages: totalPages,
      words: allText.split(/\s+/).filter(Boolean).length,
    };
  } catch (error) {
    console.error('PDF OCR Error:', error);
    throw new Error('Failed to process PDF. Please ensure the file is a valid PDF.');
  }
}

// ── File Handler (auto-detect type) ──────────────────────────────────

export async function scanFile(file, onProgress) {
  if (!file) throw new Error('No file provided');

  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return scanPDF(file, onProgress);
  }

  if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|bmp|gif|tiff|webp)$/.test(fileName)) {
    return scanImage(file, onProgress);
  }

  throw new Error(`Unsupported file type: ${fileType}. Please upload an image or PDF.`);
}
