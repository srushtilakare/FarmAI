const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// =========================================================
// MULTER SETUP FOR PROFILE PHOTO
// =========================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// =========================================================
// MIDDLEWARE TO VERIFY JWT
// =========================================================

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;

    next();
  } catch (err) {
    console.error("JWT verification error:", err);

    return res.status(401).json({
      message: "Token is invalid or expired",
    });
  }
};

// =========================================================
// GET CURRENT USER
// =========================================================

router.get("/user", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("GET /user error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =========================================================
// UPDATE CURRENT USER
// =========================================================

router.put(
  "/user",
  verifyToken,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // =====================================================
      // EXISTING PROFILE FIELDS
      // =====================================================

      const textFields = [
        "fullName",
        "email",
        "phone",
        "farmName",
        "farmLocation",
        "state",
        "district",
        "pincode",
        "village",
        "farmingType",
        "preferredLanguage",
      ];

      textFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });

      // =====================================================
      // CROPS
      // =====================================================

      if (req.body.crops !== undefined) {
        let crops = req.body.crops;

        // If FormData sends crops as JSON string
        if (typeof crops === "string") {
          try {
            const parsed = JSON.parse(crops);

            if (Array.isArray(parsed)) {
              crops = parsed;
            }
          } catch (error) {
            // If it is not JSON, support comma-separated values
            crops = crops
              .split(",")
              .map((crop) => crop.trim())
              .filter(Boolean);
          }
        }

        if (Array.isArray(crops)) {
          user.crops = crops;
        }
      }

      // =====================================================
      // GOVERNMENT SCHEME ELIGIBILITY FIELDS
      // =====================================================
      //
      // These fields are collected from the Profile page.
      // They are stored permanently in MongoDB through the
      // User model.
      //
      // =====================================================

      // Date of Birth
      if (req.body.dateOfBirth !== undefined) {
        if (req.body.dateOfBirth === "" || req.body.dateOfBirth === null) {
          user.dateOfBirth = null;
        } else {
          const dob = new Date(req.body.dateOfBirth);

          if (!isNaN(dob.getTime())) {
            user.dateOfBirth = dob;
          }
        }
      }

      // Gender
      if (req.body.gender !== undefined) {
        user.gender = req.body.gender;
      }

      // Social Category
      if (req.body.socialCategory !== undefined) {
        user.socialCategory = req.body.socialCategory;
      }

      // Farmer Category
      if (req.body.farmerCategory !== undefined) {
        user.farmerCategory = req.body.farmerCategory;
      }

      // Annual Family Income
      if (req.body.annualFamilyIncome !== undefined) {
        if (
          req.body.annualFamilyIncome === "" ||
          req.body.annualFamilyIncome === null
        ) {
          user.annualFamilyIncome = null;
        } else {
          const income = Number(req.body.annualFamilyIncome);

          if (!isNaN(income) && income >= 0) {
            user.annualFamilyIncome = income;
          }
        }
      }

      // Land Holding
      if (req.body.landHolding !== undefined) {
        if (
          req.body.landHolding === "" ||
          req.body.landHolding === null
        ) {
          user.landHolding = null;
        } else {
          const land = Number(req.body.landHolding);

          if (!isNaN(land) && land >= 0) {
            user.landHolding = land;
          }
        }
      }

      // Land Unit
      if (req.body.landUnit !== undefined) {
        user.landUnit = req.body.landUnit;
      }

      // Land Ownership
      if (req.body.landOwnership !== undefined) {
        user.landOwnership = req.body.landOwnership;
      }

      // Irrigation Type
      if (req.body.irrigationType !== undefined) {
        user.irrigationType = req.body.irrigationType;
      }

      // Aadhaar Linked
      if (req.body.aadhaarLinked !== undefined) {
        if (
          req.body.aadhaarLinked === "" ||
          req.body.aadhaarLinked === null
        ) {
          user.aadhaarLinked = null;
        } else if (typeof req.body.aadhaarLinked === "boolean") {
          user.aadhaarLinked = req.body.aadhaarLinked;
        } else {
          user.aadhaarLinked =
            req.body.aadhaarLinked === true ||
            req.body.aadhaarLinked === "true" ||
            req.body.aadhaarLinked === "yes";
        }
      }

      // Bank Account Available
      if (req.body.bankAccountAvailable !== undefined) {
        if (
          req.body.bankAccountAvailable === "" ||
          req.body.bankAccountAvailable === null
        ) {
          user.bankAccountAvailable = null;
        } else if (typeof req.body.bankAccountAvailable === "boolean") {
          user.bankAccountAvailable = req.body.bankAccountAvailable;
        } else {
          user.bankAccountAvailable =
            req.body.bankAccountAvailable === true ||
            req.body.bankAccountAvailable === "true" ||
            req.body.bankAccountAvailable === "yes";
        }
      }

      // PM-KISAN Registered
      if (req.body.pmKisanRegistered !== undefined) {
        if (
          req.body.pmKisanRegistered === "" ||
          req.body.pmKisanRegistered === null
        ) {
          user.pmKisanRegistered = null;
        } else if (typeof req.body.pmKisanRegistered === "boolean") {
          user.pmKisanRegistered = req.body.pmKisanRegistered;
        } else {
          user.pmKisanRegistered =
            req.body.pmKisanRegistered === true ||
            req.body.pmKisanRegistered === "true" ||
            req.body.pmKisanRegistered === "yes";
        }
      }

      // =====================================================
      // PROFILE PHOTO
      // =====================================================

      if (req.file) {
        user.profilePhoto = `/uploads/${req.file.filename}`;
      }

      // =====================================================
      // SAVE TO MONGODB
      // =====================================================

      await user.save();

      // =====================================================
      // RETURN UPDATED USER
      // =====================================================

      const updatedUser = await User.findById(req.userId).select("-__v");

      res.status(200).json(updatedUser);
    } catch (err) {
      console.error("PUT /user error:", err);

      // Handle duplicate phone number
      if (err.code === 11000) {
        return res.status(400).json({
          message: "This phone number is already registered.",
        });
      }

      // Handle Mongoose validation errors
      if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map(
          (error) => error.message
        );

        return res.status(400).json({
          message: "Invalid profile information",
          errors,
        });
      }

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;