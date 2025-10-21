const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// In-memory OTP store (for demo)
const otpStore = new Map();

/**
 * Register user
 */
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

    if (!fullName || !phone || !preferredLanguage || !farmLocation || !state || !district || !crops || !farmingType) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this phone" });
    }

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

/**
 * Request OTP
 */
router.post("/otp/request", async (req, res) => {
  try {
    const { number } = req.body;
    if (!number) return res.status(400).json({ success: false, message: "Phone number required" });

    const user = await User.findOne({ phone: number });
    if (!user) return res.status(404).json({ success: false, message: "This number is not registered" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    otpStore.set(number, otp);

    console.log(`Generated OTP for ${number}: ${otp}`); // For demo
    res.status(200).json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP request error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Verify OTP — issue JWT
 */
router.post("/otp/verify", async (req, res) => {
  try {
    const { number, otp } = req.body;
    if (!number || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });

    const validOtp = otpStore.get(number);
    if (!validOtp || validOtp !== otp) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    otpStore.delete(number);

    const user = await User.findOne({ phone: number });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
