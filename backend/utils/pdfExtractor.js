// backend/utils/pdfExtractor.js

const fs = require("fs");
const Tesseract = require("tesseract.js");
const { PDFParse } = require("pdf-parse");

// =========================================================
// OPTIONAL IMAGE PROCESSING
// =========================================================
//
// sharp is used to improve OCR quality for scanned laboratory
// reports.
//
// If sharp is unavailable, the system will still work using
// the original rendered PDF image.
//
// Install with:
// npm install sharp
// =========================================================

let sharp = null;

try {
  sharp = require("sharp");
  console.log("✅ Sharp image preprocessing available");
} catch (error) {
  console.warn(
    "⚠️ Sharp is not installed. OCR will use raw PDF images."
  );
  console.warn(
    "   Install it with: npm install sharp"
  );
}

// =========================================================
// OCR CONFIGURATION
// =========================================================

const OCR_LANGUAGE = "eng";

// =========================================================
// OCR IMAGE
// =========================================================

async function extractTextFromImage(filePath) {
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

    let imageBuffer = fs.readFileSync(filePath);

    // Improve image before OCR
    imageBuffer =
      await preprocessImage(imageBuffer);

    const result =
      await runOCR(
        imageBuffer,
        "image"
      );

    const text =
      result?.text || "";

    console.log(
      `📝 Image OCR extracted ${text.length} characters`
    );

    return text;
  } catch (error) {
    console.error(
      "❌ Image OCR extraction error:",
      error
    );

    return "";
  }
}

// =========================================================
// RUN TESSERACT OCR
// =========================================================

async function runOCR(
  imageBuffer,
  label = "page"
) {
  try {
    console.log(
      `🧠 Starting Tesseract OCR: ${label}`
    );

    /*
     * PSM 6:
     *
     * Treat image as a single uniform block of text.
     *
     * This works better for many laboratory tables than
     * the default automatic page segmentation.
     */

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
           * These settings are particularly useful for
           * laboratory reports containing tables and
           * small numeric values.
           */
          config: {
            tessedit_pageseg_mode: "6",
            preserve_interword_spaces: "1"
          }
        }
      );

    const text =
      result?.data?.text || "";

    return {
      text,
      data: result?.data || {}
    };
  } catch (error) {
    console.error(
      `❌ Tesseract OCR failed for ${label}:`,
      error
    );

    return {
      text: "",
      data: {}
    };
  }
}

// =========================================================
// IMAGE PREPROCESSING
// =========================================================
//
// Laboratory reports contain:
// - thin table borders
// - small decimal values
// - kg/ha
// - mg/kg
// - numbers such as 5.29, 5.46, 2.02, 1.31
//
// Improving the image before OCR significantly helps
// Tesseract recognize these values.
// =========================================================

async function preprocessImage(
  imageBuffer
) {
  if (!sharp) {
    return imageBuffer;
  }

  try {
    console.log(
      "🛠️ Preprocessing image for OCR..."
    );

    const metadata =
      await sharp(imageBuffer)
        .metadata();

    const originalWidth =
      metadata.width || 2000;

    /*
     * Make the page large enough for small table values.
     *
     * We don't blindly upscale tiny images too much.
     */
    const targetWidth =
      Math.max(
        originalWidth,
        3200
      );

    const processed =
      await sharp(imageBuffer)
        .resize({
          width: targetWidth,
          withoutEnlargement: false,
          fit: "inside"
        })
        .grayscale()
        .normalize()
        .sharpen({
          sigma: 1.2,
          m1: 1,
          m2: 2
        })
        .png()
        .toBuffer();

    console.log(
      `✅ OCR image preprocessing complete. Width: ${targetWidth}px`
    );

    return processed;
  } catch (error) {
    console.warn(
      "⚠️ Image preprocessing failed. Using original image.",
      error.message
    );

    return imageBuffer;
  }
}

