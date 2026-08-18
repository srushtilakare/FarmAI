// backend/routes/auth.js

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();
const User = require("../models/User");

// =========================================================
// HELPER: GENERATE JWT
// =========================================================

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

// =========================================================
// HELPER: RETURN USER DATA TO FRONTEND
// =========================================================

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
    village: user.village,

    latitude: user.latitude,
    longitude: user.longitude,

    crops: user.crops,
    farmingType: user.farmingType,

    profilePhoto: user.profilePhoto,
    favoriteCrops: user.favoriteCrops || [],
  };
}

// =========================================================
// HELPER: NORMALIZE PHONE NUMBER
// =========================================================

function normalizePhone(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(0, 10);
}

// =========================================================
// HELPER: VALIDATE INDIAN MOBILE NUMBER
// =========================================================

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// =========================================================
// HELPER: VALIDATE 4-DIGIT MPIN
// =========================================================

function isValidMpin(mpin) {
  return /^\d{4}$/.test(String(mpin || ""));
}

// =========================================================
// HELPER: CHECK WEAK 4-DIGIT MPINS
// =========================================================

function isWeakMpin(mpin) {
  const pin = String(mpin);

  const weakPins = [
    // Same digits
    "0000",
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",

    // Common sequences
    "1234",
    "4321",

    // Common patterns
    "1122",
    "2211",
    "1212",
    "2121",
    "1221",
    "2112",

    // Other commonly used PINs
    "2580",
    "0852",
    "6969",
    "1004",
    "2000",
    "2020",
  ];

  if (weakPins.includes(pin)) {
    return true;
  }

  // All digits same
  if (/^(\d)\1{3}$/.test(pin)) {
    return true;
  }

  // Ascending sequence
  let ascending = true;

  for (let i = 1; i < pin.length; i++) {
    if (Number(pin[i]) !== Number(pin[i - 1]) + 1) {
      ascending = false;
      break;
    }
  }

  if (ascending) {
    return true;
  }

  // Descending sequence
  let descending = true;

  for (let i = 1; i < pin.length; i++) {
    if (Number(pin[i]) !== Number(pin[i - 1]) - 1) {
      descending = false;
      break;
    }
  }

  if (descending) {
    return true;
  }

  return false;
}

// =========================================================
// POST /api/auth/check-phone
//
// Registration page uses this BEFORE moving to Step 2.
//
// If number already exists:
// → frontend can immediately show "Account already exists"
// → user should login instead
// =========================================================

router.post("/check-phone", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);

    // -----------------------------------------
    // PHONE REQUIRED
    // -----------------------------------------

    if (!phone) {
      return res.status(400).json({
        success: false,
        available: false,
        code: "PHONE_REQUIRED",
        message: "Mobile number is required.",
      });
    }

    // -----------------------------------------
    // PHONE FORMAT
    // -----------------------------------------

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        available: false,
        code: "INVALID_PHONE",
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // -----------------------------------------
    // CHECK DATABASE
    // -----------------------------------------

    const existingUser = await User.findOne({
      phone,
    });

    // -----------------------------------------
    // USER ALREADY EXISTS
    // -----------------------------------------

    if (existingUser) {
      return res.status(409).json({
        success: false,
        available: false,
        code: "PHONE_EXISTS",
        message:
          "An account with this mobile number already exists. Please login instead.",
      });
    }

    // -----------------------------------------
    // NUMBER AVAILABLE
    // -----------------------------------------

    return res.json({
      success: true,
      available: true,
      code: "PHONE_AVAILABLE",
      message: "Mobile number is available.",
    });
  } catch (err) {
    console.error("Check phone error:", err);

    return res.status(500).json({
      success: false,
      available: false,
      code: "SERVER_ERROR",
      message: "Unable to check mobile number right now.",
    });
  }
});

