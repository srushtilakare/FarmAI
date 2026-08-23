// backend/models/GovernmentScheme.js

const mongoose = require("mongoose");

const eligibilityRulesSchema = new mongoose.Schema(
  {
    // Age
    minAge: {
      type: Number,
      default: null,
    },

    maxAge: {
      type: Number,
      default: null,
    },

    // Income
    maxAnnualIncome: {
      type: Number,
      default: null,
    },

    minAnnualIncome: {
      type: Number,
      default: null,
    },

    // Land
    minLandHolding: {
      type: Number,
      default: null,
    },

    maxLandHolding: {
      type: Number,
      default: null,
    },

    landUnit: {
      type: String,
      enum: ["acre", "hectare", "any", ""],
      default: "any",
    },

    landOwnership: {
      type: [String],
      default: [],
    },

    // Farmer profile
    requiredGender: {
      type: [String],
      default: ["all"],
    },

    requiredCategory: {
      type: [String],
      default: ["all"],
    },

    requiredFarmerType: {
      type: [String],
      default: ["all"],
    },

    // Farming
    requiredIrrigationType: {
      type: [String],
      default: ["all"],
    },

    // Government requirements
    aadhaarRequired: {
      type: Boolean,
      default: false,
    },

    bankAccountRequired: {
      type: Boolean,
      default: false,
    },

    pmKisanRequired: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const governmentSchemeSchema = new mongoose.Schema(
  {
    // =========================================================
    // BASIC SCHEME INFORMATION
    // =========================================================

    schemeName: {
      type: String,
      required: true,
      trim: true,
    },

    ministry: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    schemeType: {
      type: String,
      enum: [
        "income_support",
        "subsidy",
        "credit",
        "loan",
        "insurance",
        "pension",
        "technical_assistance",
        "marketing",
        "skill_development",
        "infrastructure",
        "training",
        "equipment",
        "other",
      ],
      default: "subsidy",
    },

    // =========================================================
    // LOCATION
    // =========================================================

    state: {
      type: String,
      required: true,
      default: "all",
      trim: true,
    },

    // =========================================================
    // BASIC ELIGIBILITY FILTERS
    // =========================================================

    category: {
      type: [String],
      default: ["all"],
    },

    farmerType: {
      type: [String],
      default: ["small", "marginal", "large"],
    },

    gender: {
      type: [String],
      default: ["all"],
    },

    // =========================================================
    // HUMAN-READABLE ELIGIBILITY
    // =========================================================

    eligibility: {
      type: [String],
      required: true,
      default: [],
    },

    // =========================================================
    // STRUCTURED ELIGIBILITY RULES
    //
    // These rules are used by FarmAI's eligibility engine.
    // =========================================================

    eligibilityRules: {
      type: eligibilityRulesSchema,
      default: () => ({}),
    },

    // =========================================================
    // BENEFITS
    // =========================================================

    benefits: {
      type: String,
      required: true,
    },

    // =========================================================
    // APPLICATION
    // =========================================================

    documentsRequired: {
      type: [String],
      default: [],
    },

    howToApply: {
      type: String,
      required: true,
    },

    applicationLink: {
      type: String,
      default: "",
    },

    // =========================================================
    // LEGACY FIELDS
    //
    // Kept so existing data and existing functionality
    // continue to work.
    // =========================================================

    applicationProcess: {
      type: String,
      default: "",
    },

    requiredDocuments: {
      type: [String],
      default: [],
    },

    officialWebsite: {
      type: String,
      default: "",
    },

    contactInfo: {
      phone: {
        type: String,
        default: "",
      },

      email: {
        type: String,
        default: "",
      },

      address: {
        type: String,
        default: "",
      },
    },

    deadline: {
      type: Date,
      default: null,
    },

    budgetAmount: {
      type: String,
      default: "",
    },

    // =========================================================
    // PRIORITY
    // =========================================================

    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },

    // =========================================================
    // ACTIVE
    // =========================================================

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================

governmentSchemeSchema.index({
  state: 1,
  active: 1,
});

governmentSchemeSchema.index({
  category: 1,
});

governmentSchemeSchema.index({
  schemeType: 1,
});

governmentSchemeSchema.index({
  "eligibilityRules.minAge": 1,
  "eligibilityRules.maxAge": 1,
});

module.exports = mongoose.model(
  "GovernmentScheme",
  governmentSchemeSchema
);