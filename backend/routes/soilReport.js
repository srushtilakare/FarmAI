const express = require('express');
const router = express.Router();
const SoilReport = require('../models/SoilReport');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { extractTextFromPDF } = require('../utils/pdfExtractor');
 
const { logActivity } = require('./activities');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/soil-reports/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'));
    }
  }
});

 

// Helper function to analyze soil report 
async function analyzeSoilReport(soil) {

  const analysis = {
    soilHealthSummary: "",
    soilType: "Loamy",
    overallRating: "moderate",
    suitableCrops: [],
    fertilizerRecommendation: {
      plan: "",
      npkRatio: "",
      organicOptions: [],
      applicationSchedule: ""
    },
    correctionMeasures: [],
    seasonalAdvice: ""
  };

  let issues = 0;

  // --- pH ---
  if (soil.pH?.value !== null) {
    const ph = soil.pH.value;

    if (ph < 6) {
      issues++;
      analysis.correctionMeasures.push({
        issue: "Soil is acidic",
        solution: "Apply lime to increase pH",
        priority: "high"
      });
    } else if (ph > 7.5) {
      issues++;
      analysis.correctionMeasures.push({
        issue: "Soil is alkaline",
        solution: "Apply gypsum or organic matter",
        priority: "high"
      });
    }
  }

  // --- Nitrogen ---
  if (soil.nitrogen?.value !== null && soil.nitrogen.value < 50) {
    issues++;
    analysis.correctionMeasures.push({
      issue: "Low Nitrogen",
      solution: "Apply Urea fertilizer",
      priority: "high"
    });
  }

  // --- Phosphorus ---
  if (soil.phosphorus?.value !== null && soil.phosphorus.value < 30) {
    issues++;
    analysis.correctionMeasures.push({
      issue: "Low Phosphorus",
      solution: "Use DAP fertilizer",
      priority: "medium"
    });
  }

  // --- Potassium ---
  if (soil.potassium?.value !== null && soil.potassium.value < 120) {
    issues++;
    analysis.correctionMeasures.push({
      issue: "Low Potassium",
      solution: "Apply MOP (Potash)",
      priority: "medium"
    });
  }

  // --- Organic Carbon ---
  if (soil.organicCarbon?.value !== null && soil.organicCarbon.value < 0.5) {
    issues++;
    analysis.correctionMeasures.push({
      issue: "Low Organic Carbon",
      solution: "Add compost or manure",
      priority: "medium"
    });
  }

  // --- Rating ---
  if (issues === 0) {
    analysis.overallRating = "excellent";
    analysis.soilHealthSummary = "Soil is in excellent condition with balanced nutrients.";
  } else if (issues <= 2) {
    analysis.overallRating = "good";
    analysis.soilHealthSummary = "Soil is good but needs minor improvements.";
  } else if (issues <= 4) {
    analysis.overallRating = "moderate";
    analysis.soilHealthSummary = "Soil requires improvement in multiple areas.";
  } else {
    analysis.overallRating = "poor";
    analysis.soilHealthSummary = "Soil health is poor and needs immediate attention.";
  }

  // --- Fertilizer Plan ---
  analysis.fertilizerRecommendation = {
    plan: "Apply balanced fertilizers based on deficiencies",
    npkRatio: "10:26:26 or as per soil test",
    organicOptions: ["Compost", "Vermicompost", "Farmyard manure"],
    applicationSchedule: "Apply before sowing and during growth stages"
  };

  // --- Suitable Crops ---
  analysis.suitableCrops = [
    { cropName: "Wheat", suitabilityScore: 85, reason: "Moderate nutrient suitability" },
    { cropName: "Rice", suitabilityScore: 80, reason: "Can grow with improvements" },
    { cropName: "Maize", suitabilityScore: 78, reason: "Requires nitrogen improvement" }
  ];

  // --- Seasonal Advice ---
  analysis.seasonalAdvice =
    "Ensure proper irrigation and nutrient management based on seasonal crop requirements.";

  return {
    analysis,
    extractedParameters: soil
  };
}

