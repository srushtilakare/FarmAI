/* eslint-env node */

const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

// ============================================================
// GET ALL NOTIFICATIONS FOR CURRENT USER
// ============================================================

router.get("/", auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 30,
      category,
    } = req.query;

    const query = {
      recipient: req.user._id,
    };

    // Optional category filter
    if (
      category &&
      ["community", "gamification", "farming", "system"].includes(category)
    ) {
      query.category = category;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate("sender", "fullName profilePhoto");

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      notifications,
      unreadCount,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
});

// ============================================================
// GET UNREAD NOTIFICATION COUNT
// ============================================================

router.get("/unread-count", auth, async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);

    res.status(500).json({
      success: false,
      error: "Failed to fetch unread notification count",
    });
  }
});

// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

router.patch("/:notificationId/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();

      await notification.save();
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);

    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
});

// ============================================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================================

router.patch("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);

    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
});

// ============================================================
// DELETE ONE NOTIFICATION
// ============================================================

router.delete("/:notificationId", auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.notificationId,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);

    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
});

// ============================================================
// DELETE ALL READ NOTIFICATIONS
// ============================================================

router.delete("/read/all", auth, async (req, res) => {
  try {
    await Notification.deleteMany({
      recipient: req.user._id,
      isRead: true,
    });

    res.json({
      success: true,
      message: "Read notifications deleted",
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);

    res.status(500).json({
      success: false,
      error: "Failed to delete read notifications",
    });
  }
});

module.exports = router;