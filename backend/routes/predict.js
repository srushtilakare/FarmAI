const express = require("express");
const router = express.Router();
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

// Configure multer for uploads
const upload = multer({ dest: "backend/uploads/" });

// POST /api/predict/tomato
router.post("/tomato", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imgPath = path.resolve(req.file.path);

    // Spawn Python process
    const pythonProcess = spawn("python", ["ml/predict.py", "--image", imgPath]);

    let result = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Delete uploaded file after prediction
      fs.unlinkSync(imgPath);

      if (errorOutput) console.error("Python stderr:", errorOutput);

      if (code !== 0) {
        return res.status(500).json({ error: "Prediction failed" });
      }

      try {
        const parsedResult = JSON.parse(result);
        res.json(parsedResult);
      } catch (err) {
        res.status(500).json({ error: "Invalid response from Python script" });
      }
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
