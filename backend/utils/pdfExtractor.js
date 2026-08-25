// backend/utils/pdfExtractor.js

const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const { PDFParse } = require("pdf-parse");
const sharp = require("sharp");

// =========================================================
// OCR CONFIGURATION
// =========================================================

const OCR_LANGUAGE = "eng";

// =========================================================
// IMAGE PREPROCESSING
// =========================================================
//
// Makes small text/table values easier for Tesseract to read.
//
// We:
// 1. Resize image to at least 3200px wide
// 2. Convert to grayscale
// 3. Increase contrast
// 4. Sharpen
// 5. Normalize
//
// =========================================================

async function preprocessImage(
  inputBuffer,
  options = {}
) {
  try {
    const {
      width = 3200,
      threshold = false
    } = options;

    let image = sharp(inputBuffer)
      .rotate()
      .resize({
        width,
        withoutEnlargement: false,
        fit: "inside"
      })
      .grayscale()
      .normalize()
      .sharpen({
        sigma: 1.2
      });

    if (threshold) {
      image = image.threshold(170);
    }

    const output = await image.png().toBuffer();

    const metadata = await sharp(output).metadata();

    console.log(
      `✅ OCR image preprocessing complete. Width: ${metadata.width}px`
    );

    return output;
  } catch (error) {
    console.error(
      "❌ Image preprocessing error:",
      error
    );

    return inputBuffer;
  }
}

// =========================================================
// RUN TESSERACT OCR
// =========================================================

async function runTesseract(
  imageBuffer,
  label = "image",
  pageSegMode = 6
) {
  try {
    console.log(
      `🧠 Starting Tesseract OCR: ${label}`
    );

    const result =
      await Tesseract.recognize(
        imageBuffer,
        OCR_LANGUAGE,
        {
          logger: (message) => {
            if (
              message.status ===
                "recognizing text" &&
              typeof message.progress ===
                "number"
            ) {
              console.log(
                `${label} OCR: ${Math.round(
                  message.progress * 100
                )}%`
              );
            }
          },

          /*
           * Tesseract page segmentation modes:
           *
           * 6 = Assume a single uniform block of text
           * 4 = Assume a single column of text
           * 11 = Sparse text
           *
           * Soil tables often work better with 6 or 11.
           */

          config: {
            tessedit_pageseg_mode:
              String(pageSegMode)
          }
        }
      );

    const text =
      result?.data?.text || "";

    return text;
  } catch (error) {
    console.error(
      `❌ Tesseract OCR failed (${label}):`,
      error
    );

    return "";
  }
}

// =========================================================
// IMAGE OCR
// =========================================================

