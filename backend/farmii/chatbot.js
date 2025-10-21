import express from "express";
import axios from "axios";

const router = express.Router();

// POST /farmii/chat
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Free model from Hugging Face — multilingual and conversational
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      { inputs: message },
      {
        headers: {
          Authorization: "Bearer hf_zKXXXXYOUR_FREE_TOKEN", // Get a free token below 👇
        },
      }
    );

    const answer = response.data[0]?.generated_text || "Sorry, I couldn't understand that.";

    res.json({ reply: answer });
  } catch (err) {
    console.error("Error in chatbot:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
