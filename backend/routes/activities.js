const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

const UserActivity = require("../models/UserActivity");
const UserScore = require("../models/UserScore");
const auth = require("../middleware/auth");

/*
|--------------------------------------------------------------------------
| HELPER: CONVERT USER ID TO OBJECT ID
|--------------------------------------------------------------------------
*/

function toObjectId(userId) {
  if (!userId) {
    return null;
  }

  if (userId instanceof mongoose.Types.ObjectId) {
    return userId;
  }

  if (
    mongoose.Types.ObjectId.isValid(userId)
  ) {
    return new mongoose.Types.ObjectId(
      userId
    );
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| GAMIFICATION POINTS
|--------------------------------------------------------------------------
*/

const GAMIFICATION_POINTS = {
  login: 5,
  consecutive_login: 10,
  task_completed: 15,
  disease_upload: 20,
  soil_upload: 30,
  weather_check: 3,
  forum_post: 10,
  forum_reply: 8,
  helpful_reply: 15,
  news_read: 2
};

/*
|--------------------------------------------------------------------------
| LEVELS
|--------------------------------------------------------------------------
*/

const LEVELS = [
  {
    level: 1,
    name: "Seedling",
    minPoints: 0
  },
  {
    level: 2,
    name: "Growing Farmer",
    minPoints: 100
  },
  {
    level: 3,
    name: "Skilled Farmer",
    minPoints: 300
  },
  {
    level: 4,
    name: "Expert Farmer",
    minPoints: 600
  },
  {
    level: 5,
    name: "Master Farmer",
    minPoints: 1000
  },
  {
    level: 6,
    name: "Agriculture Expert",
    minPoints: 1500
  },
  {
    level: 7,
    name: "Agriculture Champion",
    minPoints: 2500
  },
  {
    level: 8,
    name: "Agriculture Legend",
    minPoints: 5000
  }
];

/*
|--------------------------------------------------------------------------
| ACHIEVEMENT TARGETS
|--------------------------------------------------------------------------
*/

const ACHIEVEMENT_TARGETS = {
  expertAdviser: 50,
  activeFarmer: 30,
  diseaseDetector: 20,
  soilMaster: 5,
  weatherWatcher: 100,
  communityHelper: 25
};

/*
|--------------------------------------------------------------------------
| DATE HELPERS
|--------------------------------------------------------------------------
*/

/*
 * Convert a date to local calendar-day midnight.
 */
function startOfDay(date = new Date()) {
  const result = new Date(date);

  result.setHours(
    0,
    0,
    0,
    0
  );

  return result;
}

/*
 * Difference between two calendar days.
 */
function calendarDayDifference(
  newerDate,
  olderDate
) {
  const newer =
    startOfDay(newerDate);

  const older =
    startOfDay(olderDate);

  return Math.round(
    (
      newer.getTime() -
      older.getTime()
    ) /
    (
      1000 *
      60 *
      60 *
      24
    )
  );
}

/*
|--------------------------------------------------------------------------
| ENSURE ACHIEVEMENT STRUCTURE
|--------------------------------------------------------------------------
*/

function ensureAchievementStructure(
  userScore
) {
  if (!userScore.achievements) {
    userScore.achievements = {};
  }

  const defaults = {
    expertAdviser: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.expertAdviser,
      completed: false
    },

    activeFarmer: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.activeFarmer,
      completed: false
    },

    diseaseDetector: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.diseaseDetector,
      completed: false
    },

    soilMaster: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.soilMaster,
      completed: false
    },

    weatherWatcher: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.weatherWatcher,
      completed: false
    },

    communityHelper: {
      current: 0,
      target:
        ACHIEVEMENT_TARGETS.communityHelper,
      completed: false
    }
  };

  Object.keys(defaults).forEach(
    (key) => {
      if (
        !userScore.achievements[key]
      ) {
        userScore.achievements[key] = {
          ...defaults[key]
        };

        return;
      }

      if (
        typeof userScore
          .achievements[key]
          .current !== "number"
      ) {
        userScore.achievements[key]
          .current = 0;
      }

      userScore.achievements[key]
        .target =
        ACHIEVEMENT_TARGETS[key];

      userScore.achievements[key]
        .completed =
        userScore.achievements[key]
          .current >=
        ACHIEVEMENT_TARGETS[key];
    }
  );
}

/*
|--------------------------------------------------------------------------
| INCREMENT ACHIEVEMENT
|--------------------------------------------------------------------------
*/

function incrementAchievement(
  userScore,
  achievementKey,
  amount = 1
) {
  ensureAchievementStructure(
    userScore
  );

  if (
    !userScore.achievements[
      achievementKey
    ]
  ) {
    return;
  }

  const achievement =
    userScore.achievements[
      achievementKey
    ];

  achievement.current =
    Number(
      achievement.current || 0
    ) + Number(amount || 0);

  achievement.target =
    ACHIEVEMENT_TARGETS[
      achievementKey
    ];

  achievement.completed =
    achievement.current >=
    achievement.target;
}

/*
|--------------------------------------------------------------------------
| SYNCHRONIZE ACHIEVEMENTS
|--------------------------------------------------------------------------
*/

