// backend/routes/chatbot.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const { logActivity, getUserIdFromRequest } = require("./activities");

const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

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

    // --- Prompt ---
    const prompt = `
      You are a friendly AI chatbot for farmers named FarmAI.
      User message: "${message}".
      Preferred language: ${language || "English"}.
      Weather: ${weatherText}.
      Respond simply and helpfully.
    `;

    // --- NEW Gemini API ---
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",   // ✅ WORKING MODEL
      contents: prompt,
    });

    const response = result.text;

    // --- Logging ---
    const userId = await getUserIdFromRequest(req);
    if (userId) {
      await logActivity(userId, {
        activityType: 'chat',
        title: 'Chat with Farmii',
        description: `Chat interaction: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        status: 'completed',
        result: 'Response provided',
        metadata: { messageLength: message.length, hasLocation: !!(lat && lon) }
      });
    }

    res.json({ reply: response });

  } catch (error) {
    console.error("Chatbot Gemini error:", error);
    res.status(500).json({
      error: error.message || "Chatbot failed to respond",
    });
  }
});

module.exports = router;