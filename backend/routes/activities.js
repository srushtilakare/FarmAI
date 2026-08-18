const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

const UserActivity = require("../models/UserActivity");
const User = require("../models/User");
const auth = require("../middleware/auth");

/*
|--------------------------------------------------------------------------
| Helper: Convert user ID safely to ObjectId
|--------------------------------------------------------------------------
*/
function toObjectId(userId) {
  if (!userId) return null;

  if (userId instanceof mongoose.Types.ObjectId) {
    return userId;
  }

  if (mongoose.Types.ObjectId.isValid(userId)) {
    return new mongoose.Types.ObjectId(userId);
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| Helper: Log Activity
|--------------------------------------------------------------------------
|
| This function is used by:
| - Crop Advisory
| - Weather
| - Soil Report
| - Crop Calendar
| - Market Prices
| - Disease Detection
| - Forum
| - Chatbot
| - etc.
|
| IMPORTANT:
| We do NOT call user.save() here.
| Calling user.save() validates the complete User document and can cause
| errors such as:
|
| User validation failed: mpin: Path `mpin` is required.
|
| Instead, gamification data is updated directly using MongoDB collection
| operations, so activity logging cannot fail because of unrelated
| User model validation.
|--------------------------------------------------------------------------
*/

async function logActivity(userId, activityData) {
  try {
    if (!userId) {
      console.log("⚠️ Activity logging skipped - no userId provided");
      return null;
    }

    const userIdObj = toObjectId(userId);

    if (!userIdObj) {
      console.error("❌ Invalid userId for activity logging:", userId);
      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | 1. Create activity record
    |--------------------------------------------------------------------------
    */

    const activity = new UserActivity({
      userId: userIdObj,
      ...activityData,
    });

    const saved = await activity.save();

    /*
    |--------------------------------------------------------------------------
    | 2. Update gamification
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Do NOT use:
    |
    | const user = await User.findById(...)
    | user.save()
    |
    | because that triggers complete User schema validation.
    |
    | We use the native MongoDB collection instead.
    |--------------------------------------------------------------------------
    */

    try {
      const typeMap = {
        "community-forum": "communityHelper",
        "disease-detection": "diseaseDetector",
        "soil-report": "soilMaster",
      };

      const achievementKey =
        typeMap[activityData.activityType];

      /*
      |--------------------------------------------------------------------------
      | Only update gamification for activity types that have achievements.
      |--------------------------------------------------------------------------
      */

      if (achievementKey) {
        const userCollection = User.collection;

        /*
        |--------------------------------------------------------------------------
        | Get current gamification data.
        |
        | Using native collection avoids Mongoose validation.
        |--------------------------------------------------------------------------
        */

        const user = await userCollection.findOne(
          { _id: userIdObj },
          {
            projection: {
              gamification: 1,
            },
          }
        );

        if (user) {
          const existingGamification =
            user.gamification || {};

          const existingAchievements =
            existingGamification.achievements || {};

          const existingAchievement =
            existingAchievements[achievementKey] || {};

          const current =
            Number(existingAchievement.current) || 0;

          const target =
            Number(existingAchievement.target) ||
            (
              achievementKey === "communityHelper"
                ? 25
                : achievementKey === "diseaseDetector"
                ? 20
                : achievementKey === "soilMaster"
                ? 5
                : 10
            );

          const newCurrent = current + 1;

          const completed =
            newCurrent >= target;

          /*
          |--------------------------------------------------------------------------
          | Update achievement directly in MongoDB.
          |--------------------------------------------------------------------------
          */

          await userCollection.updateOne(
            { _id: userIdObj },
            {
              $set: {
                [`gamification.achievements.${achievementKey}`]: {
                  current: newCurrent,
                  target,
                  completed,
                },
              },
            }
          );

          /*
          |--------------------------------------------------------------------------
          | Add recent activity
          |--------------------------------------------------------------------------
          */

          await userCollection.updateOne(
            { _id: userIdObj },
            {
              $push: {
                "gamification.recentActivities": {
                  $each: [
                    {
                      activityType:
                        activityData.activityType,

                      description:
                        activityData.description || "",

                      points: 10,

                      date: new Date(),
                    },
                  ],

                  $slice: -10,
                },
              },
            }
          );

          console.log(
            `🎮 Gamification updated: ${achievementKey} ${newCurrent}/${target}`
          );
        }
      }
    } catch (gamificationError) {
      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      | Gamification failure must NEVER break activity logging.
      |--------------------------------------------------------------------------
      */

      console.error(
        "⚠️ Gamification update failed:",
        gamificationError.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | 3. Activity successfully logged
    |--------------------------------------------------------------------------
    */

    console.log("✅ Activity logged:", {
      id: saved._id,
      type: saved.activityType,
      title: saved.title,
      userId: saved.userId,
    });

    return saved;
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Activity logging should NEVER break the main feature.
    |--------------------------------------------------------------------------
    */

    console.error(
      "❌ Error logging activity:",
      error.message
    );

    console.error("Activity data:", {
      userId,
      activityData,
    });

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| Helper: Extract user ID from optional JWT
|--------------------------------------------------------------------------
*/

async function getUserIdFromRequest(req) {
  try {
    /*
    |--------------------------------------------------------------------------
    | If auth middleware already ran, use req.user first.
    |--------------------------------------------------------------------------
    */

    if (req.user && req.user._id) {
      return req.user._id;
    }

    const token =
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "farmai_secret"
    );

    return decoded.id || null;
  } catch (error) {
    console.log(
      "⚠️ Could not extract user ID from request"
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/activities
|--------------------------------------------------------------------------
| Get user's activity history
|--------------------------------------------------------------------------
*/

router.get("/", auth, async (req, res) => {
  try {
    const {
      type,
      limit = 50,
      page = 1,
    } = req.query;

    const userIdObj = toObjectId(req.user._id);

    if (!userIdObj) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const parsedLimit = Math.min(
      Math.max(parseInt(limit, 10) || 50, 1),
      100
    );

    const parsedPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const query = {
      userId: userIdObj,
    };

    if (type && type !== "all") {
      query.activityType = type;
    }

    console.log(
      "🔍 Query:",
      JSON.stringify(query)
    );

    const activities =
      await UserActivity.find(query)
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .skip((parsedPage - 1) * parsedLimit)
        .populate(
          "relatedId",
          "title name schemeName"
        )
        .lean();

    const total =
      await UserActivity.countDocuments(query);

    /*
    |--------------------------------------------------------------------------
    | Format activities for frontend
    |--------------------------------------------------------------------------
    */

    const formattedActivities =
      activities.map((activity) => ({
        id: activity._id.toString(),

        type: activity.activityType,

        title: activity.title,

        description:
          activity.description || "",

        date: activity.createdAt
          ? activity.createdAt
              .toISOString()
              .split("T")[0]
          : "",

        time: activity.createdAt
          ? activity.createdAt
              .toTimeString()
              .split(" ")[0]
              .substring(0, 5)
          : "",

        status: activity.status,

        result: activity.result || "",

        metadata: activity.metadata || {},

        relatedId: activity.relatedId
          ? activity.relatedId._id
            ? activity.relatedId._id.toString()
            : activity.relatedId.toString()
          : null,
      }));

    res.json({
      success: true,
      activities: formattedActivities,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(
        total / parsedLimit
      ),
    });
  } catch (error) {
    console.error(
      "❌ Error fetching activities:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch activities",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET /api/activities/stats
|--------------------------------------------------------------------------
| Get activity statistics
|--------------------------------------------------------------------------
*/

router.get("/stats", auth, async (req, res) => {
  try {
    const userIdObj = toObjectId(
      req.user._id
    );

    if (!userIdObj) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID",
      });
    }

    const stats =
      await UserActivity.aggregate([
        {
          $match: {
            userId: userIdObj,
          },
        },

        {
          $group: {
            _id: "$activityType",
            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const statsMap = {};

    stats.forEach((stat) => {
      statsMap[stat._id] =
        stat.count;
    });

    res.json({
      success: true,
      stats: statsMap,
    });
  } catch (error) {
    console.error(
      "❌ Error fetching activity stats:",
      error
    );

    res.status(500).json({
      success: false,
      error: "Failed to fetch stats",
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/activities/log
|--------------------------------------------------------------------------
| Log activity from frontend
|--------------------------------------------------------------------------
*/

router.post("/log", auth, async (req, res) => {
  try {
    const {
      activityType,
      title,
      description,
      status,
      result,
      metadata,
    } = req.body;

    console.log(
      "📝 Log activity request:",
      {
        userId: req.user._id,

        activityType,

        title,

        description: description
          ? description.substring(0, 100)
          : "NO DESCRIPTION",

        descriptionLength:
          description
            ? description.length
            : 0,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Validate activity type
    |--------------------------------------------------------------------------
    */

    if (
      !activityType ||
      typeof activityType !== "string" ||
      !activityType.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "activityType is required and must be a non-empty string",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate title
    |--------------------------------------------------------------------------
    */

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "title is required and must be a non-empty string",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Validate description
    |--------------------------------------------------------------------------
    */

    if (
      !description ||
      typeof description !== "string" ||
      !description.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "description is required and must be a non-empty string",
      });
    }

    const trimmedActivityType =
      activityType.trim();

    const trimmedTitle =
      title.trim();

    const trimmedDescription =
      description.trim();

    console.log(
      "📝 Calling logActivity with:",
      {
        userId: req.user._id,

        activityType:
          trimmedActivityType,

        title: trimmedTitle,

        description:
          trimmedDescription.substring(
            0,
            50
          ) + "...",

        descriptionLength:
          trimmedDescription.length,
      }
    );

    const activity =
      await logActivity(
        req.user._id,
        {
          activityType:
            trimmedActivityType,

          title:
            trimmedTitle,

          description:
            trimmedDescription,

          status:
            status || "completed",

          result:
            result || "",

          metadata:
            metadata || {},
        }
      );

    /*
    |--------------------------------------------------------------------------
    | Success
    |--------------------------------------------------------------------------
    */

    if (activity) {
      console.log(
        "✅ Activity logged successfully via /log endpoint:",
        {
          id: activity._id,
          type: activity.activityType,
          title: activity.title,
        }
      );

      return res.json({
        success: true,

        message:
          "Activity logged successfully",

        activity: {
          id: activity._id,

          type:
            activity.activityType,

          title:
            activity.title,
        },
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Failure
    |--------------------------------------------------------------------------
    */

    console.error(
      "❌ Failed to log activity - logActivity returned null."
    );

    return res.status(500).json({
      success: false,

      error:
        "Failed to save activity to database. Check server logs for details.",
    });
  } catch (error) {
    console.error(
      "❌ Error logging activity:",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| POST /api/activities/test
|--------------------------------------------------------------------------
| Test activity logging
|--------------------------------------------------------------------------
*/

router.post("/test", auth, async (req, res) => {
  try {
    const testActivity =
      await logActivity(
        req.user._id,
        {
          activityType: "chat",

          title:
            "Test Activity",

          description:
            "This is a test activity to verify logging works",

          status:
            "completed",

          result:
            "Test successful",

          metadata: {
            test: true,
          },
        }
      );

    if (!testActivity) {
      return res.status(500).json({
        success: false,
        message:
          "Test activity could not be created",
      });
    }

    res.json({
      success: true,

      message:
        "Test activity created",

      activity:
        testActivity,
    });
  } catch (error) {
    console.error(
      "❌ Error creating test activity:",
      error
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  router,
  logActivity,
  getUserIdFromRequest,
};