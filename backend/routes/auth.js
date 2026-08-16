const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/User"); // Correct relative path

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      phone: user.phone,
    },
    process.env.JWT_SECRET || "farmai_secret",
    {
      expiresIn: "1h",
    }
  );
}

// Helper function to return user data to frontend
function getUserResponse(user) {
  return {
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
};

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
      village,
      latitude,
      longitude,
      crops,
      farmingType,
      password,
    } = req.body;

    // Validate required fields
    if (
      !fullName?.trim() ||
      !phone?.trim() ||
      !farmLocation?.trim() ||
      !state?.trim() ||
      !district?.trim() ||
      !Array.isArray(crops) ||
      crops.length === 0 ||
      !farmingType?.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "All required fields must be filled",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this phone already exists",
      });
    }

    // Hash password securely before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      fullName,
      phone,
      preferredLanguage,
      farmLocation,
      state,
      district,
      pincode,
      village,
      latitude,
      longitude,
      crops,
      farmingType,

      // Store only the hashed password
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      message: "Registration successful",
    });
  } catch (err) {
    console.error("Register error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

// POST /api/auth/password/login
router.post("/password/login", async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone?.trim() || !password) {
      return res.status(400).json({
        message: "Phone number and password are required",
      });
    }

    // Find user by phone number
    const user = await User.findOne({
      phone: phone.trim(),
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found. Please register first.",
      });
    }

    // Check whether this user has a password
    if (!user.password) {
      return res.status(400).json({
        message:
          "Password login is not available for this account. Please use OTP login.",
      });
    }

    // Compare entered password with stored hashed password
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Incorrect password",
      });
    }

    // Generate JWT
    const token = generateToken(user);

    // Return full user data for frontend
    const userResponse = getUserResponse(user);

    return res.json({
      success: true,
      message: "Password login successful!",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error("Password login error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;