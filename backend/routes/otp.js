// ----------------- routes/otp.js -----------------
const express = require("express");
const router = express.Router();
const axios = require("axios");

// POST /api/auth/otp/request
router.post("/request", async (req, res) => {
  try {
    const { number } = req.body;

    if (!number) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // ✅ Send OTP using Fast2SMS API (POST method)
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        route: "otp",
        variables_values: otp,
        numbers: number,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_KEY, // ✅ ensure key is correct
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Fast2SMS response:", response.data);

    if (response.data.return === true) {
      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        otp, // For debugging — remove in production
      });
    } else {
      return res.status(500).json({
        success: false,
        message: response.data.message || "Failed to send OTP",
      });
    }
  } catch (error) {
    console.error("OTP request error:", error.response?.data || error.message);

    if (error.response?.status === 401 || error.response?.status === 412) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Fast2SMS API key or request format" });
    }

    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
