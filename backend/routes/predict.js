const express = require("express");
const router = express.Router();
const multer = require("multer");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const { logActivity, getUserIdFromRequest } = require("./activities");

// Configure multer for uploads
const upload = multer({ dest: "backend/uploads/" });

// Supported crops (all available trained models)
const SUPPORTED_CROPS = [
  "apple",
  "cherry_(including_sour)",
  "corn_(maize)",
  "grape",
  "peach",
  "pepper_bell",
  "potato",
  "strawberry",
  "tomato"
];

// POST /api/predict/:crop
// crop can be: tomato, potato, etc.
router.post("/:crop", upload.single("image"), async (req, res) => {
  try {
    const { crop } = req.params;
    const cropNormalized = crop.toLowerCase();

    // Validate crop
    if (!SUPPORTED_CROPS.includes(cropNormalized)) {
      return res.status(400).json({ 
        error: `Unsupported crop: ${crop}`,
        supportedCrops: SUPPORTED_CROPS,
        note: "Available crops: Apple, Cherry, Corn, Grape, Peach, Pepper, Potato, Strawberry, Tomato"
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imgPath = path.resolve(req.file.path);

    // Spawn Python process (ml folder is in root, not backend)
    const mlScriptPath = path.join(__dirname, "../../ml/predict.py");
    const pythonProcess = spawn("python", [
      mlScriptPath, 
      "--image", imgPath,
      "--crop", cropNormalized
    ]);

    let result = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", async (code) => {
      // Delete uploaded file after prediction
      fs.unlinkSync(imgPath);

      if (errorOutput) console.error("Python stderr:", errorOutput);

      if (code !== 0) {
        return res.status(500).json({ error: "Prediction failed", details: errorOutput });
      }

      try {
        const parsedResult = JSON.parse(result);
        
        // Fetch detailed disease information from database
        const lang = req.query.lang || "en";
        
        // Capitalize crop name properly (handle names with underscores)
        const capitalizedCrop = cropNormalized
          .split('_')
          .map((word, index) => {
            // Only capitalize the first word, keep rest as is (for names like "Cherry_(including_sour)")
            if (index === 0) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
          })
          .join('_');

        console.log(`🔬 ML Prediction - Crop: "${cropNormalized}" → "${capitalizedCrop}", Disease: "${parsedResult.disease}"`);
        
        const diseaseInfo = await fetchDiseaseInfo(
          capitalizedCrop, 
          parsedResult.disease,
          lang
        );

        // Combine prediction result with disease info
        const response = {
          ...parsedResult,
          ...diseaseInfo
        };

        // Log activity (optional - only if user is authenticated)
        const userId = await getUserIdFromRequest(req);
        console.log('🔬 Disease detection - userId extracted:', userId);
        if (userId) {
          const loggedActivity = await logActivity(userId, {
            activityType: 'disease-detection',
            title: `Disease Detection - ${capitalizedCrop}`,
            description: `Detected ${parsedResult.disease} in ${capitalizedCrop} with ${parsedResult.confidence || 'N/A'}% confidence`,
            status: parsedResult.disease === 'Healthy' ? 'completed' : 'completed',
            result: parsedResult.disease === 'Healthy' ? 'Crop is healthy' : `Disease detected: ${parsedResult.disease}`,
            metadata: { crop: capitalizedCrop, disease: parsedResult.disease, confidence: parsedResult.confidence }
          });
          console.log('🔬 Disease detection activity logged:', loggedActivity ? 'Success' : 'Failed');
        } else {
          console.log('⚠️ Disease detection - No userId found, skipping activity log');
        }

        res.json(response);
      } catch (err) {
        console.error("Error parsing result:", err);
        res.status(500).json({ error: "Invalid response from prediction system" });
      }
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to fetch disease info from database
async function fetchDiseaseInfo(crop, disease, lang) {
  try {
    const response = await axios.get(
      `http://localhost:${process.env.PORT || 5000}/api/disease-info/${crop}/${disease}?lang=${lang}`
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching disease info:", err.message);
    // Return basic info if database fetch fails
    return {
      name: disease,
      description: "Disease detected. Consult local agricultural expert for treatment.",
      treatment: ["Consult agricultural expert"],
      prevention: ["Follow standard crop management practices"]
    };
  }
}

module.exports = router;

