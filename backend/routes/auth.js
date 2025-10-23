const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Correct relative path

// POST /api/auth/register
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

    // ✅ Validate required fields
    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !farmLocation?.trim() ||
      !state?.trim() ||
      !district?.trim() ||
      !Array.isArray(crops) ||
      crops.length === 0 ||
      !farmingType?.trim()
    ) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    // ✅ Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User with this phone already exists" });
    }

    // ✅ Create new user
    const newUser = new User({
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

    await newUser.save();

    return res.status(201).json({ message: "Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
