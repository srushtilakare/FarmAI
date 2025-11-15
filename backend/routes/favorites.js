// backend/routes/favorites.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Add favorite: POST /api/favorites/add { userId, crop }
router.post("/add", async (req, res) => {
  try {
    const { userId, crop } = req.body;
    if (!userId || !crop) return res.status(400).json({ success: false, message: "userId and crop required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cropUpper = crop.toUpperCase();
    if (!user.favoriteCrops.includes(cropUpper)) {
      user.favoriteCrops.push(cropUpper);
      await user.save();
    }

    res.json({ success: true, data: user.favoriteCrops });
  } catch (err) {
    console.error("favorites add error:", err.message);
    res.status(500).json({ success: false, message: "Failed to add favorite" });
  }
});

// Remove favorite: POST /api/favorites/remove { userId, crop }
router.post("/remove", async (req, res) => {
  try {
    const { userId, crop } = req.body;
    if (!userId || !crop) return res.status(400).json({ success: false, message: "userId and crop required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const cropUpper = crop.toUpperCase();
    user.favoriteCrops = user.favoriteCrops.filter((c) => c !== cropUpper);
    await user.save();

    res.json({ success: true, data: user.favoriteCrops });
  } catch (err) {
    console.error("favorites remove error:", err.message);
    res.status(500).json({ success: false, message: "Failed to remove favorite" });
  }
});

// Get favorites: GET /api/favorites/:userId
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.favoriteCrops });
  } catch (err) {
    console.error("favorites get error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch favorites" });
  }
});

module.exports = router;