function synchronizeAchievements(
  userScore
) {
  ensureAchievementStructure(
    userScore
  );

  /*
  |--------------------------------------------------------------------------
  | Active Farmer
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .activeFarmer.current =
    Number(
      userScore.streaks
        ?.currentLoginStreak || 0
    );

  userScore.achievements
    .activeFarmer.target =
    ACHIEVEMENT_TARGETS.activeFarmer;

  userScore.achievements
    .activeFarmer.completed =
    userScore.achievements
      .activeFarmer.current >=
    ACHIEVEMENT_TARGETS.activeFarmer;

  /*
  |--------------------------------------------------------------------------
  | Disease Detector
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .diseaseDetector.current =
    Number(
      userScore.stats
        ?.diseaseUploads || 0
    );

  userScore.achievements
    .diseaseDetector.target =
    ACHIEVEMENT_TARGETS.diseaseDetector;

  userScore.achievements
    .diseaseDetector.completed =
    userScore.achievements
      .diseaseDetector.current >=
    ACHIEVEMENT_TARGETS.diseaseDetector;

  /*
  |--------------------------------------------------------------------------
  | Soil Master
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .soilMaster.current =
    Number(
      userScore.stats
        ?.soilReportsUploaded || 0
    );

  userScore.achievements
    .soilMaster.target =
    ACHIEVEMENT_TARGETS.soilMaster;

  userScore.achievements
    .soilMaster.completed =
    userScore.achievements
      .soilMaster.current >=
    ACHIEVEMENT_TARGETS.soilMaster;

  /*
  |--------------------------------------------------------------------------
  | Weather Watcher
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .weatherWatcher.current =
    Number(
      userScore.stats
        ?.weatherChecks || 0
    );

  userScore.achievements
    .weatherWatcher.target =
    ACHIEVEMENT_TARGETS.weatherWatcher;

  userScore.achievements
    .weatherWatcher.completed =
    userScore.achievements
      .weatherWatcher.current >=
    ACHIEVEMENT_TARGETS.weatherWatcher;

  /*
  |--------------------------------------------------------------------------
  | Community Helper
  |--------------------------------------------------------------------------
  |
  | Community Helper is based on forum POSTS.
  |
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .communityHelper.current =
    Number(
      userScore.stats
        ?.forumPosts || 0
    );

  userScore.achievements
    .communityHelper.target =
    ACHIEVEMENT_TARGETS.communityHelper;

  userScore.achievements
    .communityHelper.completed =
    userScore.achievements
      .communityHelper.current >=
    ACHIEVEMENT_TARGETS.communityHelper;

  /*
  |--------------------------------------------------------------------------
  | Expert Adviser
  |--------------------------------------------------------------------------
  */

  userScore.achievements
    .expertAdviser.current =
    Number(
      userScore.stats
        ?.helpfulReplies || 0
    );

  userScore.achievements
    .expertAdviser.target =
    ACHIEVEMENT_TARGETS.expertAdviser;

  userScore.achievements
    .expertAdviser.completed =
    userScore.achievements
      .expertAdviser.current >=
    ACHIEVEMENT_TARGETS.expertAdviser;
}

/*
|--------------------------------------------------------------------------
| GET OR CREATE USER SCORE
|--------------------------------------------------------------------------
*/

