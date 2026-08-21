/* eslint-env node */

const Notification = require("../models/Notification");

// ============================================================
// CREATE A NOTIFICATION
// ============================================================

async function createNotification({
  recipient,
  sender = null,
  senderName = "",
  type,
  category = "system",
  title,
  message,
  icon = "",
  relatedId = null,
  relatedModel = null,
  link = "",
  metadata = {},
  uniqueKey = null,
}) {
  try {
    // --------------------------------------------------------
    // Basic validation
    // --------------------------------------------------------

    if (!recipient) {
      console.error("Notification error: recipient is required");
      return null;
    }

    if (!type) {
      console.error("Notification error: type is required");
      return null;
    }

    if (!title || !message) {
      console.error(
        "Notification error: title and message are required"
      );
      return null;
    }

    // --------------------------------------------------------
    // Prevent duplicate notifications
    // --------------------------------------------------------

    if (uniqueKey) {
      const existingNotification = await Notification.findOne({
        recipient,
        uniqueKey,
      });

      if (existingNotification) {
        return existingNotification;
      }
    }

    // --------------------------------------------------------
    // Create notification
    // --------------------------------------------------------

    const notification = new Notification({
      recipient,
      sender,
      senderName,
      type,
      category,
      title,
      message,
      icon,
      relatedId,
      relatedModel,
      link,
      metadata,
      uniqueKey,
      isRead: false,
    });

    await notification.save();

    return notification;
  } catch (error) {
    // --------------------------------------------------------
    // IMPORTANT:
    // Notification failure should NEVER break the main
    // application functionality.
    // --------------------------------------------------------

    console.error("Error creating notification:", error);

    return null;
  }
}

// ============================================================
// COMMUNITY NOTIFICATIONS
// ============================================================

// Someone liked a user's post
async function notifyPostLike({
  postOwnerId,
  senderId,
  senderName,
  postId,
}) {
  // Don't notify users when they like their own post
  if (
    postOwnerId &&
    senderId &&
    postOwnerId.toString() === senderId.toString()
  ) {
    return null;
  }

  return createNotification({
    recipient: postOwnerId,
    sender: senderId,
    senderName,
    type: "post_like",
    category: "community",
    title: "Someone liked your post",
    message: `${senderName || "A farmer"} liked your forum post.`,
    icon: "heart",
    relatedId: postId,
    relatedModel: "ForumPost",
    link: "/dashboard/community",
  });
}

// Someone replied to a user's post
async function notifyPostReply({
  postOwnerId,
  senderId,
  senderName,
  postId,
  postTitle,
}) {
  if (
    postOwnerId &&
    senderId &&
    postOwnerId.toString() === senderId.toString()
  ) {
    return null;
  }

  return createNotification({
    recipient: postOwnerId,
    sender: senderId,
    senderName,
    type: "post_reply",
    category: "community",
    title: "New reply to your post",
    message: `${senderName || "A farmer"} replied to "${postTitle}".`,
    icon: "message",
    relatedId: postId,
    relatedModel: "ForumPost",
    link: "/dashboard/community",
  });
}

// Someone liked a reply
async function notifyReplyLike({
  replyOwnerId,
  senderId,
  senderName,
  postId,
  replyId,
}) {
  if (
    replyOwnerId &&
    senderId &&
    replyOwnerId.toString() === senderId.toString()
  ) {
    return null;
  }

  return createNotification({
    recipient: replyOwnerId,
    sender: senderId,
    senderName,
    type: "reply_like",
    category: "community",
    title: "Someone liked your reply",
    message: `${senderName || "A farmer"} liked your reply.`,
    icon: "heart",
    relatedId: replyId,
    relatedModel: "ForumReply",
    link: "/dashboard/community",
    metadata: {
      postId,
    },
  });
}

// ============================================================
// FORUM MODERATION NOTIFICATIONS
// ============================================================

async function notifyForumWarning({
  userId,
  warningNumber,
}) {
  return createNotification({
    recipient: userId,
    type: "forum_warning",
    category: "community",
    title: "Community guideline warning",
    message: `Your forum activity received warning ${warningNumber}. Please follow the community guidelines.`,
    icon: "alert",
    link: "/dashboard/community",
    metadata: {
      warningNumber,
    },
  });
}

async function notifyForumSuspension({
  userId,
  blockedUntil,
  warnings,
}) {
  return createNotification({
    recipient: userId,
    type: "forum_suspension",
    category: "community",
    title: "Forum access temporarily suspended",
    message:
      "Your forum posting and commenting access has been temporarily suspended for 7 days.",
    icon: "clock",
    link: "/dashboard/community",
    metadata: {
      blockedUntil,
      warnings,
    },
  });
}

async function notifyForumBanned({
  userId,
  warnings,
}) {
  return createNotification({
    recipient: userId,
    type: "forum_banned",
    category: "community",
    title: "Forum access permanently suspended",
    message:
      "Your forum posting and commenting access has been permanently suspended due to repeated community guideline violations.",
    icon: "ban",
    link: "/dashboard/community",
    metadata: {
      warnings,
    },
  });
}