// =========================================================
// POST /api/auth/register
//
// REGISTER NEW FARMER USING 4-DIGIT MPIN
// =========================================================

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
      mpin,
    } = req.body;

    // =====================================================
    // CLEAN VALUES
    // =====================================================

    const cleanName = String(fullName || "").trim();

    const cleanPhone = normalizePhone(phone);

    const cleanState = String(state || "").trim();

    const cleanDistrict = String(district || "").trim();

    const cleanFarmLocation = String(
      farmLocation || ""
    ).trim();

    const cleanVillage = String(village || "").trim();

    const cleanPincode = String(pincode || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    const cleanMpin = String(mpin || "").trim();

    // =====================================================
    // NAME VALIDATION
    // =====================================================

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        code: "NAME_REQUIRED",
        message: "Please enter your full name.",
      });
    }

    // =====================================================
    // PHONE VALIDATION
    // =====================================================

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        code: "PHONE_REQUIRED",
        message: "Please enter your mobile number.",
      });
    }

    if (!isValidPhone(cleanPhone)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PHONE",
        message:
          "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    // =====================================================
    // LOCATION VALIDATION
    // =====================================================

    if (!cleanFarmLocation) {
      return res.status(400).json({
        success: false,
        code: "LOCATION_REQUIRED",
        message: "Please provide your farm location.",
      });
    }

    if (!cleanState) {
      return res.status(400).json({
        success: false,
        code: "STATE_REQUIRED",
        message: "Please select your state.",
      });
    }

    if (!cleanDistrict) {
      return res.status(400).json({
        success: false,
        code: "DISTRICT_REQUIRED",
        message: "Please select your district.",
      });
    }

    // =====================================================
    // CROPS VALIDATION
    // =====================================================

    if (!Array.isArray(crops) || crops.length === 0) {
      return res.status(400).json({
        success: false,
        code: "CROPS_REQUIRED",
        message: "Please select at least one crop.",
      });
    }

    // =====================================================
    // FARMING TYPE VALIDATION
    // =====================================================

    if (!farmingType || !String(farmingType).trim()) {
      return res.status(400).json({
        success: false,
        code: "FARMING_TYPE_REQUIRED",
        message: "Please select your farming method.",
      });
    }

    // =====================================================
    // MPIN VALIDATION
    // =====================================================

    if (!cleanMpin) {
      return res.status(400).json({
        success: false,
        code: "MPIN_REQUIRED",
        message: "Please create a 4-digit MPIN.",
      });
    }

    if (!isValidMpin(cleanMpin)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_MPIN",
        message: "MPIN must contain exactly 4 digits.",
      });
    }

    // =====================================================
    // WEAK MPIN CHECK
    // =====================================================

    if (isWeakMpin(cleanMpin)) {
      return res.status(400).json({
        success: false,
        code: "WEAK_MPIN",
        message:
          "This MPIN is too easy to guess. Please choose a different 4-digit MPIN.",
      });
    }

    // =====================================================
    // CHECK EXISTING USER
    // =====================================================

    const existingUser = await User.findOne({
      phone: cleanPhone,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        code: "PHONE_EXISTS",
        message:
          "An account with this mobile number already exists. Please login instead.",
      });
    }

    // =====================================================
    // HASH MPIN
    //
    // NEVER store the actual MPIN in MongoDB.
    // =====================================================

    const hashedMpin = await bcrypt.hash(
      cleanMpin,
      10
    );

    // =====================================================
    // CREATE USER
    // =====================================================

    const newUser = new User({
      fullName: cleanName,

      phone: cleanPhone,

      preferredLanguage:
        preferredLanguage || "en-US",

      farmLocation: cleanFarmLocation,

      state: cleanState,

      district: cleanDistrict,

      pincode: cleanPincode,

      village: cleanVillage,

      latitude:
        typeof latitude === "number"
          ? latitude
          : 0,

      longitude:
        typeof longitude === "number"
          ? longitude
          : 0,

      crops,

      farmingType: String(
        farmingType
      ).trim(),

      // Store ONLY hashed MPIN
      mpin: hashedMpin,
    });

    await newUser.save();

    // =====================================================
    // REGISTRATION SUCCESS
    // =====================================================

    return res.status(201).json({
      success: true,
      code: "REGISTRATION_SUCCESS",
      message: "Registration successful.",
    });
  } catch (err) {
    console.error(
      "Register error:",
      err
    );

    // MongoDB duplicate phone protection
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        code: "PHONE_EXISTS",
        message:
          "An account with this mobile number already exists. Please login instead.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message:
        "Registration failed. Please try again.",
    });
  }
});

// =========================================================
// POST /api/auth/mpin/login
//
// LOGIN USING PHONE + 4-DIGIT MPIN
// =========================================================

