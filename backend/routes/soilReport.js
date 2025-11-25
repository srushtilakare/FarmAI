const express = require('express');
const router = express.Router();
const SoilReport = require('../models/SoilReport');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to analyze soil report using Gemini AI
async function analyzeSoilReportWithAI(reportText, soilParameters) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `You are an agricultural soil scientist. Analyze the following soil test report and provide detailed recommendations.

Soil Parameters:
${JSON.stringify(soilParameters, null, 2)}

Based on the soil parameters provided (even if some values are null or unknown), provide reasonable estimates and comprehensive recommendations.

IMPORTANT: You MUST respond with ONLY valid JSON. Follow these strict rules:
- "overallRating" MUST be EXACTLY one of: "excellent", "good", "moderate", or "poor" (lowercase, no other text)
- "priority" MUST be EXACTLY one of: "high", "medium", or "low" (lowercase, no other text)
- If NPK values are null/unknown, provide estimated typical ranges for Indian agricultural soil
- Do NOT add explanations or comments in enum fields

Provide your analysis in this EXACT JSON format:
{
  "extractedParameters": {
    "nitrogen": { "value": 250, "unit": "kg/ha", "status": "medium" },
    "phosphorus": { "value": 15, "unit": "kg/ha", "status": "medium" },
    "potassium": { "value": 180, "unit": "kg/ha", "status": "medium" },
    "pH": { "value": 6.8, "status": "neutral" },
    "organicCarbon": { "value": 0.5, "unit": "%", "status": "medium" }
  },
  "analysis": {
    "soilHealthSummary": "Brief summary of overall soil health (2-3 sentences)",
    "soilType": "Type of soil (Sandy/Loamy/Clay/Silty/etc.)",
    "overallRating": "excellent OR good OR moderate OR poor",
    "suitableCrops": [
      {
        "cropName": "Crop name suitable for this soil",
        "suitabilityScore": 85,
        "reason": "Brief explanation why this crop is suitable"
      },
      {
        "cropName": "Another suitable crop",
        "suitabilityScore": 80,
        "reason": "Brief explanation"
      }
    ],
    "fertilizerRecommendation": {
      "plan": "Detailed fertilizer application plan with timing",
      "npkRatio": "Recommended NPK ratio (e.g., 19:19:19)",
      "organicOptions": ["Vermicompost", "FYM", "Neem cake"],
      "applicationSchedule": "When and how to apply fertilizers"
    },
    "correctionMeasures": [
      {
        "issue": "Identified soil problem",
        "solution": "Detailed solution with practical steps",
        "priority": "high OR medium OR low"
      }
    ],
    "seasonalAdvice": "Season-specific farming recommendations for this soil"
  }
}

NOTE: If actual NPK values are provided in the parameters, use those and adjust their status (low/medium/high) based on standard ranges. If values are null, provide reasonable estimates for Indian agricultural soil. Provide detailed, practical advice for Indian farmers. Return ONLY the JSON, no additional text.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      
      // Handle both old and new response formats
      const analysis = parsedData.analysis || parsedData;
      const extractedParameters = parsedData.extractedParameters || null;
      
      // Validate and sanitize enum values
      const validRatings = ['excellent', 'good', 'moderate', 'poor'];
      const validPriorities = ['high', 'medium', 'low'];
      
      // Ensure overallRating is valid
      if (!validRatings.includes(analysis.overallRating)) {
        console.warn(`Invalid overallRating: ${analysis.overallRating}, defaulting to 'moderate'`);
        analysis.overallRating = 'moderate';
      }
      
      // Ensure priority values are valid in correctionMeasures
      if (analysis.correctionMeasures && Array.isArray(analysis.correctionMeasures)) {
        analysis.correctionMeasures = analysis.correctionMeasures.map(measure => {
          if (!validPriorities.includes(measure.priority)) {
            // Try to infer priority from text
            const priority = measure.priority?.toLowerCase();
            if (priority?.includes('high') || priority?.includes('urgent') || priority?.includes('critical')) {
              measure.priority = 'high';
            } else if (priority?.includes('low') || priority?.includes('minor')) {
              measure.priority = 'low';
            } else {
              measure.priority = 'medium';
            }
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

// Helper function to extract soil parameters (basic implementation)
function extractSoilParameters(reportData) {
  // This is a simplified extraction - in production, you'd use OCR for images/PDFs
  // For now, we'll accept manual input or use basic pattern matching
  
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
    
    // If manual parameters are provided, use them
    if (manualParameters) {
      soilReport.soilParameters = JSON.parse(manualParameters);
    } else {
      // Otherwise, extract from file (simplified for now)
      soilReport.soilParameters = extractSoilParameters();
    }
    
    await soilReport.save();
    
    // Log activity
    await logActivity(req.user._id, {
      activityType: 'soil-report',
      title: 'Soil Report Uploaded',
      description: `Uploaded soil test report from ${labName || 'Unknown Lab'}`,
      status: 'completed',
      result: 'Report uploaded, AI analysis in progress',
      relatedId: soilReport._id,
      relatedModel: 'SoilReport',
      metadata: { labName, testDate, hasManualParams: !!manualParameters }
    });
    
    // Trigger AI analysis asynchronously
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

// Async function to analyze report
async function analyzeReportAsync(reportId) {
  try {
    const report = await SoilReport.findById(reportId);
    if (!report) return;
    
    const aiResult = await analyzeSoilReportWithAI('', report.soilParameters);
    
    report.aiAnalysis = aiResult.analysis;
    
    // Update soil parameters if AI extracted them
    if (aiResult.extractedParameters) {
      report.soilParameters = {
        ...report.soilParameters,
        ...aiResult.extractedParameters
      };
    }
    
    report.processed = true;
    await report.save();
    
    // Log activity - analysis completed
    await logActivity(report.userId, {
      activityType: 'soil-report',
      title: 'Soil Report Analysis Completed',
      description: `AI analysis completed for soil report from ${report.labName || 'Unknown Lab'}`,
      status: 'completed',
      result: `Overall rating: ${aiResponse.overallRating || 'N/A'}`,
      relatedId: report._id,
      relatedModel: 'SoilReport',
      metadata: { 
        overallRating: aiResponse.overallRating,
        suitableCropsCount: aiResponse.suitableCrops?.length || 0,
        soilType: aiResponse.soilType
      }
    });
  } catch (error) {
    console.error('Error in async analysis:', error);
    const report = await SoilReport.findById(reportId);
    if (report) {
      report.processingError = error.message;
      report.processed = true;
      await report.save();
    }
  }
}

// Get all soil reports for user
router.get('/my-reports', auth, async (req, res) => {
  try {
    const reports = await SoilReport.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching soil reports:', error);
    res.status(500).json({ error: 'Failed to fetch soil reports' });
  }
});

// Get soil report by ID
router.get('/:reportId', auth, async (req, res) => {
  try {
    const report = await SoilReport.findOne({
      _id: req.params.reportId,
      userId: req.user._id
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching soil report:', error);
    res.status(500).json({ error: 'Failed to fetch soil report' });
  }
});

// Update soil parameters manually
router.put('/:reportId/parameters', auth, async (req, res) => {
  try {
    const report = await SoilReport.findOne({
      _id: req.params.reportId,
      userId: req.user._id
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    report.soilParameters = { ...report.soilParameters, ...req.body };
    report.processed = false; // Mark for re-analysis
    await report.save();
    
    // Trigger re-analysis
    analyzeReportAsync(report._id);
    
    res.json({
      success: true,
      message: 'Parameters updated. Re-analyzing...',
      report
    });
  } catch (error) {
    console.error('Error updating parameters:', error);
    res.status(500).json({ error: 'Failed to update parameters' });
  }
});

// Delete soil report
router.delete('/:reportId', auth, async (req, res) => {
  try {
    const report = await SoilReport.findOneAndDelete({
      _id: req.params.reportId,
      userId: req.user.userId
    });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Get latest report
router.get('/latest', auth, async (req, res) => {
  try {
    const report = await SoilReport.findOne({ 
      userId: req.user._id,
      processed: true
    }).sort({ createdAt: -1 });
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching latest report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

module.exports = router;