async function extractTextFromImage(
  filePath
) {
  try {
    console.log(
      "🧠 Running OCR on image:",
      filePath
    );

    if (!fs.existsSync(filePath)) {
      console.error(
        "❌ Image file does not exist:",
        filePath
      );

      return "";
    }

    const originalBuffer =
      fs.readFileSync(filePath);

    if (
      !originalBuffer ||
      originalBuffer.length === 0
    ) {
      console.error(
        "❌ Image file is empty"
      );

      return "";
    }

    // =====================================================
    // GET IMAGE DIMENSIONS
    // =====================================================

    const metadata =
      await sharp(originalBuffer).metadata();

    const originalWidth =
      metadata.width || 1280;

    const originalHeight =
      metadata.height || 720;

    console.log(
      `📐 Original image dimensions: ${originalWidth} x ${originalHeight}`
    );

    // =====================================================
    // PASS 1: FULL IMAGE
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "🔎 OCR PASS 1: Full image"
    );

    const fullImage =
      await preprocessImage(
        originalBuffer,
        {
          width: 3200,
          threshold: false
        }
      );

    const primaryText =
      await runTesseract(
        fullImage,
        "image",
        6
      );

    console.log(
      `📝 Image primary OCR extracted ${primaryText.length} characters`
    );

    // =====================================================
    // PASS 2: TABLE REGION
    // =====================================================
    //
    // Many soil reports contain a large header followed by
    // the actual soil table.
    //
    // We crop the middle/lower part where tables normally
    // occur. This gives small table characters much more
    // importance to OCR.
    //
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "🔎 OCR PASS 2: Main table region"
    );

    const tableTop =
      Math.floor(
        originalHeight * 0.28
      );

    const tableBottom =
      Math.floor(
        originalHeight * 0.78
      );

    const tableHeight =
      Math.max(
        1,
        tableBottom - tableTop
      );

    const tableBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: 0,
          top: tableTop,
          width: originalWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedTable =
      await preprocessImage(
        tableBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const tableText =
      await runTesseract(
        processedTable,
        "table",
        6
      );

    console.log(
      `📝 Table OCR extracted ${tableText.length} characters`
    );

    // =====================================================
    // PASS 3: LEFT HALF OF TABLE
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "🔎 OCR PASS 3: Left table region"
    );

    const leftWidth =
      Math.floor(
        originalWidth / 2
      );

    const leftTableBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: 0,
          top: tableTop,
          width: leftWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedLeft =
      await preprocessImage(
        leftTableBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const leftText =
      await runTesseract(
        processedLeft,
        "left-table",
        6
      );

    console.log(
      `📝 Left table OCR extracted ${leftText.length} characters`
    );

    // =====================================================
    // PASS 4: RIGHT HALF OF TABLE
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "🔎 OCR PASS 4: Right table region"
    );

    const rightWidth =
      originalWidth -
      leftWidth;

    const rightTableBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: leftWidth,
          top: tableTop,
          width: rightWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedRight =
      await preprocessImage(
        rightTableBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const rightText =
      await runTesseract(
        processedRight,
        "right-table",
        6
      );

    console.log(
      `📝 Right table OCR extracted ${rightText.length} characters`
    );

    // =====================================================
    // PASS 5: SPARSE TEXT OCR
    // =====================================================
    //
    // This is particularly useful when the table contains
    // separated cells rather than continuous paragraphs.
    //
    // =====================================================

    console.log(
      "================================================="
    );

    console.log(
      "🔎 OCR PASS 5: Sparse table OCR"
    );

    const sparseText =
      await runTesseract(
        processedTable,
        "sparse-table",
        11
      );

    console.log(
      `📝 Sparse OCR extracted ${sparseText.length} characters`
    );

    // =====================================================
    // COMBINE OCR RESULTS
    // =====================================================

    const combinedText = [
      "===== FULL IMAGE OCR =====",
      primaryText,

      "===== TABLE OCR =====",
      tableText,

      "===== LEFT TABLE OCR =====",
      leftText,

      "===== RIGHT TABLE OCR =====",
      rightText,

      "===== SPARSE TABLE OCR =====",
      sparseText
    ].join("\n\n");

    console.log(
      "================================================="
    );

    console.log(
      `📊 OCR comparison → Full: ${primaryText.length}, Table: ${tableText.length}, Left: ${leftText.length}, Right: ${rightText.length}, Sparse: ${sparseText.length}`
    );

    console.log(
      `📝 Combined image OCR characters: ${combinedText.length}`
    );

    console.log(
      "================================================="
    );

    return combinedText.trim();
  } catch (error) {
    console.error(
      "❌ Image OCR extraction error:",
      error
    );

    return "";
  }
}

// =========================================================
// PDF TEXT EXTRACTION
// =========================================================

