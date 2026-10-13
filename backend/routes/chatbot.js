// backend/routes/chatbot.js
// Personalized Real-World AI Chatbot (Farmii) for Indian Farmers
// Powered by Farmii AI Engine (Gemini Flash + Live Weather + Profile Awareness + Offline Expert Rules)

const express = require("express");
const router = express.Router();
require("dotenv").config();

const User = require("../models/User");
const { logActivity, getUserIdFromRequest } = require("./activities");
const { askFarmii } = require("../utils/farmiiEngine");

/**
 * POST /api/chatbot and /farmii/chat
 * Handles multi-turn conversational questions with farmer profile personalization
 */
router.post("/", async (req, res) => {
  try {
    const {
      message,
      history = [],
      lat,
      lon,
      location,
      language = "en",
      farmerProfile = null,
    } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: "Message is required",
      });
    }

    // 1. Resolve Farmer Profile from DB via token OR body
    let farmer = {};
    let userId = null;

    try {
      userId = await getUserIdFromRequest(req);
      if (userId) {
        const dbUser = await User.findById(userId).select(
          "fullName phone farmLocation state district village crops farmingType farmerCategory preferredLanguage latitude longitude"
        );
        if (dbUser) {
          farmer = {
            fullName: dbUser.fullName,
            phone: dbUser.phone,
            farmLocation: dbUser.farmLocation,
            state: dbUser.state,
            district: dbUser.district,
            village: dbUser.village,
            crops: dbUser.crops || [],
            farmingType: dbUser.farmingType || "traditional",
            farmerCategory: dbUser.farmerCategory || "small",
            preferredLanguage: dbUser.preferredLanguage || language,
            latitude: dbUser.latitude,
            longitude: dbUser.longitude,
          };
        }
      }
    } catch (dbErr) {
      console.warn("Could not retrieve user from database:", dbErr.message);
    }

    // Merge any client-supplied profile data (e.g., from localStorage)
    if (farmerProfile && typeof farmerProfile === "object") {
      farmer = {
        ...farmer,
        ...farmerProfile,
        crops: farmerProfile.crops || farmer.crops || [],
      };
    }

    // 2. Resolve Coordinates
    const coords = {
      lat: lat || location?.lat || farmer?.latitude,
      lon: lon || location?.lon || farmer?.longitude,
    };

    // 3. Resolve preferred language
    const resolvedLanguage = language || farmer?.preferredLanguage || "en";

    // 4. Query Farmii Engine
    const result = await askFarmii({
      message: message.trim(),
      history,
      farmer,
      location: coords,
      language: resolvedLanguage,
    });

    // 5. Log Activity for Gamification (gives farmer XP!)
    if (userId) {
      try {
        await logActivity(userId, {
          activityType: "chat",
          title: "Chat with Farmii",
          description: `Asked Farmii: ${message.substring(0, 100)}${
            message.length > 100 ? "..." : ""
          }`,
          status: "completed",
          result: "Personalized advice provided",
          metadata: {
            modelUsed: result.modelUsed,
            source: result.source,
            hasProfile: !!farmer.fullName,
          },
        });
      } catch (logErr) {
        console.warn("Failed to log activity:", logErr.message);
      }
    }

    // 6. Return rich response
    return res.json({
      success: true,
      reply: result.reply,
      suggestedQuestions: result.suggestedQuestions || [],
      profileUsed: {
        name: farmer.fullName || "Farmer",
        location: farmer.farmLocation || farmer.district || "India",
        crops: farmer.crops || [],
        farmingType: farmer.farmingType || "traditional",
      },
      modelUsed: result.modelUsed,
      source: result.source,
    });
  } catch (error) {
    console.error("Chatbot router error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Farmii encountered an error",
      reply: "Sorry, I encountered an issue. Please try asking again.",
    });
  }
});

// Also support POST /chat subroute
router.post("/chat", async (req, res, next) => {
  return router.handle({ ...req, url: "/" }, res, next);
});

module.exports = router;