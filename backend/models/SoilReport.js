const mongoose = require('mongoose');

const soilReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    state: String,
    district: String,
    village: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  reportFile: {
    url: String,
    fileName: String,
    fileType: String // PDF, image, etc.
  },
  testDate: Date,
  labName: String,
  
  // Extracted soil parameters
  soilParameters: {
    // Macronutrients
    nitrogen: { value: Number, unit: String, status: String }, // Low/Medium/High
    phosphorus: { value: Number, unit: String, status: String },
    potassium: { value: Number, unit: String, status: String },
    
    // Soil properties
    pH: { value: Number, status: String }, // Acidic/Neutral/Alkaline
    electricalConductivity: { value: Number, unit: String, status: String },
    organicCarbon: { value: Number, unit: String, status: String },
    
    // Micronutrients
    iron: { value: Number, unit: String, status: String },
    zinc: { value: Number, unit: String, status: String },
    manganese: { value: Number, unit: String, status: String },
    copper: { value: Number, unit: String, status: String },
    boron: { value: Number, unit: String, status: String },
    sulphur: { value: Number, unit: String, status: String },
    
    // Secondary nutrients
    calcium: { value: Number, unit: String, status: String },
    magnesium: { value: Number, unit: String, status: String }
  },
  
  // AI Analysis
  aiAnalysis: {
    soilHealthSummary: String,
    soilType: String, // Sandy, Loamy, Clay, etc.
    overallRating: {
      type: String,
      enum: ['excellent', 'good', 'moderate', 'poor']
    },
    suitableCrops: [{
      cropName: String,
      suitabilityScore: Number,
      reason: String
    }],
    fertilizerRecommendation: {
      plan: String,
      npkRatio: String,
      organicOptions: [String],
      applicationSchedule: String
    },
    correctionMeasures: [{
      issue: String,
      solution: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low']
      }
    }],
    seasonalAdvice: String
  },
  
  processed: {
    type: Boolean,
    default: false
  },
  processingError: String
}, {
  timestamps: true
});

// Indexes
soilReportSchema.index({ userId: 1, createdAt: -1 });
soilReportSchema.index({ 'location.state': 1, 'location.district': 1 });

module.exports = mongoose.model('SoilReport', soilReportSchema);