// Helper function to extract soil parameters
function extractSoilParameters() {
  return {
    nitrogen: { value: null, unit: 'kg/ha', status: 'unknown' },
    phosphorus: { value: null, unit: 'kg/ha', status: 'unknown' },
    potassium: { value: null, unit: 'kg/ha', status: 'unknown' },
    pH: { value: null, status: 'unknown' },
    electricalConductivity: { value: null, unit: 'dS/m', status: 'unknown' },
    organicCarbon: { value: null, unit: '%', status: 'unknown' },
    iron: { value: null, unit: 'ppm', status: 'unknown' },
    zinc: { value: null, unit: 'ppm', status: 'unknown' },
    manganese: { value: null, unit: 'ppm', status: 'unknown' },
    copper: { value: null, unit: 'ppm', status: 'unknown' },
    boron: { value: null, unit: 'ppm', status: 'unknown' },
    sulphur: { value: null, unit: 'ppm', status: 'unknown' }
  };
}

// Upload and create soil report
router.post('/upload', auth, upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Report file is required' });
    }

    const { location, testDate, labName, manualParameters } = req.body;

    const soilReport = new SoilReport({
      userId: req.user._id,
      location: location ? JSON.parse(location) : {},
      reportFile: {
        url: `/uploads/soil-reports/${req.file.filename}`,
        fileName: req.file.originalname,
        fileType: req.file.mimetype
      },
      testDate: testDate || new Date(),
      labName: labName || 'Unknown Lab'
    });

    // 🟢 DEFAULT parameters
    soilReport.soilParameters = manualParameters
      ? JSON.parse(manualParameters)
      : extractSoilParameters();

    // 🟢 NEW: Extract text if PDF
    let extractedText = "";
    const filePath = `uploads/soil-reports/${req.file.filename}`;

    if (req.file.mimetype === 'application/pdf') {
      extractedText = await extractTextFromPDF(filePath);
      console.log("📄 Extracted PDF Text (first 300 chars):", extractedText.slice(0, 300));
    }

    // 🟢 Save report FIRST
    await soilReport.save();

    // 🟢 Log upload
    await logActivity(req.user._id, {
      activityType: 'soil-report',
      title: 'Soil Report Uploaded',
      description: `Uploaded soil test report`,
      status: 'completed',
      result: 'Report uploaded, analysis in progress',
      relatedId: soilReport._id,
      relatedModel: 'SoilReport'
    });

    // 🟢 Pass extractedText to async analysis
    analyzeReportAsync(soilReport._id, extractedText);

    res.json({
      success: true,
      message: 'Soil report uploaded successfully. Analysis in progress...',
      reportId: soilReport._id
    });

  } catch (error) {
    console.error('Error uploading soil report:', error);
    res.status(500).json({ error: 'Failed to upload soil report' });
  }
});

function extractValuesFromText(text) {
  const soil = extractSoilParameters();

  const getValue = (pattern) => {
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : null;
  };

  soil.pH.value = getValue(/pH\s*[:\-]?\s*(\d+\.?\d*)/i);
  soil.nitrogen.value = getValue(/nitrogen.*?(\d+\.?\d*)/i);
  soil.phosphorus.value = getValue(/phosphorus.*?(\d+\.?\d*)/i);
  soil.potassium.value = getValue(/potassium.*?(\d+\.?\d*)/i);
  soil.organicCarbon.value = getValue(/organic carbon.*?(\d+\.?\d*)/i);

  return soil;
}

// Async analysis
async function analyzeReportAsync(reportId, extractedText) {
  try {
    const report = await SoilReport.findById(reportId);
    if (!report) return;

    let soil = report.soilParameters;

    // 🟢 STEP 1: Extract values from text
    if (extractedText) {
      soil = extractValuesFromText(extractedText);
    }

    // 🟢 STEP 2: Run analysis logic
    const aiResult = await analyzeSoilReport(soil);

    report.soilParameters = soil;
    report.aiAnalysis = aiResult.analysis;
    report.processed = true;

    await report.save();

    await logActivity(report.userId, {
      activityType: 'soil-report',
      title: 'Soil Report Analysis Completed',
      description: `AI analysis completed`,
      status: 'completed',
      result: `Overall rating: ${report.aiAnalysis?.overallRating || 'N/A'}`
    });

  } catch (error) {
    console.error('Error in async analysis:', error);
  }
}

// Get all soil reports for logged-in user
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await SoilReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Error fetching soil reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;