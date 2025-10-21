// backend/routes/userRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// ---------- Multer Setup for Profile Photo ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// ---------- GET: Fetch current user ----------
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v"); // exclude __v
    if (!user) return res.status(404).json({ message: "User not found" });
    // return user object directly to match frontend expectations
    res.json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------- PUT: Update user profile ----------
router.put("/", auth, upload.single("profilePhoto"), async (req, res) => {
  try {
    const updates = { ...req.body };

    // If a photo is uploaded, store its path (publicly accessible path)
    if (req.file) {
      updates.profilePhoto = `/uploads/${req.file.filename}`;
    }

    // req.body fields may be stringified JSON (because FormData was used).
    // Try to parse JSON fields where appropriate.
    for (const key of Object.keys(updates)) {
      const val = updates[key]
      if (typeof val === "string") {
        // attempt JSON parse for arrays/objects
        try {
          const parsed = JSON.parse(val)
          updates[key] = parsed
        } catch (e) {
          // leave as string
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-__v")

    if (!user) return res.status(404).json({ message: "User not found" })

    // return the updated user object directly
    res.json(user)
  } catch (err) {
    console.error("Profile update error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
