const express = require("express");
const User = require("../models/User");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Store OTPs temporarily (for demo; use Redis in production)
const otpStore = {};

// Step 1: Request OTP
router.post("/request", async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone number required" });

    // Check if user exists
    let user = await User.findOne({ phone });
    if (!user) {
      // Create minimal user for OTP login
      user = await User.create({
        phone,
        fullName: "Farmer",
        preferredLanguage: "en-US",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;

    // Send SMS via Fast2SMS
    await axios.get(`https://www.fast2sms.com/dev/bulkV2`, {
      headers: { Authorization: process.env.FAST2SMS_KEY },
      params: {
        route: "v3",
        numbers: phone,
        message: `Your FarmAI OTP is ${otp}. It is valid for 5 minutes.`,
      },
    });

    console.log("OTP for", phone, otp);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("OTP request error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Step 2: Verify OTP
router.post("/verify", async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: "Phone and OTP required" });

    if (otpStore[phone] !== otp) return res.status(400).json({ message: "Invalid OTP" });

    delete otpStore[phone]; // OTP used

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Issue JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ message: "Login successful", token, user });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