async function getOrCreateUserScore(
  userId
) {
  const userIdObj =
    toObjectId(userId);

  if (!userIdObj) {
    return null;
  }

  let userScore =
    await UserScore.findOne({
      userId: userIdObj
    });

  /*
  |--------------------------------------------------------------------------
  | CREATE FOR NEW USER
  |--------------------------------------------------------------------------
  */

  if (!userScore) {
    userScore =
      new UserScore({
        userId: userIdObj,

        totalPoints: 0,

        level: 1,

        levelName: "Seedling",

        stats: {
          totalLogins: 0,
          consecutiveLogins: 0,
          lastLoginDate: null,

          tasksCompleted: 0,

          diseaseUploads: 0,

          soilReportsUploaded: 0,

          weatherChecks: 0,

          forumPosts: 0,

          forumReplies: 0,

          helpfulReplies: 0
        },

        badges: [],

        recentActivities: [],

        streaks: {
          currentLoginStreak: 0,
          longestLoginStreak: 0,

          currentTaskStreak: 0,
          longestTaskStreak: 0,

          lastTaskCompletionDate: null
        },

        rank: null,

        achievements: {
          expertAdviser: {
            current: 0,
            target: 50,
            completed: false
          },

          activeFarmer: {
            current: 0,
            target: 30,
            completed: false
          },

          diseaseDetector: {
            current: 0,
            target: 20,
            completed: false
          },

          soilMaster: {
            current: 0,
            target: 5,
            completed: false
          },

          weatherWatcher: {
            current: 0,
            target: 100,
            completed: false
          },

          communityHelper: {
            current: 0,
            target: 25,
            completed: false
          }
        }
      });

    await userScore.save();
  }

  /*
  |--------------------------------------------------------------------------
  | EXISTING USER COMPATIBILITY
  |--------------------------------------------------------------------------
  */

  ensureAchievementStructure(
    userScore
  );

  /*
  |--------------------------------------------------------------------------
  | Make sure nested structures exist.
  |--------------------------------------------------------------------------
  */

  if (!userScore.stats) {
    userScore.stats = {};
  }

  if (!userScore.streaks) {
    userScore.streaks = {};
  }

  /*
  |--------------------------------------------------------------------------
  | Backward-compatible defaults
  |--------------------------------------------------------------------------
  */

  userScore.stats.totalLogins =
    Number(
      userScore.stats.totalLogins || 0
    );

  userScore.stats.consecutiveLogins =
    Number(
      userScore.stats.consecutiveLogins || 0
    );

  userScore.stats.tasksCompleted =
    Number(
      userScore.stats.tasksCompleted || 0
    );

  userScore.stats.diseaseUploads =
    Number(
      userScore.stats.diseaseUploads || 0
    );

  userScore.stats.soilReportsUploaded =
    Number(
      userScore.stats.soilReportsUploaded || 0
    );

  userScore.stats.weatherChecks =
    Number(
      userScore.stats.weatherChecks || 0
    );

  userScore.stats.forumPosts =
    Number(
      userScore.stats.forumPosts || 0
    );

  userScore.stats.forumReplies =
    Number(
      userScore.stats.forumReplies || 0
    );

  userScore.stats.helpfulReplies =
    Number(
      userScore.stats.helpfulReplies || 0
    );

  userScore.streaks.currentLoginStreak =
    Number(
      userScore.streaks
        .currentLoginStreak || 0
    );

  userScore.streaks.longestLoginStreak =
    Number(
      userScore.streaks
        .longestLoginStreak || 0
    );

  userScore.streaks.currentTaskStreak =
    Number(
      userScore.streaks
        .currentTaskStreak || 0
    );

  userScore.streaks.longestTaskStreak =
    Number(
      userScore.streaks
        .longestTaskStreak || 0
    );

  /*
  |--------------------------------------------------------------------------
  | Existing task streak compatibility
  |--------------------------------------------------------------------------
  */

  if (
    !userScore.streaks
      .lastTaskCompletionDate &&
    Array.isArray(
      userScore.recentActivities
    )
  ) {
    const latestTask =
      userScore.recentActivities.find(
        (activity) =>
          activity.activityType ===
          "task_completed"
      );

    if (
      latestTask?.date
    ) {
      userScore.streaks
        .lastTaskCompletionDate =
        latestTask.date;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Synchronize achievements
  |--------------------------------------------------------------------------
  */

  synchronizeAchievements(
    userScore
  );

  return userScore;
}

/*
|--------------------------------------------------------------------------
| CALCULATE LEVEL
|--------------------------------------------------------------------------
*/

function calculateLevel(
  points
) {
  for (
    let i = LEVELS.length - 1;
    i >= 0;
    i--
  ) {
    if (
      points >=
      LEVELS[i].minPoints
    ) {
      return {
        level:
          LEVELS[i].level,

        levelName:
          LEVELS[i].name
      };
    }
  }

  return {
    level: 1,
    levelName: "Seedling"
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE LOGIN STREAK
|--------------------------------------------------------------------------
*/

function updateLoginStreak(
  userScore
) {
  const today =
    startOfDay(new Date());

  const lastLogin =
    userScore.stats
      ?.lastLoginDate
      ? startOfDay(
          userScore.stats.lastLoginDate
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | FIRST LOGIN
  |--------------------------------------------------------------------------
  */

  if (!lastLogin) {
    userScore.stats.totalLogins =
      Number(
        userScore.stats.totalLogins || 0
      ) + 1;

    userScore.stats.consecutiveLogins =
      1;

    userScore.stats.lastLoginDate =
      new Date();

    userScore.streaks
      .currentLoginStreak = 1;

    userScore.streaks
      .longestLoginStreak =
      Math.max(
        Number(
          userScore.streaks
            .longestLoginStreak || 0
        ),
        1
      );

    return {
      isNewLogin: true,

      streakContinued: false,

      streakStarted: true,

      streakBroken: false
    };
  }

  const difference =
    calendarDayDifference(
      today,
      lastLogin
    );

  /*
  |--------------------------------------------------------------------------
  | SAME DAY
  |--------------------------------------------------------------------------
  */

  if (difference === 0) {
    return {
      isNewLogin: false,

      streakContinued: true,

      streakStarted: false,

      streakBroken: false
    };
  }

  /*
  |--------------------------------------------------------------------------
  | NEXT DAY
  |--------------------------------------------------------------------------
  */

  if (difference === 1) {
    userScore.stats.totalLogins =
      Number(
        userScore.stats.totalLogins || 0
      ) + 1;

    userScore.stats
      .consecutiveLogins =
      Number(
        userScore.stats
          .consecutiveLogins || 0
      ) + 1;

    userScore.stats.lastLoginDate =
      new Date();

    userScore.streaks
      .currentLoginStreak =
      Number(
        userScore.streaks
          .currentLoginStreak || 0
      ) + 1;

    userScore.streaks
      .longestLoginStreak =
      Math.max(
        Number(
          userScore.streaks
            .longestLoginStreak || 0
        ),
        Number(
          userScore.streaks
            .currentLoginStreak || 0
        )
      );

    return {
      isNewLogin: true,

      streakContinued: true,

      streakStarted: false,

      streakBroken: false
    };
  }

  /*
  |--------------------------------------------------------------------------
  | STREAK BROKEN
  |--------------------------------------------------------------------------
  */

  userScore.stats.totalLogins =
    Number(
      userScore.stats.totalLogins || 0
    ) + 1;

  userScore.stats
    .consecutiveLogins = 1;

  userScore.stats.lastLoginDate =
    new Date();

  userScore.streaks
    .currentLoginStreak = 1;

  userScore.streaks
    .longestLoginStreak =
    Math.max(
      Number(
        userScore.streaks
          .longestLoginStreak || 0
      ),
      1
    );

  return {
    isNewLogin: true,

    streakContinued: false,

    streakStarted: true,

    streakBroken: true
  };
}

/*
|--------------------------------------------------------------------------
| UPDATE TASK STREAK
|--------------------------------------------------------------------------
*/

function updateTaskStreak(
  userScore
) {
  const today =
    startOfDay(new Date());

  const lastTaskDate =
    userScore.streaks
      ?.lastTaskCompletionDate
      ? startOfDay(
          userScore.streaks
            .lastTaskCompletionDate
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | FIRST TASK
  |--------------------------------------------------------------------------
  */

  if (!lastTaskDate) {
    userScore.streaks
      .currentTaskStreak = 1;

    userScore.streaks
      .longestTaskStreak =
      Math.max(
        Number(
          userScore.streaks
            .longestTaskStreak || 0
        ),
        1
      );

    userScore.streaks
      .lastTaskCompletionDate =
      new Date();

    return {
      streakChanged: true,

      sameDay: false,

      currentStreak: 1
    };
  }

  const difference =
    calendarDayDifference(
      today,
      lastTaskDate
    );

  /*
  |--------------------------------------------------------------------------
  | SAME DAY
  |--------------------------------------------------------------------------
  */

  if (difference === 0) {
    return {
      streakChanged: false,

      sameDay: true,

      currentStreak:
        Number(
          userScore.streaks
            .currentTaskStreak || 0
        )
    };
  }

  /*
  |--------------------------------------------------------------------------
  | NEXT DAY
  |--------------------------------------------------------------------------
  */

  if (difference === 1) {
    userScore.streaks
      .currentTaskStreak =
      Number(
        userScore.streaks
          .currentTaskStreak || 0
      ) + 1;

    userScore.streaks
      .lastTaskCompletionDate =
      new Date();

    userScore.streaks
      .longestTaskStreak =
      Math.max(
        Number(
          userScore.streaks
            .longestTaskStreak || 0
        ),
        Number(
          userScore.streaks
            .currentTaskStreak || 0
        )
      );

    return {
      streakChanged: true,

      sameDay: false,

      currentStreak:
        userScore.streaks
          .currentTaskStreak
    };
  }

  /*
  |--------------------------------------------------------------------------
  | GAP
  |--------------------------------------------------------------------------
  */

  userScore.streaks
    .currentTaskStreak = 1;

  userScore.streaks
    .lastTaskCompletionDate =
    new Date();

  userScore.streaks
    .longestTaskStreak =
    Math.max(
      Number(
        userScore.streaks
          .longestTaskStreak || 0
      ),
      1
    );

  return {
    streakChanged: true,

    sameDay: false,

    currentStreak: 1
  };
}

/*
|--------------------------------------------------------------------------
| DETERMINE GAMIFICATION TYPE
|--------------------------------------------------------------------------
*/

function determineGamificationType(
  activityData
) {
  const activityType =
    activityData.activityType;

  switch (
    activityType
  ) {
    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    case "login":
      return "login";

    /*
    |--------------------------------------------------------------------------
    | DISEASE
    |--------------------------------------------------------------------------
    */

    case "disease-detection":
      return "disease_upload";

    /*
    |--------------------------------------------------------------------------
    | SOIL
    |--------------------------------------------------------------------------
    */

    case "soil-report": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      const description =
        String(
          activityData.description || ""
        ).toLowerCase();

      const isAnalysis =
        action ===
          "analysis_completed" ||
        title.includes(
          "analysis completed"
        ) ||
        description.includes(
          "analysis completed"
        );

      if (isAnalysis) {
        return null;
      }

      return "soil_upload";
    }

    /*
    |--------------------------------------------------------------------------
    | WEATHER
    |--------------------------------------------------------------------------
    */

    case "weather-alert":
    case "weather_check":
      return "weather_check";

    /*
    |--------------------------------------------------------------------------
    | FORUM
    |--------------------------------------------------------------------------
    */

    case "community-forum": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      /*
      |--------------------------------------------------------------------------
      | Helpful reply
      |--------------------------------------------------------------------------
      */

      if (
        action ===
        "reply_upvoted"
      ) {
        return "helpful_reply";
      }

      /*
      |--------------------------------------------------------------------------
      | Normal reply
      |--------------------------------------------------------------------------
      */

      if (
        action ===
          "reply_created" ||
        title.includes(
          "reply added"
        )
      ) {
        return "forum_reply";
      }

      /*
      |--------------------------------------------------------------------------
      | Normal post
      |--------------------------------------------------------------------------
      */

      return "forum_post";
    }

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT HELPFUL REPLY
    |--------------------------------------------------------------------------
    */

    case "helpful_reply":
      return "helpful_reply";

    /*
    |--------------------------------------------------------------------------
    | CROP CALENDAR
    |--------------------------------------------------------------------------
    */

    case "crop-calendar": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      if (
        action ===
          "task_completed" ||
        title.includes(
          "task completed"
        )
      ) {
        return "task_completed";
      }

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | NEWS
    |--------------------------------------------------------------------------
    */

    case "agri-news":
    case "news_read":
      return "news_read";

    /*
    |--------------------------------------------------------------------------
    | ALREADY CANONICAL
    |--------------------------------------------------------------------------
    */

    case "task_completed":
    case "disease_upload":
    case "soil_upload":
    case "forum_post":
    case "forum_reply":
    case "weather_check":
      return activityType;

    default:
      return null;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK HELPFUL REPLY DUPLICATE
|--------------------------------------------------------------------------
|
| One voter can reward the same reply only once.
|
|--------------------------------------------------------------------------
*/

async function isHelpfulReplyAlreadyRewarded(
  userIdObj,
  metadata
) {
  if (
    !metadata ||
    metadata.action !==
      "reply_upvoted" ||
    !metadata.replyId ||
    !metadata.voterId
  ) {
    return false;
  }

  const existing =
    await UserActivity.findOne({
      userId: userIdObj,

      activityType: {
        $in: [
          "helpful_reply",
          "community-forum"
        ]
      },

      "metadata.action":
        "reply_upvoted",

      "metadata.replyId":
        String(
          metadata.replyId
        ),

      "metadata.voterId":
        String(
          metadata.voterId
        )
    }).lean();

  return Boolean(existing);
}

/*
|--------------------------------------------------------------------------
| LOG ACTIVITY
|--------------------------------------------------------------------------
*/

async function logActivity(
  userId,
  activityData
) {
  try {
    if (!userId) {
      console.log(
        "⚠️ Activity logging skipped - no userId provided"
      );

      return null;
    }

    const userIdObj =
      toObjectId(userId);

    if (!userIdObj) {
      console.error(
        "❌ Invalid userId for activity logging:",
        userId
      );

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate activity data
    |--------------------------------------------------------------------------
    */

    if (
      !activityData ||
      !activityData.activityType ||
      !activityData.title ||
      !activityData.description
    ) {
      console.error(
        "❌ Invalid activity data:",
        activityData
      );

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpful reply duplicate protection
    |--------------------------------------------------------------------------
    */

    const gamificationType =
      determineGamificationType(
        activityData
      );

    if (
      gamificationType ===
      "helpful_reply"
    ) {
      const alreadyRewarded =
        await isHelpfulReplyAlreadyRewarded(
          userIdObj,
          activityData.metadata
        );

      if (alreadyRewarded) {
        console.log(
          "ℹ️ Helpful reply reward already granted:",
          activityData.metadata
        );

        return null;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Create activity history record
    |--------------------------------------------------------------------------
    */

    const activity =
      new UserActivity({
        userId: userIdObj,

        ...activityData
      });

    const saved =
      await activity.save();

    console.log(
      "✅ Activity logged:",
      {
        id: saved._id,

        type:
          saved.activityType,

        title:
          saved.title,

        userId:
          saved.userId
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Update UserScore
    |--------------------------------------------------------------------------
    */

    if (!gamificationType) {
      return saved;
    }

    const userScore =
      await getOrCreateUserScore(
        userIdObj
      );

    if (!userScore) {
      return saved;
    }

    /*
    |--------------------------------------------------------------------------
    | POINTS
    |--------------------------------------------------------------------------
    */

    let pointsToAdd =
      Number(
        GAMIFICATION_POINTS[
          gamificationType
        ] || 0
      );

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    let loginResult = null;

    if (
      gamificationType ===
      "login"
    ) {
      loginResult =
        updateLoginStreak(
          userScore
        );

      if (
        !loginResult.isNewLogin
      ) {
        pointsToAdd = 0;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | TASK COMPLETION
    |--------------------------------------------------------------------------
    */

    if (
      gamificationType ===
      "task_completed"
    ) {
      userScore.stats
        .tasksCompleted =
        Number(
          userScore.stats
            .tasksCompleted || 0
        ) + 1;

      updateTaskStreak(
        userScore
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DISEASE
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "disease_upload"
    ) {
      userScore.stats
        .diseaseUploads =
        Number(
          userScore.stats
            .diseaseUploads || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "diseaseDetector"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SOIL
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "soil_upload"
    ) {
      userScore.stats
        .soilReportsUploaded =
        Number(
          userScore.stats
            .soilReportsUploaded || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "soilMaster"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WEATHER
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "weather_check"
    ) {
      userScore.stats
        .weatherChecks =
        Number(
          userScore.stats
            .weatherChecks || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "weatherWatcher"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FORUM POST
    |--------------------------------------------------------------------------
    |
    | Community Helper is based on forum posts.
    |
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "forum_post"
    ) {
      userScore.stats
        .forumPosts =
        Number(
          userScore.stats
            .forumPosts || 0
        ) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | FORUM REPLY
    |--------------------------------------------------------------------------
    |
    | Forum replies earn forum-reply XP, but do NOT count toward
    | Community Helper.
    |
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "forum_reply"
    ) {
      userScore.stats
        .forumReplies =
        Number(
          userScore.stats
            .forumReplies || 0
        ) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | HELPFUL REPLY
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "helpful_reply"
    ) {
      userScore.stats
        .helpfulReplies =
        Number(
          userScore.stats
            .helpfulReplies || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "expertAdviser"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE ACHIEVEMENTS
    |--------------------------------------------------------------------------
    */

    synchronizeAchievements(
      userScore
    );

    /*
    |--------------------------------------------------------------------------
    | ADD XP
    |--------------------------------------------------------------------------
    */

    userScore.totalPoints =
      Number(
        userScore.totalPoints || 0
      ) + pointsToAdd;

    /*
    |--------------------------------------------------------------------------
    | RECENT ACTIVITIES
    |--------------------------------------------------------------------------
    */

    if (
      pointsToAdd > 0
    ) {
      userScore
        .recentActivities
        .unshift({
          activityType:
            gamificationType,

          points:
            pointsToAdd,

          description:
            activityData.description ||
            gamificationType
              .replace(
                /_/g,
                " "
              ),

          date:
            new Date()
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Keep last 50 activities
    |--------------------------------------------------------------------------
    */

    if (
      userScore
        .recentActivities
        .length > 50
    ) {
      userScore.recentActivities =
        userScore
          .recentActivities
          .slice(
            0,
            50
          );
    }

    /*
    |--------------------------------------------------------------------------
    | LEVEL
    |--------------------------------------------------------------------------
    */

    const levelInfo =
      calculateLevel(
        userScore.totalPoints
      );

    userScore.level =
      levelInfo.level;

    userScore.levelName =
      levelInfo.levelName;

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await userScore.save();

    console.log(
      "🎮 Gamification updated:",
      {
        userId:
          userIdObj.toString(),

        activity:
          gamificationType,

        points:
          pointsToAdd,

        totalPoints:
          userScore.totalPoints,

        loginStreak:
          userScore.streaks
            .currentLoginStreak,

        taskStreak:
          userScore.streaks
            .currentTaskStreak
      }
    );

    return saved;
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Gamification must never break the feature that called it.
    |
    |--------------------------------------------------------------------------
    */

    console.error(
      "❌ Error logging activity:",
      error.message
    );

    console.error(
      "Activity data:",
      {
        userId,
        activityData
      }
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| DETERMINE GAMIFICATION TYPE
|--------------------------------------------------------------------------
*/

function determineGamificationType(
  activityData
) {
  const activityType =
    activityData.activityType;

  switch (
    activityType
  ) {
    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    case "login":
      return "login";

    /*
    |--------------------------------------------------------------------------
    | DISEASE
    |--------------------------------------------------------------------------
    */

    case "disease-detection":
      return "disease_upload";

    /*
    |--------------------------------------------------------------------------
    | SOIL
    |--------------------------------------------------------------------------
    */

    case "soil-report": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      const description =
        String(
          activityData.description || ""
        ).toLowerCase();

      const isAnalysis =
        action ===
          "analysis_completed" ||
        title.includes(
          "analysis completed"
        ) ||
        description.includes(
          "analysis completed"
        );

      if (isAnalysis) {
        return null;
      }

      return "soil_upload";
    }

    /*
    |--------------------------------------------------------------------------
    | WEATHER
    |--------------------------------------------------------------------------
    */

    case "weather-alert":
    case "weather_check":
      return "weather_check";

    /*
    |--------------------------------------------------------------------------
    | FORUM
    |--------------------------------------------------------------------------
    */

    case "community-forum": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      /*
      |--------------------------------------------------------------------------
      | Helpful reply
      |--------------------------------------------------------------------------
      */

      if (
        action ===
        "reply_upvoted"
      ) {
        return "helpful_reply";
      }

      /*
      |--------------------------------------------------------------------------
      | Normal reply
      |--------------------------------------------------------------------------
      */

      if (
        action ===
          "reply_created" ||
        title.includes(
          "reply added"
        )
      ) {
        return "forum_reply";
      }

      /*
      |--------------------------------------------------------------------------
      | Normal post
      |--------------------------------------------------------------------------
      */

      return "forum_post";
    }

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT HELPFUL REPLY
    |--------------------------------------------------------------------------
    */

    case "helpful_reply":
      return "helpful_reply";

    /*
    |--------------------------------------------------------------------------
    | CROP CALENDAR
    |--------------------------------------------------------------------------
    */

    case "crop-calendar": {
      const action =
        activityData.metadata
          ?.action;

      const title =
        String(
          activityData.title || ""
        ).toLowerCase();

      if (
        action ===
          "task_completed" ||
        title.includes(
          "task completed"
        )
      ) {
        return "task_completed";
      }

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | NEWS
    |--------------------------------------------------------------------------
    */

    case "agri-news":
    case "news_read":
      return "news_read";

    /*
    |--------------------------------------------------------------------------
    | ALREADY CANONICAL
    |--------------------------------------------------------------------------
    */

    case "task_completed":
    case "disease_upload":
    case "soil_upload":
    case "forum_post":
    case "forum_reply":
    case "weather_check":
      return activityType;

    default:
      return null;
  }
}

/*
|--------------------------------------------------------------------------
| CHECK HELPFUL REPLY DUPLICATE
|--------------------------------------------------------------------------
|
| One voter can reward the same reply only once.
|
|--------------------------------------------------------------------------
*/

async function isHelpfulReplyAlreadyRewarded(
  userIdObj,
  metadata
) {
  if (
    !metadata ||
    metadata.action !==
      "reply_upvoted" ||
    !metadata.replyId ||
    !metadata.voterId
  ) {
    return false;
  }

  const existing =
    await UserActivity.findOne({
      userId: userIdObj,

      activityType: {
        $in: [
          "helpful_reply",
          "community-forum"
        ]
      },

      "metadata.action":
        "reply_upvoted",

      "metadata.replyId":
        String(
          metadata.replyId
        ),

      "metadata.voterId":
        String(
          metadata.voterId
        )
    }).lean();

  return Boolean(existing);
}

/*
|--------------------------------------------------------------------------
| LOG ACTIVITY
|--------------------------------------------------------------------------
*/

async function logActivity(
  userId,
  activityData
) {
  try {
    if (!userId) {
      console.log(
        "⚠️ Activity logging skipped - no userId provided"
      );

      return null;
    }

    const userIdObj =
      toObjectId(userId);

    if (!userIdObj) {
      console.error(
        "❌ Invalid userId for activity logging:",
        userId
      );

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Validate activity data
    |--------------------------------------------------------------------------
    */

    if (
      !activityData ||
      !activityData.activityType ||
      !activityData.title ||
      !activityData.description
    ) {
      console.error(
        "❌ Invalid activity data:",
        activityData
      );

      return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Helpful reply duplicate protection
    |--------------------------------------------------------------------------
    */

    const gamificationType =
      determineGamificationType(
        activityData
      );

    if (
      gamificationType ===
      "helpful_reply"
    ) {
      const alreadyRewarded =
        await isHelpfulReplyAlreadyRewarded(
          userIdObj,
          activityData.metadata
        );

      if (alreadyRewarded) {
        console.log(
          "ℹ️ Helpful reply reward already granted:",
          activityData.metadata
        );

        return null;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Create activity history record
    |--------------------------------------------------------------------------
    */

    const activity =
      new UserActivity({
        userId: userIdObj,

        ...activityData
      });

    const saved =
      await activity.save();

    console.log(
      "✅ Activity logged:",
      {
        id: saved._id,

        type:
          saved.activityType,

        title:
          saved.title,

        userId:
          saved.userId
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Update UserScore
    |--------------------------------------------------------------------------
    */

    if (!gamificationType) {
      return saved;
    }

    const userScore =
      await getOrCreateUserScore(
        userIdObj
      );

    if (!userScore) {
      return saved;
    }

    /*
    |--------------------------------------------------------------------------
    | POINTS
    |--------------------------------------------------------------------------
    */

    let pointsToAdd =
      Number(
        GAMIFICATION_POINTS[
          gamificationType
        ] || 0
      );

    /*
    |--------------------------------------------------------------------------
    | LOGIN
    |--------------------------------------------------------------------------
    */

    let loginResult = null;

    if (
      gamificationType ===
      "login"
    ) {
      loginResult =
        updateLoginStreak(
          userScore
        );

      if (
        !loginResult.isNewLogin
      ) {
        pointsToAdd = 0;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | TASK COMPLETION
    |--------------------------------------------------------------------------
    */

    if (
      gamificationType ===
      "task_completed"
    ) {
      userScore.stats
        .tasksCompleted =
        Number(
          userScore.stats
            .tasksCompleted || 0
        ) + 1;

      updateTaskStreak(
        userScore
      );
    }

    /*
    |--------------------------------------------------------------------------
    | DISEASE
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "disease_upload"
    ) {
      userScore.stats
        .diseaseUploads =
        Number(
          userScore.stats
            .diseaseUploads || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "diseaseDetector"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SOIL
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "soil_upload"
    ) {
      userScore.stats
        .soilReportsUploaded =
        Number(
          userScore.stats
            .soilReportsUploaded || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "soilMaster"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | WEATHER
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "weather_check"
    ) {
      userScore.stats
        .weatherChecks =
        Number(
          userScore.stats
            .weatherChecks || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "weatherWatcher"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | FORUM POST
    |--------------------------------------------------------------------------
    |
    | Community Helper is based on forum posts.
    |
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "forum_post"
    ) {
      userScore.stats
        .forumPosts =
        Number(
          userScore.stats
            .forumPosts || 0
        ) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | FORUM REPLY
    |--------------------------------------------------------------------------
    |
    | Forum replies earn forum-reply XP, but do NOT count toward
    | Community Helper.
    |
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "forum_reply"
    ) {
      userScore.stats
        .forumReplies =
        Number(
          userScore.stats
            .forumReplies || 0
        ) + 1;
    }

    /*
    |--------------------------------------------------------------------------
    | HELPFUL REPLY
    |--------------------------------------------------------------------------
    */

    else if (
      gamificationType ===
      "helpful_reply"
    ) {
      userScore.stats
        .helpfulReplies =
        Number(
          userScore.stats
            .helpfulReplies || 0
        ) + 1;

      incrementAchievement(
        userScore,
        "expertAdviser"
      );
    }

    /*
    |--------------------------------------------------------------------------
    | SYNCHRONIZE ACHIEVEMENTS
    |--------------------------------------------------------------------------
    */

    synchronizeAchievements(
      userScore
    );

    /*
    |--------------------------------------------------------------------------
    | ADD XP
    |--------------------------------------------------------------------------
    */

    userScore.totalPoints =
      Number(
        userScore.totalPoints || 0
      ) + pointsToAdd;

    /*
    |--------------------------------------------------------------------------
    | RECENT ACTIVITIES
    |--------------------------------------------------------------------------
    */

    if (
      pointsToAdd > 0
    ) {
      userScore
        .recentActivities
        .unshift({
          activityType:
            gamificationType,

          points:
            pointsToAdd,

          description:
            activityData.description ||
            gamificationType
              .replace(
                /_/g,
                " "
              ),

          date:
            new Date()
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Keep last 50 activities
    |--------------------------------------------------------------------------
    */

    if (
      userScore
        .recentActivities
        .length > 50
    ) {
      userScore.recentActivities =
        userScore
          .recentActivities
          .slice(
            0,
            50
          );
    }

    /*
    |--------------------------------------------------------------------------
    | LEVEL
    |--------------------------------------------------------------------------
    */

    const levelInfo =
      calculateLevel(
        userScore.totalPoints
      );

    userScore.level =
      levelInfo.level;

    userScore.levelName =
      levelInfo.levelName;

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    await userScore.save();

    console.log(
      "🎮 Gamification updated:",
      {
        userId:
          userIdObj.toString(),

        activity:
          gamificationType,

        points:
          pointsToAdd,

        totalPoints:
          userScore.totalPoints,

        loginStreak:
          userScore.streaks
            .currentLoginStreak,

        taskStreak:
          userScore.streaks
            .currentTaskStreak
      }
    );

    return saved;
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Gamification must never break the feature that called it.
    |
    |--------------------------------------------------------------------------
    */

    console.error(
      "❌ Error logging activity:",
      error.message
    );

    console.error(
      "Activity data:",
      {
        userId,
        activityData
      }
    );

    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET USER ID FROM REQUEST
|--------------------------------------------------------------------------
|
| Used by routes where authentication is optional.
|
|--------------------------------------------------------------------------
*/

async function getUserIdFromRequest(
  req
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | If auth middleware already populated req.user
    |--------------------------------------------------------------------------
    */

    if (
      req.user?._id
    ) {
      return req.user._id;
    }

    if (
      req.user?.id
    ) {
      return req.user.id;
    }

    /*
    |--------------------------------------------------------------------------
    | Otherwise inspect JWT
    |--------------------------------------------------------------------------
    */

    const authorization =
      req.headers.authorization;

    if (!authorization) {
      return null;
    }

    const token =
      authorization
        .split(" ")[1];

    if (!token) {
      return null;
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET ||
          "farmai_secret"
      );

    return (
      decoded?.id ||
      decoded?._id ||
      decoded?.userId ||
      null
    );
  } catch (error) {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET /api/activities
|--------------------------------------------------------------------------
| User activity history
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  auth,
  async (req, res) => {
    try {
      const {
        type,
        limit = 50,
        page = 1
      } = req.query;

      const userIdObj =
        toObjectId(
          req.user._id
        );

      if (!userIdObj) {
        return res.status(400).json({
          success: false,

          error:
            "Invalid user ID"
        });
      }

      const parsedLimit =
        Math.min(
          Math.max(
            parseInt(
              limit,
              10
            ) || 50,
            1
          ),
          100
        );

      const parsedPage =
        Math.max(
          parseInt(
            page,
            10
          ) || 1,
          1
        );

      const query = {
        userId:
          userIdObj
      };

      if (
        type &&
        type !== "all"
      ) {
        query.activityType =
          type;
      }

      const activities =
        await UserActivity.find(
          query
        )
          .sort({
            createdAt: -1
          })
          .limit(
            parsedLimit
          )
          .skip(
            (
              parsedPage - 1
            ) *
            parsedLimit
          )
          .populate(
            "relatedId",
            "title name schemeName"
          )
          .lean();

      const total =
        await UserActivity
          .countDocuments(
            query
          );

      const formattedActivities =
        activities.map(
          (activity) => ({
            id:
              activity._id
                .toString(),

            type:
              activity.activityType,

            title:
              activity.title,

            description:
              activity.description ||
              "",

            date:
              activity.createdAt
                ? activity.createdAt
                    .toISOString()
                    .split("T")[0]
                : "",

            time:
              activity.createdAt
                ? activity.createdAt
                    .toTimeString()
                    .split(" ")[0]
                    .substring(
                      0,
                      5
                    )
                : "",

            status:
              activity.status,

            result:
              activity.result ||
              "",

            metadata:
              activity.metadata ||
              {},

            relatedId:
              activity.relatedId
                ? activity.relatedId._id
                  ? activity.relatedId._id.toString()
                  : activity.relatedId.toString()
                : null
          })
        );

      res.json({
        success: true,

        activities:
          formattedActivities,

        total,

        page:
          parsedPage,

        limit:
          parsedLimit,

        totalPages:
          Math.ceil(
            total /
            parsedLimit
          )
      });
    } catch (error) {
      console.error(
        "❌ Error fetching activities:",
        error
      );

      res.status(500).json({
        success: false,

        error:
          "Failed to fetch activities"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| GET /api/activities/stats
|--------------------------------------------------------------------------
*/

router.get(
  "/stats",
  auth,
  async (req, res) => {
    try {
      const userIdObj =
        toObjectId(
          req.user._id
        );

      if (!userIdObj) {
        return res.status(400).json({
          success: false,

          error:
            "Invalid user ID"
        });
      }

      const stats =
        await UserActivity.aggregate(
          [
            {
              $match: {
                userId:
                  userIdObj
              }
            },

            {
              $group: {
                _id:
                  "$activityType",

                count: {
                  $sum: 1
                }
              }
            }
          ]
        );

      const statsMap = {};

      stats.forEach(
        (stat) => {
          statsMap[
            stat._id
          ] =
            stat.count;
        }
      );

      res.json({
        success: true,

        stats:
          statsMap
      });
    } catch (error) {
      console.error(
        "❌ Error fetching activity stats:",
        error
      );

      res.status(500).json({
        success: false,

        error:
          "Failed to fetch stats"
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/activities/log
|--------------------------------------------------------------------------
| Frontend activity logging endpoint.
|--------------------------------------------------------------------------
*/

router.post(
  "/log",
  auth,
  async (req, res) => {
    try {
      const {
        activityType,
        title,
        description,
        status,
        result,
        metadata
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (
        !activityType ||
        typeof activityType !==
          "string" ||
        !activityType.trim()
      ) {
        return res.status(400).json({
          success: false,

          error:
            "activityType is required and must be a non-empty string"
        });
      }

      if (
        !title ||
        typeof title !==
          "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,

          error:
            "title is required and must be a non-empty string"
        });
      }

      if (
        !description ||
        typeof description !==
          "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,

          error:
            "description is required and must be a non-empty string"
        });
      }

      const activity =
        await logActivity(
          req.user._id,
          {
            activityType:
              activityType.trim(),

            title:
              title.trim(),

            description:
              description.trim(),

            status:
              status ||
              "completed",

            result:
              result ||
              "",

            metadata:
              metadata ||
              {}
          }
        );

      if (!activity) {
        return res.status(500).json({
          success: false,

          error:
            "Failed to save activity to database. Check server logs for details."
        });
      }

      res.json({
        success: true,

        message:
          "Activity logged successfully",

        activity: {
          id:
            activity._id,

          type:
            activity.activityType,

          title:
            activity.title
        }
      });
    } catch (error) {
      console.error(
        "❌ Error logging activity:",
        error
      );

      res.status(500).json({
        success: false,

        error:
          error.message
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| POST /api/activities/test
|--------------------------------------------------------------------------
*/

router.post(
  "/test",
  auth,
  async (req, res) => {
    try {
      const testActivity =
        await logActivity(
          req.user._id,
          {
            activityType:
              "chat",

            title:
              "Test Activity",

            description:
              "This is a test activity to verify logging works",

            status:
              "completed",

            result:
              "Test successful",

            metadata: {
              test: true
            }
          }
        );

      if (!testActivity) {
        return res.status(500).json({
          success: false,

          message:
            "Test activity could not be created"
        });
      }

      res.json({
        success: true,

        message:
          "Test activity created",

        activity:
          testActivity
      });
    } catch (error) {
      console.error(
        "❌ Error creating test activity:",
        error
      );

      res.status(500).json({
        success: false,

        error:
          error.message
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

module.exports = {
  router,

  logActivity,

  getUserIdFromRequest
};