// backend/routes/chatbot.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

router.post("/", async (req, res) => {
  try {
    const { message, lat, lon, language } = req.body;

    // --- Weather Info ---
    let weatherText = "";
    if (lat && lon) {
      try {
        const weatherRes = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );
        const w = weatherRes.data;
        weatherText = `Current weather in ${w.name}: ${w.weather[0].description}, temperature ${w.main.temp}°C, humidity ${w.main.humidity}%.`;
      } catch (err) {
        weatherText = "Unable to fetch weather right now.";
      }
    }

    // --- Gemini Model ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `
      You are a friendly AI chatbot for farmers named FarmAI.
      User message: "${message}".
      Preferred language: ${language || "English"}.
      Weather: ${weatherText}.
      Respond simply and helpfully.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text(); // ✅ latest SDK handles this correctly

    res.json({ reply: response });
  } catch (error) {
    console.error("Chatbot Gemini error:", error);
    res.status(500).json({
      error: error.message || "Chatbot failed to respond",
    });
  }
});

module.exports = router;
