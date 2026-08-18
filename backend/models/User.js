/* eslint-env node */

// backend/models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // -----------------------------------------
    // BASIC USER INFORMATION
    // -----------------------------------------
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

    // -----------------------------------------
    // AUTHENTICATION
    // -----------------------------------------
    // MPIN is stored as a bcrypt hash.
    // Never store the actual 4-digit MPIN.
    mpin: {
      type: String,
      required: true,
    },

    // -----------------------------------------
    // LANGUAGE
    // -----------------------------------------
    preferredLanguage: {
      type: String,
      default: "en-US",
    },

    // -----------------------------------------
    // FARM LOCATION
    // -----------------------------------------
    farmLocation: {
      type: String,
      required: true,
    },

    state: {
      type: String,
      required: true,
    },

    district: {
      type: String,
      required: true,
    },

    pincode: {
      type: String,
      default: "",
    },

    village: {
      type: String,
      default: "",
    },

    latitude: {
      type: Number,
      default: 0,
    },

    longitude: {
      type: Number,
      default: 0,
    },

    // -----------------------------------------
    // FARMING INFORMATION
    // -----------------------------------------
    crops: {
      type: [String],
      required: true,
    },

    farmingType: {
      type: String,
      required: true,
    },

    // -----------------------------------------
    // PROFILE
    // -----------------------------------------
    profilePhoto: {
      type: String,
      default: "",
    },

    // -----------------------------------------
    // FAVORITE CROPS
    // -----------------------------------------
    favoriteCrops: {
      type: [String],
      default: [],
    },

    // -----------------------------------------
    // FORUM MODERATION
    // -----------------------------------------
    forumWarnings: {
      type: Number,
      default: 0,
    },

    isBlockedFromForum: {
      type: Boolean,
      default: false,
    },

    forumBlockedUntil: {
      type: Date,
      default: null,
    },

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
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);