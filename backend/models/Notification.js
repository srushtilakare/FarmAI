/* eslint-env node */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // USER WHO RECEIVES THE NOTIFICATION
    // --------------------------------------------------
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // USER WHO CAUSED THE NOTIFICATION
    // Example: user who liked/replied to a post
    // --------------------------------------------------
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    senderName: {
      type: String,
      default: "",
    },

    // --------------------------------------------------
    // NOTIFICATION TYPE
    // --------------------------------------------------
    type: {
      type: String,
      enum: [
        // Community
        "post_like",
        "post_reply",
        "reply_like",
        "forum_warning",
        "forum_suspension",
        "forum_suspension_ended",
        "forum_banned",

        // Gamification
        "badge_earned",
        "streak",
        "streak_milestone",
        "xp_earned",
        "level_up",

        // FarmAI
        "weather_alert",
        "crop_task",
        "market_update",
        "agri_news",
        "soil_reminder",

        // General
        "system",
      ],
      required: true,
      index: true,
    },

    // --------------------------------------------------
    // NOTIFICATION CATEGORY
    // Used by frontend for grouping/filtering
    // --------------------------------------------------
    category: {
      type: String,
      enum: [
        "community",
        "gamification",
        "farming",
        "system",
      ],
      default: "system",
      index: true,
    },

    // --------------------------------------------------
    // DISPLAY CONTENT
    // --------------------------------------------------
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    // --------------------------------------------------
    // OPTIONAL ICON
    // Frontend can use this to decide which icon to show
    // --------------------------------------------------
    icon: {
      type: String,
      default: "",
    },

    // --------------------------------------------------
    // RELATED RESOURCE
    // Example:
    // postId for a forum notification
    // badgeId for a badge notification
    // --------------------------------------------------
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    relatedModel: {
      type: String,
      enum: [
        "ForumPost",
        "ForumReply",
        "User",
        "Badge",
        "CropTask",
        "Weather",
        "Market",
        "News",
        null,
      ],
      default: null,
    },

    // --------------------------------------------------
    // OPTIONAL URL
    // Allows notification to open the related page
    // --------------------------------------------------
    link: {
      type: String,
      default: "",
    },

    // --------------------------------------------------
    // READ / UNREAD STATUS
    // --------------------------------------------------
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------
    // OPTIONAL EXTRA DATA
    // Useful for things like:
    // XP amount, streak days, badge name, etc.
    // --------------------------------------------------
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // --------------------------------------------------
    // PREVENT DUPLICATE NOTIFICATIONS
    // Optional identifier for events that should only
    // create one notification.
    // --------------------------------------------------
    uniqueKey: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// --------------------------------------------------
// INDEXES
// --------------------------------------------------

// Fast lookup of user's latest notifications
notificationSchema.index({
  recipient: 1,
  createdAt: -1,
});

// Fast lookup of unread notifications
notificationSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

// Useful for notification categories
notificationSchema.index({
  recipient: 1,
  category: 1,
  createdAt: -1,
});

// --------------------------------------------------
// EXPORT
// --------------------------------------------------

module.exports = mongoose.model("Notification", notificationSchema);