// ----------------- backend/routes/otp.js -----------------
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Temporary OTP store (for demo only — use Redis/DB for production)
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

  // Simulate sending OTP (no actual SMS)
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

  // For demo: create a fake user object and token
  const user = { phone: number };
  const token = jwt.sign(user, process.env.JWT_SECRET || "farmai_secret", {
    expiresIn: "1h",
  });

  return res.json({
    success: true,
    message: "OTP verified successfully!",
    token,
    user,
  });
});

module.exports = router;
