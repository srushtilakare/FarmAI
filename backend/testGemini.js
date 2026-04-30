const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

(async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Hello from FarmAI!",
    });

    console.log(response.text);
  } catch (err) {
    console.error("Gemini test failed:", err);
  }
})();