async function extractTextFromPDF(
  filePath
) {
  let parser = null;

  try {
    console.log(
      "📄 Starting PDF extraction:",
      filePath
    );

    if (!fs.existsSync(filePath)) {
      console.error(
        "❌ PDF file does not exist:",
        filePath
      );

      return "";
    }

    const pdfBuffer =
      fs.readFileSync(filePath);

    if (
      !pdfBuffer ||
      pdfBuffer.length === 0
    ) {
      console.error(
        "❌ PDF file is empty"
      );

      return "";
    }

    // =====================================================
    // STEP 1: NATIVE PDF TEXT
    // =====================================================

    console.log(
      "🔎 Trying native PDF text extraction..."
    );

    parser =
      new PDFParse({
        data: pdfBuffer
      });

    const textResult =
      await parser.getText();

    const nativeText =
      textResult?.text || "";

    console.log(
      `📄 Native PDF text length: ${nativeText.length}`
    );

    const usefulTextScore =
      calculateSoilTextScore(
        nativeText
      );

    console.log(
      `📊 Native PDF soil-text score: ${usefulTextScore}`
    );

    if (
      nativeText.trim().length >= 100 &&
      usefulTextScore >= 2
    ) {
      console.log(
        "✅ Native PDF text appears usable."
      );

      await parser.destroy();
      parser = null;

      return nativeText;
    }

    console.log(
      "⚠️ Native PDF text is empty/poor. Falling back to OCR..."
    );

    await parser.destroy();
    parser = null;

    // =====================================================
    // STEP 2: PDF OCR
    // =====================================================

    return await extractTextFromPDFWithOCR(
      pdfBuffer
    );
  } catch (error) {
    console.error(
      "❌ PDF extraction error:",
      error
    );

    try {
      if (parser) {
        await parser.destroy();
      }
    } catch (destroyError) {
      console.error(
        "PDF parser cleanup error:",
        destroyError
      );
    }

    // =====================================================
    // FINAL PDF OCR FALLBACK
    // =====================================================

    try {
      console.log(
        "🔄 Attempting PDF OCR fallback after parser error..."
      );

      const pdfBuffer =
        fs.readFileSync(filePath);

      return await extractTextFromPDFWithOCR(
        pdfBuffer
      );
    } catch (ocrError) {
      console.error(
        "❌ PDF OCR fallback failed:",
        ocrError
      );

      return "";
    }
  }
}

// =========================================================
// PDF → IMAGE → MULTI-PASS OCR
// =========================================================

async function extractTextFromPDFWithOCR(
  pdfBuffer
) {
  let parser = null;

  try {
    console.log(
      "🖼️ Rendering PDF pages for OCR..."
    );

    parser =
      new PDFParse({
        data: pdfBuffer
      });

    const screenshotResult =
      await parser.getScreenshot({
        desiredWidth: 2400,
        imageBuffer: true,
        imageDataUrl: false
      });

    const pages =
      screenshotResult?.pages || [];

    console.log(
      `📑 PDF pages rendered: ${pages.length}`
    );

    if (pages.length === 0) {
      console.error(
        "❌ No PDF pages could be rendered."
      );

      await parser.destroy();
      parser = null;

      return "";
    }

    let combinedText = "";

    // =====================================================
    // OCR EACH PAGE
    // =====================================================

    for (
      let i = 0;
      i < pages.length;
      i++
    ) {
      const page = pages[i];

      if (!page?.data) {
        continue;
      }

      console.log(
        "================================================="
      );

      console.log(
        `🧠 OCR processing PDF page ${i + 1}/${pages.length}...`
      );

      try {
        const pageBuffer =
          Buffer.isBuffer(page.data)
            ? page.data
            : Buffer.from(page.data);

        const pageText =
          await extractTextFromImageBuffer(
            pageBuffer,
            `PDF page ${i + 1}`
          );

        console.log(
          `📝 Page ${i + 1} final OCR characters: ${pageText.length}`
        );

        combinedText +=
          `\n\n--- PDF PAGE ${
            i + 1
          } ---\n\n${pageText}`;
      } catch (pageError) {
        console.error(
          `❌ OCR failed on PDF page ${
            i + 1
          }:`,
          pageError
        );
      }
    }

    await parser.destroy();
    parser = null;

    console.log(
      "================================================="
    );

    console.log(
      `✅ PDF OCR complete. Total extracted characters: ${combinedText.length}`
    );

    return combinedText.trim();
  } catch (error) {
    console.error(
      "❌ PDF → image → OCR error:",
      error
    );

    try {
      if (parser) {
        await parser.destroy();
      }
    } catch (destroyError) {
      console.error(
        "PDF parser cleanup error:",
        destroyError
      );
    }

    return "";
  }
}

// =========================================================
// OCR PDF PAGE BUFFER
// =========================================================

