const express = require("express");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// ----------------- Multer setup for profile photo -----------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ----------------- Middleware to verify JWT -----------------
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token is invalid or expired" });
  }
};

// ----------------- GET current user -----------------
router.get("/user", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-__v");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error("GET /user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------- UPDATE current user -----------------
router.put("/user", verifyToken, upload.single("profilePhoto"), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields from FormData
    const fields = [
      "fullName",
      "email",
      "phone",
      "farmName",
      "farmLocation",
      "state",
      "district",
      "pincode",
      "crops",
      "farmingType",
      "preferredLanguage",
    ];

    fields.forEach((field) => {
      if (req.body[field]) user[field] = req.body[field];
    });

    // Update profile photo
    if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("PUT /user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
