const express = require("express");
const router = express.Router();
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Upload folder
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// POST /api/predict/tomato
router.post("/tomato", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const imgPath = req.file.path;

  const pythonProcess = spawn("python", ["ml/predict.py", imgPath]);

  let outputData = "";
  pythonProcess.stdout.on("data", (data) => {
    outputData += data.toString();
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error("Python Error:", data.toString());
  });

  pythonProcess.on("close", (code) => {
    try {
      const result = JSON.parse(outputData);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Prediction failed" });
    }
  });
});

module.exports = router;
