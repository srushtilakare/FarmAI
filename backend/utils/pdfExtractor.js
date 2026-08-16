const fs = require("fs");
const Tesseract = require("tesseract.js");

async function extractTextFromPDF(filePath) {
  try {
    console.log("🧠 Running OCR on:", filePath);

    const { data: { text } } = await Tesseract.recognize(
      filePath,
      "eng",
      { logger: m => console.log(m.status) }
    );

    return text;
  } catch (error) {
    console.error("OCR extraction error:", error);
    return "";
  }
}

module.exports = { extractTextFromPDF };