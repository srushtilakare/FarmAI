const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Load disease database
const diseaseDBPath = path.join(__dirname, "../../ml/disease_database.json");
let diseaseDatabase = {};

try {
  const data = fs.readFileSync(diseaseDBPath, "utf8");
  diseaseDatabase = JSON.parse(data);
  console.log("✅ Disease database loaded successfully");
  console.log("   Database path:", diseaseDBPath);
  console.log("   Available crops:", Object.keys(diseaseDatabase).join(", "));
} catch (err) {
  console.error("❌ Error loading disease database:", err);
  console.error("   Attempted path:", diseaseDBPath);
}

// GET /api/disease-info/:crop/:disease
// Returns detailed disease information in specified language
router.get("/:crop/:disease", (req, res) => {
  try {
    let { crop, disease } = req.params;
    const { lang = "en" } = req.query; // Default to English

    console.log(`🔍 Disease info request - Crop: "${crop}", Disease: "${disease}"`);

    // Find crop (case-insensitive)
    const cropKey = Object.keys(diseaseDatabase).find(
      key => key.toLowerCase() === crop.toLowerCase()
    );

    if (!cropKey) {
      console.error(`❌ Crop not found: "${crop}"`);
      return res.status(404).json({ 
        error: "Crop not found",
        requestedCrop: crop,
        availableCrops: Object.keys(diseaseDatabase)
      });
    }

    console.log(`✅ Crop matched: "${crop}" → "${cropKey}"`);

    // Find disease (case-insensitive)
    const diseaseKey = Object.keys(diseaseDatabase[cropKey]).find(
      key => key.toLowerCase() === disease.toLowerCase()
    );
    
    if (!diseaseKey) {
      console.error(`❌ Disease not found: "${disease}" for crop "${cropKey}"`);
      return res.status(404).json({ 
        error: "Disease not found for this crop",
        requestedDisease: disease,
        crop: cropKey,
        availableDiseases: Object.keys(diseaseDatabase[cropKey])
      });
    }

    console.log(`✅ Disease matched: "${disease}" → "${diseaseKey}"`);

    // Use the matched keys
    crop = cropKey;
    disease = diseaseKey;

    const diseaseInfo = diseaseDatabase[crop][disease];

    // Format response based on language
    const formattedResponse = {
      crop,
      disease: disease,
      name: diseaseInfo.name[lang] || diseaseInfo.name.en,
      description: diseaseInfo.description[lang] || diseaseInfo.description.en,
      severity: diseaseInfo.severity,
      affectedParts: diseaseInfo.affectedParts || [],
      causes: diseaseInfo.causes ? (diseaseInfo.causes[lang] || diseaseInfo.causes.en) : [],
      treatment: diseaseInfo.treatment[lang] || diseaseInfo.treatment.en,
      prevention: diseaseInfo.prevention[lang] || diseaseInfo.prevention.en,
      organicSolution: diseaseInfo.organicSolution ? 
        (diseaseInfo.organicSolution[lang] || diseaseInfo.organicSolution.en) : [],
      doAndDont: diseaseInfo.doAndDont ? {
        do: diseaseInfo.doAndDont.do[lang] || diseaseInfo.doAndDont.do.en,
        dont: diseaseInfo.doAndDont.dont[lang] || diseaseInfo.doAndDont.dont.en
      } : null,
      emergencyContact: diseaseInfo.emergencyContact ? 
        (diseaseInfo.emergencyContact[lang] || diseaseInfo.emergencyContact.en) : null
    };

    res.json(formattedResponse);
  } catch (err) {
    console.error("Error fetching disease info:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/disease-info/crops
// Returns list of available crops
router.get("/", (req, res) => {
  try {
    const crops = Object.keys(diseaseDatabase).map(crop => ({
      name: crop,
      diseases: Object.keys(diseaseDatabase[crop])
    }));
    
    res.json({ crops });
  } catch (err) {
    console.error("Error fetching crops:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

