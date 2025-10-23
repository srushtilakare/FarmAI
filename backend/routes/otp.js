const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Import User model

const router = express.Router();

// Temporary OTP store (demo only — use Redis/DB in production)
let otpStore = {}; // { phone: { otp: "123456", expiresAt: 1690000000000 } }

// Helper: generate random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ----------------- Step 1: Request OTP -----------------
router.post("/request", async (req, res) => {
  const { number } = req.body;
  if (!number) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  const otp = generateOTP();
  const expiresAt = Date.now() + 2 * 60 * 1000; // valid for 2 minutes

  otpStore[number] = { otp, expiresAt };

  console.log(`✅ Simulated OTP for ${number}: ${otp}`);

  res.json({
    success: true,
    message: "OTP generated successfully (check backend console)",
  });
});

// ----------------- Step 2: Verify OTP -----------------
router.post("/verify", async (req, res) => {
  const { number, otp } = req.body;
  if (!number || !otp) {
    return res.status(400).json({ message: "Phone number and OTP are required" });
  }

  const record = otpStore[number];
  if (!record) {
    return res.status(400).json({ message: "OTP not found or expired" });
  }

  if (record.expiresAt < Date.now()) {
    delete otpStore[number];
    return res.status(400).json({ message: "OTP expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ✅ OTP verified
  delete otpStore[number];

  try {
    // Fetch actual user from DB
    let user = await User.findOne({ phone: number });

    // If user does not exist (first time login), you can optionally create it
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, phone: user.phone },
      process.env.JWT_SECRET || "farmai_secret",
      { expiresIn: "1h" }
    );

    // Return full user data for frontend
    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      farmLocation: user.farmLocation,
      state: user.state,
      district: user.district,
      pincode: user.pincode,
      crops: user.crops,
      farmingType: user.farmingType,
      profilePhoto: user.profilePhoto,
    };

    return res.json({
      success: true,
      message: "OTP verified successfully!",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
