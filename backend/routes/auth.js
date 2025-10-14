const express = require("express");
const User = require("../models/User");

const router = express.Router();

// Full Registration
router.post("/register", async (req, res) => {
  try {
    const {
      fullName,
      phone,
      preferredLanguage,
      farmLocation,
      state,
      district,
      pincode,
      crops,
      farmingType,
    } = req.body;

    // Validate required fields
    if (!fullName || !phone || !preferredLanguage || !farmLocation || !state || !district || !crops || !farmingType) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // Check if phone already registered
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this phone" });
    }

    // Save user
    const user = new User({
      fullName,
      phone,
      preferredLanguage,
      farmLocation,
      state,
      district,
      pincode,
      crops,
      farmingType,
    });

    await user.save();
    res.status(201).json({ message: "Registration successful", user });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
