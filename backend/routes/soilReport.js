const express = require('express');
const router = express.Router();
const SoilReport = require('../models/SoilReport');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { GoogleGenAI } = require('@google/genai'); // ✅ FIXED SDK
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

// ✅ NEW Gemini Setup
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Helper function to analyze soil report using Gemini AI
async function analyzeSoilReportWithAI(reportText, soilParameters) {
  try {

    const prompt = `You are an agricultural soil scientist. Analyze the following soil test report and provide detailed recommendations.

Soil Parameters:
${JSON.stringify(soilParameters, null, 2)}

Based on the soil parameters provided (even if some values are null or unknown), provide reasonable estimates and comprehensive recommendations.

IMPORTANT: You MUST respond with ONLY valid JSON. Follow these strict rules:
- "overallRating" MUST be EXACTLY one of: "excellent", "good", "moderate", or "poor"
- "priority" MUST be EXACTLY one of: "high", "medium", or "low"

Provide your analysis in JSON format.

Return ONLY JSON, no extra text.`;

    // ✅ NEW Gemini API call
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = result.text;

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);

      const analysis = parsedData.analysis || parsedData;
      const extractedParameters = parsedData.extractedParameters || null;

      const validRatings = ['excellent', 'good', 'moderate', 'poor'];
      const validPriorities = ['high', 'medium', 'low'];

      if (!validRatings.includes(analysis.overallRating)) {
        analysis.overallRating = 'moderate';
      }

      if (analysis.correctionMeasures && Array.isArray(analysis.correctionMeasures)) {
        analysis.correctionMeasures = analysis.correctionMeasures.map(measure => {
          if (!validPriorities.includes(measure.priority)) {
            const p = measure.priority?.toLowerCase();
            if (p?.includes('high')) measure.priority = 'high';
            else if (p?.includes('low')) measure.priority = 'low';
            else measure.priority = 'medium';
          }
          return measure;
        });
      }

      return {
        analysis,
        extractedParameters
      };
    }

    throw new Error('Failed to parse AI response');

  } catch (error) {
    console.error('Error analyzing with AI:', error);
    throw error;
  }
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

    soilReport.soilParameters = manualParameters
      ? JSON.parse(manualParameters)
      : extractSoilParameters();

    await soilReport.save();

    await logActivity(req.user._id, {
      activityType: 'soil-report',
      title: 'Soil Report Uploaded',
      description: `Uploaded soil test report`,
      status: 'completed',
      result: 'Report uploaded, AI analysis in progress',
      relatedId: soilReport._id,
      relatedModel: 'SoilReport'
    });

    analyzeReportAsync(soilReport._id);

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

// Async analysis
async function analyzeReportAsync(reportId) {
  try {
    const report = await SoilReport.findById(reportId);
    if (!report) return;

    const aiResult = await analyzeSoilReportWithAI('', report.soilParameters);

    report.aiAnalysis = aiResult.analysis;
    report.processed = true;

    await report.save();

    // ✅ FIXED BUG (aiResponse → report.aiAnalysis)
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

module.exports = router;