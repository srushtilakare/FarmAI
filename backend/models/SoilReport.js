const mongoose = require("mongoose");

const soilReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      fileType: String
    },

    testDate: Date,

    labName: String,

    // =====================================================
    // REPORT CLASSIFICATION
    // =====================================================

    reportType: {
      type: String,
      enum: [
        "agricultural",
        "geotechnical",
        "unknown"
      ],
      default: "unknown"
    },

    reportTypeConfidence: {
      type: String,
      enum: [
        "high",
        "medium",
        "low"
      ],
      default: "low"
    },

    // =====================================================
    // EXTRACTION INFORMATION
    // =====================================================

    extraction: {
      method: {
        type: String,
        enum: [
          "pdf-text",
          "ocr",
          "manual",
          "unknown"
        ],
        default: "unknown"
      },

      confidence: {
        type: String,
        enum: [
          "high",
          "medium",
          "low"
        ],
        default: "low"
      },

      fieldsDetected: {
        type: Number,
        default: 0
      },

      warnings: {
        type: [String],
        default: []
      }
    },

    // =====================================================
    // EXTRACTED SOIL PARAMETERS
    // =====================================================

    soilParameters: {
      nitrogen: {
        value: Number,
        unit: String,
        status: String
      },

      phosphorus: {
        value: Number,
        unit: String,
        status: String
      },

      potassium: {
        value: Number,
        unit: String,
        status: String
      },

      pH: {
        value: Number,
        unit: String,
        status: String
      },

      electricalConductivity: {
        value: Number,
        unit: String,
        status: String
      },

      organicCarbon: {
        value: Number,
        unit: String,
        status: String
      },

      iron: {
        value: Number,
        unit: String,
        status: String
      },

      zinc: {
        value: Number,
        unit: String,
        status: String
      },

      manganese: {
        value: Number,
        unit: String,
        status: String
      },

      copper: {
        value: Number,
        unit: String,
        status: String
      },

      boron: {
        value: Number,
        unit: String,
        status: String
      },

      sulphur: {
        value: Number,
        unit: String,
        status: String
      },

      calcium: {
        value: Number,
        unit: String,
        status: String
      },

      magnesium: {
        value: Number,
        unit: String,
        status: String
      }
    },

    // =====================================================
    // ANALYSIS
    // =====================================================

    aiAnalysis: {
      soilHealthSummary: String,

      soilType: String,

      overallRating: {
        type: String,
        enum: [
          "excellent",
          "good",
          "moderate",
          "poor"
        ]
      },

      suitableCrops: [
        {
          cropName: String,
          suitabilityScore: Number,
          reason: String
        }
      ],

      fertilizerRecommendation: {
        plan: String,
        npkRatio: String,
        organicOptions: [String],
        applicationSchedule: String
      },

      correctionMeasures: [
        {
          issue: String,
          solution: String,

          priority: {
            type: String,
            enum: [
              "high",
              "medium",
              "low"
            ]
          }
        }
      ],

      seasonalAdvice: String
    },

    // =====================================================
    // PROCESSING
    // =====================================================

    processed: {
      type: Boolean,
      default: false
    },

    processingError: String
  },
  {
    timestamps: true
  }
);

// =========================================================
// INDEXES
// =========================================================

soilReportSchema.index({
  userId: 1,
  createdAt: -1
});

soilReportSchema.index({
  "location.state": 1,
  "location.district": 1
});

soilReportSchema.index({
  reportType: 1
});

module.exports =
  mongoose.model(
    "SoilReport",
    soilReportSchema
  );