async function extractTextFromImageBuffer(
  originalBuffer,
  label
) {
  try {
    const metadata =
      await sharp(originalBuffer).metadata();

    const originalWidth =
      metadata.width || 2000;

    const originalHeight =
      metadata.height || 2800;

    console.log(
      `📐 ${label} dimensions: ${originalWidth} x ${originalHeight}`
    );

    // =====================================================
    // FULL PAGE
    // =====================================================

    console.log(
      "🛠️ Preprocessing image for OCR..."
    );

    const fullImage =
      await preprocessImage(
        originalBuffer,
        {
          width: 3200,
          threshold: false
        }
      );

    const primaryText =
      await runTesseract(
        fullImage,
        `${label} primary`,
        6
      );

    console.log(
      `📝 ${label} primary OCR characters: ${primaryText.length}`
    );

    // =====================================================
    // TABLE REGION
    // =====================================================

    console.log(
      `🔎 ${label}: Running table-region OCR...`
    );

    const tableTop =
      Math.floor(
        originalHeight * 0.20
      );

    const tableBottom =
      Math.floor(
        originalHeight * 0.85
      );

    const tableHeight =
      Math.max(
        1,
        tableBottom - tableTop
      );

    const tableBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: 0,
          top: tableTop,
          width: originalWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedTable =
      await preprocessImage(
        tableBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const tableText =
      await runTesseract(
        processedTable,
        `${label} table`,
        6
      );

    // =====================================================
    // LEFT TABLE
    // =====================================================

    const leftWidth =
      Math.floor(
        originalWidth / 2
      );

    const leftBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: 0,
          top: tableTop,
          width: leftWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedLeft =
      await preprocessImage(
        leftBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const leftText =
      await runTesseract(
        processedLeft,
        `${label} left`,
        6
      );

    // =====================================================
    // RIGHT TABLE
    // =====================================================

    const rightWidth =
      originalWidth -
      leftWidth;

    const rightBuffer =
      await sharp(originalBuffer)
        .rotate()
        .extract({
          left: leftWidth,
          top: tableTop,
          width: rightWidth,
          height: tableHeight
        })
        .png()
        .toBuffer();

    const processedRight =
      await preprocessImage(
        rightBuffer,
        {
          width: 3600,
          threshold: false
        }
      );

    const rightText =
      await runTesseract(
        processedRight,
        `${label} right`,
        6
      );

    // =====================================================
    // SPARSE OCR
    // =====================================================

    const sparseText =
      await runTesseract(
        processedTable,
        `${label} sparse`,
        11
      );

    // =====================================================
    // COMBINE
    // =====================================================

    const combinedText = [
      "===== FULL PAGE OCR =====",
      primaryText,

      "===== TABLE OCR =====",
      tableText,

      "===== LEFT TABLE OCR =====",
      leftText,

      "===== RIGHT TABLE OCR =====",
      rightText,

      "===== SPARSE TABLE OCR =====",
      sparseText
    ].join("\n\n");

    console.log(
      `📊 ${label} OCR comparison → Primary: ${primaryText.length}, Table: ${tableText.length}, Left: ${leftText.length}, Right: ${rightText.length}, Sparse: ${sparseText.length}`
    );

    console.log(
      `📝 ${label} combined OCR characters: ${combinedText.length}`
    );

    return combinedText;
  } catch (error) {
    console.error(
      `❌ ${label} multi-pass OCR failed:`,
      error
    );

    return "";
  }
}

// =========================================================
// SOIL TEXT SCORE
// =========================================================

function calculateSoilTextScore(
  text
) {
  if (!text) {
    return 0;
  }

  const lower =
    text.toLowerCase();

  const keywords = [
    "soil",
    "nitrogen",
    "phosphorus",
    "phosphorous",
    "potassium",
    "organic carbon",
    "organic matter",
    "calcium",
    "magnesium",
    "manganese",
    "iron",
    "copper",
    "zinc",
    "boron",
    "sulphur",
    "sulfur",
    "ph",
    "laboratory",
    "analysis",
    "test results"
  ];

  let score = 0;

  for (
    const keyword of keywords
  ) {
    if (
      lower.includes(keyword)
    ) {
      score++;
    }
  }

  return score;
}

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  extractTextFromPDF,
  extractTextFromImage
};