// =========================================================
// PDF TEXT EXTRACTION
// =========================================================
//
// First try native PDF text.
//
// If native PDF text is poor, render PDF pages as high
// resolution images and OCR them.
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

    /*
     * Native extraction is accepted only if it contains
     * enough actual soil-report content.
     */
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
    // LAST OCR FALLBACK
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
// PDF → HIGH RESOLUTION PNG → OCR
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

    /*
     * IMPORTANT:
     *
     * Previous value:
     * desiredWidth: 2000
     *
     * New value:
     * desiredWidth: 3200
     *
     * Small laboratory result values such as:
     *
     * 5.29
     * 542
     * 144
     * 5.46
     * 2.02
     * 1.31
     * 4.46
     *
     * are much easier for OCR at this resolution.
     */

    const screenshotResult =
      await parser.getScreenshot({
        desiredWidth: 3200,
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
      const page =
        pages[i];

      if (!page?.data) {
        console.warn(
          `⚠️ Page ${i + 1} has no image data`
        );

        continue;
      }

      console.log(
        `🧠 OCR processing PDF page ${
          i + 1
        }/${pages.length}...`
      );

      try {
        // -----------------------------------------------
        // PREPROCESS PAGE
        // -----------------------------------------------

        const processedImage =
          await preprocessImage(
            page.data
          );

        // -----------------------------------------------
        // PRIMARY OCR
        // -----------------------------------------------

        const primaryOCR =
          await runOCR(
            processedImage,
            `Page ${i + 1}`
          );

        let pageText =
          primaryOCR.text || "";

        console.log(
          `📝 Page ${
            i + 1
          } primary OCR characters: ${
            pageText.length
          }`
        );

        // -----------------------------------------------
        // SECOND OCR PASS
        // -----------------------------------------------
        //
        // PSM 11 is useful when the first segmentation
        // misses isolated table values.
        //
        // We only run this if the first OCR appears weak.
        // -----------------------------------------------

        const soilScore =
          calculateSoilTextScore(
            pageText
          );

        const hasImportantNumbers =
          /\b\d+(?:\.\d+)?\s*(?:kg\s*\/\s*ha|mg\s*\/\s*kg|%|ppm)\b/i.test(
            pageText
          );

        if (
          soilScore < 4 ||
          !hasImportantNumbers
        ) {
          console.log(
            `🔁 Page ${
              i + 1
            } primary OCR appears incomplete. Running secondary OCR...`
          );

          const secondaryOCR =
            await runOCRWithPSM(
              processedImage,
              `Page ${i + 1} secondary`,
              "11"
            );

          const secondaryText =
            secondaryOCR.text || "";

          console.log(
            `📝 Page ${
              i + 1
            } secondary OCR characters: ${
              secondaryText.length
            }`
          );

          /*
           * Choose the OCR result containing more useful
           * soil-report information.
           */
          pageText =
            chooseBetterOCRText(
              pageText,
              secondaryText
            );
        }

        // -----------------------------------------------
        // SAVE PAGE TEXT
        // -----------------------------------------------

        console.log(
          `📝 Page ${
            i + 1
          } final OCR characters: ${
            pageText.length
          }`
        );

        console.log(
          `🔎 Page ${
            i + 1
          } OCR preview:`
        );

        console.log(
          pageText.slice(
            0,
            4000
          )
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
// OCR WITH CUSTOM PSM
// =========================================================

async function runOCRWithPSM(
  imageBuffer,
  label,
  psm
) {
  try {
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

          config: {
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: "1"
          }
        }
      );

    return {
      text:
        result?.data?.text || "",
      data:
        result?.data || {}
    };
  } catch (error) {
    console.error(
      `❌ ${label} failed:`,
      error
    );

    return {
      text: "",
      data: {}
    };
  }
}

// =========================================================
// CHOOSE BETTER OCR RESULT
// =========================================================

function chooseBetterOCRText(
  firstText,
  secondText
) {
  if (!firstText) {
    return secondText || "";
  }

  if (!secondText) {
    return firstText;
  }

  const firstScore =
    calculateDetailedOCRScore(
      firstText
    );

  const secondScore =
    calculateDetailedOCRScore(
      secondText
    );

  console.log(
    `📊 OCR comparison → Primary: ${firstScore}, Secondary: ${secondScore}`
  );

  return secondScore > firstScore
    ? secondText
    : firstText;
}

// =========================================================
// DETAILED OCR QUALITY SCORE
// =========================================================

function calculateDetailedOCRScore(
  text
) {
  if (!text) {
    return 0;
  }

  const lower =
    text.toLowerCase();

  let score = 0;

  const importantWords = [
    "soil",
    "analysis",
    "organic carbon",
    "nitrogen",
    "phosphorus",
    "phosphorous",
    "potassium",
    "magnesium",
    "calcium",
    "manganese",
    "iron",
    "copper",
    "zinc",
    "boron"
  ];

  for (
    const word of importantWords
  ) {
    if (
      lower.includes(word)
    ) {
      score += 2;
    }
  }

  /*
   * Give strong weight to values with recognized units.
   */
  const unitMatches =
    text.match(
      /\d+(?:\.\d+)?\s*(?:kg\s*\/\s*ha|mg\s*\/\s*kg|%|ppm)/gi
    );

  if (unitMatches) {
    score +=
      unitMatches.length * 4;
  }

  /*
   * Give extra weight to decimal values because soil
   * reports commonly contain values such as:
   *
   * 5.29
   * 5.46
   * 2.02
   * 1.31
   * 0.487
   * 4.46
   */
  const decimalMatches =
    text.match(
      /\b\d+\.\d+\b/g
    );

  if (decimalMatches) {
    score +=
      decimalMatches.length * 2;
  }

  return score;
}

// =========================================================
// SOIL TEXT SCORE
// =========================================================
//
// Used to decide whether native PDF text is useful.
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