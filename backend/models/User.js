/* eslint-env node */

// backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================================================
    // BASIC USER INFORMATION
    // =========================================================

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    mpin: {
      type: String,
      required: true,
    },

    // =========================================================
    // LANGUAGE
    // =========================================================

    preferredLanguage: {
      type: String,
      default: "en-US",
    },

    // =========================================================
    // FARM LOCATION
    // =========================================================

    farmName: {
      type: String,
      default: "",
      trim: true,
    },

    farmLocation: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      default: "",
      trim: true,
    },

    village: {
      type: String,
      default: "",
      trim: true,
    },

    latitude: {
      type: Number,
      default: 0,
    },

    longitude: {
      type: Number,
      default: 0,
    },

    // =========================================================
    // FARMING INFORMATION
    // =========================================================

    crops: {
      type: [String],
      required: true,
      default: [],
    },

    farmingType: {
      type: String,
      required: true,
      default: "traditional",
    },

    // =========================================================
    // FARMER ELIGIBILITY INFORMATION
    // Used later by Government Schemes module
    // =========================================================

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", ""],
      default: "",
    },

    socialCategory: {
      type: String,
      enum: ["general", "obc", "sc", "st", "other", ""],
      default: "",
    },

    farmerCategory: {
      type: String,
      enum: [
        "small",
        "marginal",
        "medium",
        "large",
        "landless",
        ""
      ],
      default: "",
    },

    annualFamilyIncome: {
      type: Number,
      default: null,
      min: 0,
    },

    landHolding: {
      type: Number,
      default: null,
      min: 0,
    },

    landUnit: {
      type: String,
      enum: ["acre", "hectare", ""],
      default: "",
    },

    landOwnership: {
      type: String,
      enum: [
        "owned",
        "leased",
        "shared",
        "government",
        "other",
        ""
      ],
      default: "",
    },

    irrigationType: {
      type: String,
      enum: [
        "rainfed",
        "canal",
        "well",
        "borewell",
        "drip",
        "sprinkler",
        "mixed",
        "other",
        ""
      ],
      default: "",
    },

    aadhaarLinked: {
      type: Boolean,
      default: null,
    },

    bankAccountAvailable: {
      type: Boolean,
      default: null,
    },

    pmKisanRegistered: {
      type: Boolean,
      default: null,
    },

    // =========================================================
    // PROFILE
    // =========================================================

    profilePhoto: {
      type: String,
      default: "",
    },

    // =========================================================
    // FAVORITE CROPS
    // =========================================================

    favoriteCrops: {
      type: [String],
      default: [],
    },

    // =========================================================
    // FORUM MODERATION
    // =========================================================

    forumWarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    forumStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    isBlockedFromForum: {
      type: Boolean,
      default: false,
    },

    forumBlockedUntil: {
      type: Date,
      default: null,
    },

    // =========================================================
    // FORUM WARNING HISTORY
    // =========================================================

    forumWarningHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },

        reason: {
          type: String,
          default: "",
        },

        content: {
          type: String,
          default: "",
        },

        violationNumber: {
          type: Number,
          default: 0,
        },

        action: {
          type: String,
          default: "warning",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);