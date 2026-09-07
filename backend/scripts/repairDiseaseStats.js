// backend/scripts/repairDiseaseStats.js

const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const UserScore = require("../models/UserScore");
const UserActivity = require("../models/UserActivity");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/farmAI";

async function repairDiseaseStats() {
  try {
    console.log("==============================================");
    console.log(" FarmAI Disease Achievement Repair");
    console.log("==============================================");
    console.log("");

    console.log("Connecting to MongoDB...");

    await mongoose.connect(MONGO_URI);

    console.log("✅ MongoDB connected");
    console.log("");

    // -----------------------------------------------------
    // Find all disease detection activities
    // -----------------------------------------------------

    const diseaseActivities =
      await UserActivity.find({
        activityType: "disease-detection",
      })
        .select("userId createdAt")
        .lean();

    console.log(
      `Found ${diseaseActivities.length} disease-detection activities.`
    );
    console.log("");

    // -----------------------------------------------------
    // Count disease detections per user
    // -----------------------------------------------------

    const countsByUser = new Map();

    for (const activity of diseaseActivities) {
      if (!activity.userId) {
        continue;
      }

      const userId = String(activity.userId);

      countsByUser.set(
        userId,
        (countsByUser.get(userId) || 0) + 1
      );
    }

    // -----------------------------------------------------
    // Get all UserScore documents
    // -----------------------------------------------------

    const scores = await UserScore.find({});

    console.log(
      `Found ${scores.length} UserScore documents.`
    );
    console.log("");

    let updatedCount = 0;

    // -----------------------------------------------------
    // Repair diseaseUploads
    // -----------------------------------------------------

    for (const score of scores) {
      const userId = String(score.userId);

      const actualCount =
        countsByUser.get(userId) || 0;

      const oldCount =
        Number(score.stats.diseaseUploads || 0);

      if (oldCount === actualCount) {
        console.log(
          `${userId}: already correct (${actualCount})`
        );
        continue;
      }

      score.stats.diseaseUploads = actualCount;

      await score.save();

      updatedCount++;

      console.log(
        `${userId}: diseaseUploads ${oldCount} → ${actualCount}`
      );
    }

    console.log("");
    console.log("----------------------------------------------");
    console.log(
      `✅ Repaired ${updatedCount} UserScore documents.`
    );
    console.log("----------------------------------------------");
    console.log("");

    console.log(
      "Only stats.diseaseUploads was recalculated."
    );
    console.log(
      "XP, task counts, login streaks, task streaks,"
    );
    console.log(
      "soil, weather, forum, badges and levels"
    );
    console.log(
      "were not intentionally changed."
    );

    console.log("");
    console.log("Disease achievement repair completed.");
    console.log("==============================================");
  } catch (error) {
    console.error("");
    console.error(
      "❌ Disease stats repair failed:"
    );
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log("");
    console.log("MongoDB connection closed.");
  }
}

repairDiseaseStats();