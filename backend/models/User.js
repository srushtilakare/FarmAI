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

    // Number of actual inappropriate-content
    // submission attempts made by the user.
    //
    // 1st attempt  -> Warning
    // 2nd attempt  -> Warning
    // 3rd attempt  -> 7-day suspension
    // 4th attempt  -> Permanent forum ban
    forumWarnings: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Current forum participation status.
    //
    // active    -> Can post and comment
    // suspended -> Can read, but cannot post/comment
    // banned    -> Can read, but cannot post/comment permanently
    //
    // Default is active so existing users are not affected.
    forumStatus: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    // Permanent forum restriction.
    //
    // Kept for compatibility with the existing forum code
    // and any existing data that may already use this field.
    isBlockedFromForum: {
      type: Boolean,
      default: false,
    },

    // End date/time of a temporary forum suspension.
    //
    // This remains null for active users and permanently
    // banned users.
    forumBlockedUntil: {
      type: Date,
      default: null,
    },

    // -----------------------------------------
    // FORUM WARNING HISTORY
    // -----------------------------------------
    // Stores each actual inappropriate-content
    // submission attempt.
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

        // Stores the violation number at the time
        // it occurred: 1, 2, 3, or 4.
        violationNumber: {
          type: Number,
          default: 0,
        },

        // Stores the action taken for that violation.
        // Example:
        // "warning"
        // "suspension"
        // "ban"
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