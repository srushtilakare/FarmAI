// backend/scripts/repairTaskStreaks.js

const mongoose = require("mongoose");
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});

const UserScore = require("../models/UserScore");
const UserActivity = require("../models/UserActivity");

// =========================================================
// MONGODB CONNECTION
// =========================================================

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/farmAI";

// =========================================================
// HELPERS
// =========================================================

// We use India time because FarmAI is being used with
// calendar-day based streaks and the application is in India.

function getIndiaDateKey(date) {
  const value = new Date(date);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function dateKeyToUtcDate(dateKey) {
  // dateKey = YYYY-MM-DD
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function differenceInDays(dateKey1, dateKey2) {
  const d1 = dateKeyToUtcDate(dateKey1);
  const d2 = dateKeyToUtcDate(dateKey2);

  return Math.round(
    (d1.getTime() - d2.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

// =========================================================
// MAIN REPAIR
// =========================================================

async function repairTaskStreaks() {
  try {
    console.log("==============================================");
    console.log(" FarmAI Task Streak Repair");
    console.log("==============================================");
    console.log("");

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log("");

    // -----------------------------------------------------
    // Get ALL task-completion activities
    // -----------------------------------------------------

    const taskActivities =
      await UserActivity.find({
        activityType: "crop-calendar",
        $or: [
          {
            "metadata.action":
              "task_completed",
          },
          {
            title: /^Task Completed - /i,
          },
        ],
      })
        .select(
          "userId title metadata createdAt"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    console.log(
      `Found ${taskActivities.length} task-completion activities.`
    );

    console.log("");

    // -----------------------------------------------------
    // Group task completion dates by user
    // -----------------------------------------------------

    const userDates = new Map();

    for (const activity of taskActivities) {
      if (!activity.userId) {
        continue;
      }

      const userId =
        String(activity.userId);

      const dateKey =
        getIndiaDateKey(
          activity.createdAt
        );

      if (!userDates.has(userId)) {
        userDates.set(
          userId,
          new Map()
        );
      }

      const dateMap =
        userDates.get(userId);

      /*
       * Multiple tasks on the same calendar day
       * count as ONE streak day.
       */
      if (!dateMap.has(dateKey)) {
        dateMap.set(
          dateKey,
          activity.createdAt
        );
      }
    }

    // -----------------------------------------------------
    // Get all UserScore documents
    // -----------------------------------------------------

    const scores =
      await UserScore.find({});

    console.log(
      `Found ${scores.length} UserScore documents.`
    );

    console.log("");
    console.log(
      "Starting streak recalculation..."
    );
    console.log(
      "----------------------------------------------"
    );

    let updatedCount = 0;

    // -----------------------------------------------------
    // Recalculate every user's task streak
    // -----------------------------------------------------

    for (const score of scores) {
      const userId =
        String(score.userId);

      const dateMap =
        userDates.get(userId);

      // ---------------------------------------------------
      // User has never completed a task
      // ---------------------------------------------------

      if (!dateMap || dateMap.size === 0) {
        const oldCurrent =
          Number(
            score.streaks?.currentTaskStreak ||
              0
          );

        const oldLongest =
          Number(
            score.streaks?.longestTaskStreak ||
              0
          );

        const oldLast =
          score.streaks
            ?.lastTaskCompletionDate;

        if (
          oldCurrent !== 0 ||
          oldLongest !== 0 ||
          oldLast
        ) {
          score.streaks.currentTaskStreak = 0;
          score.streaks.longestTaskStreak = 0;
          score.streaks.lastTaskCompletionDate =
            null;

          await score.save();

          updatedCount++;

          console.log(
            `${userId}:  ${oldCurrent} / ${oldLongest}  →  0 / 0`
          );
        }

        continue;
      }

      // ---------------------------------------------------
      // Get unique task-completion dates
      // ---------------------------------------------------

      const dates = Array.from(
        dateMap.keys()
      ).sort();

      // ---------------------------------------------------
      // Calculate longest streak
      // ---------------------------------------------------

      let longestStreak = 1;
      let runningStreak = 1;

      for (
        let i = 1;
        i < dates.length;
        i++
      ) {
        const difference =
          differenceInDays(
            dates[i],
            dates[i - 1]
          );

        if (difference === 1) {
          runningStreak++;

          longestStreak =
            Math.max(
              longestStreak,
              runningStreak
            );
        } else {
          runningStreak = 1;
        }
      }

      // ---------------------------------------------------
      // Calculate current streak
      // ---------------------------------------------------

      /*
       * Current streak is the consecutive sequence
       * ending on the user's most recent task day.
       *
       * Multiple tasks on that same day still count
       * as only one streak day.
       */

      let currentStreak = 1;

      for (
        let i = dates.length - 1;
        i > 0;
        i--
      ) {
        const difference =
          differenceInDays(
            dates[i],
            dates[i - 1]
          );

        if (difference === 1) {
          currentStreak++;
        } else {
          break;
        }
      }

      // ---------------------------------------------------
      // Latest task timestamp
      // ---------------------------------------------------

      const latestDateKey =
        dates[dates.length - 1];

      const latestTimestamp =
        dateMap.get(
          latestDateKey
        );

      // ---------------------------------------------------
      // Save ONLY task streak fields
      // ---------------------------------------------------

      const oldCurrent =
        Number(
          score.streaks?.currentTaskStreak ||
            0
        );

      const oldLongest =
        Number(
          score.streaks?.longestTaskStreak ||
            0
        );

      score.streaks.currentTaskStreak =
        currentStreak;

      score.streaks.longestTaskStreak =
        longestStreak;

      score.streaks.lastTaskCompletionDate =
        latestTimestamp;

      await score.save();

      updatedCount++;

      console.log(
        `${userId}:  ${oldCurrent} / ${oldLongest}  →  ${currentStreak} / ${longestStreak}`
      );

      console.log(
        `   Task days: ${dates.length}`
      );

      console.log(
        `   Latest task: ${latestDateKey}`
      );

      console.log("");
    }

    // -----------------------------------------------------
    // DONE
    // -----------------------------------------------------

    console.log(
      "----------------------------------------------"
    );

    console.log(
      `✅ Repaired ${updatedCount} UserScore documents.`
    );

    console.log("");

    console.log(
      "IMPORTANT:"
    );

    console.log(
      "Only task-streak fields were recalculated."
    );

    console.log(
      "XP, task counts, login streaks, badges,"
    );

    console.log(
      "levels and other gamification statistics"
    );

    console.log(
      "were NOT intentionally changed."
    );

    console.log("");

    console.log(
      "Task streak repair completed successfully."
    );

    console.log(
      "=============================================="
    );
  } catch (error) {
    console.error("");
    console.error(
      "❌ Task streak repair failed:"
    );
    console.error(error);
    console.error("");
  } finally {
    await mongoose.disconnect();
    console.log(
      "MongoDB connection closed."
    );
  }
}

// =========================================================
// RUN
// =========================================================

repairTaskStreaks();