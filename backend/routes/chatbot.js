// backend/routes/chatbot.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const { logActivity, getUserIdFromRequest } = require("./activities");

const HF_API_KEY = process.env.HF_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

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
You are FarmAI, a helpful AI assistant for farmers.

User question: ${message}
Language: ${language || "English"}
Weather info: ${weatherText}

Give a short, clear, and practical answer for farmers.
`;

   // --- Hugging Face API Call ---
let aiReply = "";

try {
  const hfResponse = await axios.post(
    "https://api-inference.huggingface.co/models/google/flan-t5-large",
    {
      inputs: `<s>[INST] You are a helpful agriculture assistant. Answer clearly.\n\n${prompt} [/INST]`,
    },
    {
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("HF RAW RESPONSE:", hfResponse.data); // debug

  if (Array.isArray(hfResponse.data)) {
    aiReply = hfResponse.data[0]?.generated_text || "";
  }

  // Clean output (remove prompt repetition)
  if (aiReply.includes("[/INST]")) {
    aiReply = aiReply.split("[/INST]")[1].trim();
  }

  if (!aiReply || aiReply.length < 3) {
    throw new Error("Empty response");
  }

} catch (hfError) {
  console.error("HF API error:", hfError.message);

  // --- SMART FALLBACK (Better than before 🔥) ---
  const msg = message.toLowerCase();

  if (msg.includes("hi") || msg.includes("hello")) {
    aiReply = "Hello! 😊 How can I help you with farming today?";
  } else if (msg.includes("fertilizer")) {
    aiReply = "You can use Urea, DAP, or organic compost depending on your soil condition.";
  } else if (msg.includes("weather")) {
    aiReply = weatherText || "Weather data is not available right now.";
  } else {
    aiReply =
      "I’m having trouble connecting to AI right now, but I can still help with basic farming questions.";
  }
} 

    // --- Logging ---
    const userId = await getUserIdFromRequest(req);
    if (userId) {
      await logActivity(userId, {
        activityType: "chat",
        title: "Chat with Farmii",
        description: `Chat interaction: ${message.substring(0, 100)}${
          message.length > 100 ? "..." : ""
        }`,
        status: "completed",
        result: "Response provided",
        metadata: {
          messageLength: message.length,
          hasLocation: !!(lat && lon),
        },
      });
    }

    res.json({ reply: aiReply });

  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({
      error: error.message || "Chatbot failed to respond",
    });
  }
});

module.exports = router;