router.post("/mpin/login", async (req, res) => {
  try {
    const phone = normalizePhone(
      req.body.phone
    );

    const mpin = String(
      req.body.mpin || ""
    ).trim();

    // =====================================================
    // PHONE VALIDATION
    // =====================================================

    if (!phone) {
      return res.status(400).json({
        success: false,
        code: "PHONE_REQUIRED",
        message:
          "Please enter your mobile number.",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_PHONE",
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    // =====================================================
    // MPIN VALIDATION
    // =====================================================

    if (!mpin) {
      return res.status(400).json({
        success: false,
        code: "MPIN_REQUIRED",
        message:
          "Please enter your 4-digit MPIN.",
      });
    }

    if (!isValidMpin(mpin)) {
      return res.status(400).json({
        success: false,
        code: "INVALID_MPIN",
        message:
          "MPIN must contain exactly 4 digits.",
      });
    }

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({
      phone,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "USER_NOT_FOUND",
        message:
          "No FarmAI account is registered with this mobile number. Please register first.",
      });
    }

    // =====================================================
    // CHECK MPIN EXISTS
    // =====================================================

    if (!user.mpin) {
      return res.status(400).json({
        success: false,
        code: "MPIN_NOT_AVAILABLE",
        message:
          "MPIN login is not available for this account. Please use OTP login.",
      });
    }

    // =====================================================
    // COMPARE MPIN
    // =====================================================

    const isMpinCorrect =
      await bcrypt.compare(
        mpin,
        user.mpin
      );

    if (!isMpinCorrect) {
      return res.status(401).json({
        success: false,
        code: "INCORRECT_MPIN",
        message:
          "Incorrect MPIN. Please try again.",
      });
    }

    // =====================================================
    // GENERATE JWT
    // =====================================================

    const token =
      generateToken(user);

    const userResponse =
      getUserResponse(user);

    // =====================================================
    // LOGIN SUCCESS
    // =====================================================

    return res.json({
      success: true,
      code: "LOGIN_SUCCESS",
      message:
        "MPIN login successful!",
      token,
      user: userResponse,
    });
  } catch (err) {
    console.error(
      "MPIN login error:",
      err
    );

    return res.status(500).json({
      success: false,
      code: "SERVER_ERROR",
      message:
        "Unable to login right now. Please try again.",
    });
  }
});

// =========================================================
// OLD PASSWORD LOGIN
//
// Kept temporarily so old users/routes don't immediately
// break.
//
// NEW USERS SHOULD USE MPIN.
// =========================================================

router.post(
  "/password/login",
  async (req, res) => {
    try {
      const phone = normalizePhone(
        req.body.phone
      );

      const password = String(
        req.body.password || ""
      );

      // -----------------------------------------
      // VALIDATION
      // -----------------------------------------

      if (!phone || !password) {
        return res.status(400).json({
          success: false,
          code: "LOGIN_FIELDS_REQUIRED",
          message:
            "Phone number and password are required.",
        });
      }

      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_PHONE",
          message:
            "Please enter a valid 10-digit mobile number.",
        });
      }

      // -----------------------------------------
      // FIND USER
      // -----------------------------------------

      const user =
        await User.findOne({
          phone,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          code: "USER_NOT_FOUND",
          message:
            "No FarmAI account is registered with this mobile number.",
        });
      }

      // -----------------------------------------
      // PASSWORD EXISTS?
      // -----------------------------------------

      if (!user.password) {
        return res.status(400).json({
          success: false,
          code: "PASSWORD_NOT_AVAILABLE",
          message:
            "Password login is not available for this account. Please use MPIN or OTP login.",
        });
      }

      // -----------------------------------------
      // CHECK PASSWORD
      // -----------------------------------------

      const isPasswordCorrect =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          code: "INCORRECT_PASSWORD",
          message:
            "Incorrect password.",
        });
      }

      // -----------------------------------------
      // LOGIN
      // -----------------------------------------

      const token =
        generateToken(user);

      const userResponse =
        getUserResponse(user);

      return res.json({
        success: true,
        code: "LOGIN_SUCCESS",
        message:
          "Login successful!",
        token,
        user: userResponse,
      });
    } catch (err) {
      console.error(
        "Password login error:",
        err
      );

      return res.status(500).json({
        success: false,
        code: "SERVER_ERROR",
        message:
          "Unable to login right now. Please try again.",
      });
    }
  }
);

module.exports = router;