async function notifyForumSuspensionEnded({
  userId,
}) {
  return createNotification({
    recipient: userId,
    type: "forum_suspension_ended",
    category: "community",
    title: "Forum access restored",
    message:
      "Your temporary forum suspension has ended. You can now post and comment again.",
    icon: "check",
    link: "/dashboard/community",
  });
}

// ============================================================
// GAMIFICATION NOTIFICATIONS
// ============================================================

async function notifyBadgeEarned({
  userId,
  badgeName,
  badgeId = null,
}) {
  return createNotification({
    recipient: userId,
    type: "badge_earned",
    category: "gamification",
    title: "🏆 New badge earned!",
    message: `Congratulations! You earned the "${badgeName}" badge.`,
    icon: "trophy",
    relatedId: badgeId,
    relatedModel: badgeId ? "Badge" : null,
    link: "/dashboard/achievements",
    metadata: {
      badgeName,
    },
  });
}

async function notifyStreak({
  userId,
  streakDays,
}) {
  return createNotification({
    recipient: userId,
    type: "streak",
    category: "gamification",
    title: "🔥 Keep your streak going!",
    message: `You have maintained your farming activity streak for ${streakDays} day(s).`,
    icon: "flame",
    link: "/dashboard/achievements",
    metadata: {
      streakDays,
    },
  });
}

async function notifyStreakMilestone({
  userId,
  streakDays,
}) {
  return createNotification({
    recipient: userId,
    type: "streak_milestone",
    category: "gamification",
    title: `🔥 ${streakDays}-day streak!`,
    message: `Amazing! You reached a ${streakDays}-day activity streak.`,
    icon: "flame",
    link: "/dashboard/achievements",
    metadata: {
      streakDays,
    },
  });
}

async function notifyXpEarned({
  userId,
  xp,
  reason = "FarmAI activity",
}) {
  return createNotification({
    recipient: userId,
    type: "xp_earned",
    category: "gamification",
    title: "⭐ XP earned!",
    message: `You earned ${xp} XP for ${reason}.`,
    icon: "star",
    link: "/dashboard/achievements",
    metadata: {
      xp,
      reason,
    },
  });
}

async function notifyLevelUp({
  userId,
  level,
}) {
  return createNotification({
    recipient: userId,
    type: "level_up",
    category: "gamification",
    title: "🎉 Level up!",
    message: `Congratulations! You reached Level ${level}.`,
    icon: "trophy",
    link: "/dashboard/achievements",
    metadata: {
      level,
    },
  });
}

// ============================================================
// GENERAL FARMING NOTIFICATIONS
// ============================================================

async function notifyWeatherAlert({
  userId,
  title,
  message,
  metadata = {},
}) {
  return createNotification({
    recipient: userId,
    type: "weather_alert",
    category: "farming",
    title,
    message,
    icon: "cloud-rain",
    link: "/dashboard/weather-alerts",
    metadata,
  });
}

async function notifyCropTask({
  userId,
  title,
  message,
  taskId = null,
}) {
  return createNotification({
    recipient: userId,
    type: "crop_task",
    category: "farming",
    title,
    message,
    icon: "calendar",
    relatedId: taskId,
    relatedModel: taskId ? "CropTask" : null,
    link: "/dashboard/crop-calendar",
  });
}

async function notifyMarketUpdate({
  userId,
  title,
  message,
  metadata = {},
}) {
  return createNotification({
    recipient: userId,
    type: "market_update",
    category: "farming",
    title,
    message,
    icon: "trending-up",
    link: "/dashboard/market-prices",
    metadata,
  });
}

async function notifyAgriNews({
  userId,
  title,
  message,
  link = "/dashboard/news",
}) {
  return createNotification({
    recipient: userId,
    type: "agri_news",
    category: "farming",
    title,
    message,
    icon: "newspaper",
    link,
  });
}

async function notifySoilReminder({
  userId,
  title,
  message,
}) {
  return createNotification({
    recipient: userId,
    type: "soil_reminder",
    category: "farming",
    title,
    message,
    icon: "beaker",
    link: "/dashboard/soil-report",
  });
}

// ============================================================
// SYSTEM NOTIFICATION
// ============================================================

async function notifySystem({
  userId,
  title,
  message,
  link = "",
  metadata = {},
}) {
  return createNotification({
    recipient: userId,
    type: "system",
    category: "system",
    title,
    message,
    icon: "bell",
    link,
    metadata,
  });
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createNotification,

  // Community
  notifyPostLike,
  notifyPostReply,
  notifyReplyLike,

  // Moderation
  notifyForumWarning,
  notifyForumSuspension,
  notifyForumBanned,
  notifyForumSuspensionEnded,

  // Gamification
  notifyBadgeEarned,
  notifyStreak,
  notifyStreakMilestone,
  notifyXpEarned,
  notifyLevelUp,

  // Farming
  notifyWeatherAlert,
  notifyCropTask,
  notifyMarketUpdate,
  notifyAgriNews,
  notifySoilReminder,

  // System
  notifySystem,
};