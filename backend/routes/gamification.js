const express = require('express');
const router = express.Router();
const UserScore = require('../models/UserScore');
const auth = require('../middleware/auth');

// =========================================================
// NOTIFICATION SERVICE
// =========================================================

const {
  notifyBadgeEarned,
  notifyStreak,
  notifyStreakMilestone,
  notifyXpEarned,
  notifyLevelUp
} = require('../utils/notificationService');

// =========================================================
// POINT VALUES FOR DIFFERENT ACTIVITIES
// =========================================================

const ACTIVITY_POINTS = {
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

// =========================================================
// ACHIEVEMENT TARGETS
// =========================================================

const ACHIEVEMENT_TARGETS = {
  expertAdviser: 50,
  activeFarmer: 30,
  diseaseDetector: 20,
  soilMaster: 5,
  weatherWatcher: 100,
  communityHelper: 25
};

// =========================================================
// BADGE DEFINITIONS
// =========================================================

const BADGES = {
  ACTIVE_FARMER: {
    badgeId: 'active_farmer',
    badgeName: 'Active Farmer',
    badgeDescription: 'Maintained a 30 day login streak',
    badgeIcon: '🌟',
    category: 'activity'
  },

  IRRIGATION_PRO: {
    badgeId: 'irrigation_pro',
    badgeName: 'Best Irrigation Practice',
    badgeDescription: 'Completed 50 irrigation tasks on time',
    badgeIcon: '💧',
    category: 'irrigation'
  },

  SOIL_MASTER: {
    badgeId: 'soil_master',
    badgeName: 'Healthy Soil Award',
    badgeDescription: 'Uploaded 5 soil reports',
    badgeIcon: '🌱',
    category: 'soil'
  },

  DISEASE_FREE: {
    badgeId: 'disease_free',
    badgeName: 'Disease-Free Crop Champion',
    badgeDescription: 'Successfully detected and treated 20 diseases',
    badgeIcon: '🏆',
    category: 'disease'
  },

  COMMUNITY_HELPER: {
    badgeId: 'community_helper',
    badgeName: 'Community Helper',
    badgeDescription: 'Helped 25 farmers with forum replies',
    badgeIcon: '🤝',
    category: 'community'
  },

  EXPERT_ADVISER: {
    badgeId: 'expert_adviser',
    badgeName: 'Expert Adviser',
    badgeDescription: '50 helpful forum replies',
    badgeIcon: '👨‍🌾',
    category: 'expert'
  },

  WEATHER_WATCHER: {
    badgeId: 'weather_watcher',
    badgeName: 'Weather Watcher',
    badgeDescription: 'Checked weather 100 times',
    badgeIcon: '🌤️',
    category: 'activity'
  }
};

// =========================================================
// LEVEL THRESHOLDS
// =========================================================

const LEVELS = [
  {
    level: 1,
    name: 'Seedling',
    minPoints: 0
  },
  {
    level: 2,
    name: 'Growing Farmer',
    minPoints: 100
  },
  {
    level: 3,
    name: 'Skilled Farmer',
    minPoints: 300
  },
  {
    level: 4,
    name: 'Expert Farmer',
    minPoints: 600
  },
  {
    level: 5,
    name: 'Master Farmer',
    minPoints: 1000
  },
  {
    level: 6,
    name: 'Agriculture Expert',
    minPoints: 1500
  },
  {
    level: 7,
    name: 'Agriculture Champion',
    minPoints: 2500
  },
  {
    level: 8,
    name: 'Agriculture Legend',
    minPoints: 5000
  }
];

// =========================================================
// STREAK MILESTONES
// =========================================================

const STREAK_MILESTONES = [
  3,
  7,
  14,
  30,
  60,
  100
];

// =========================================================
// ENSURE ACHIEVEMENT STRUCTURE
// =========================================================

function ensureAchievementStructure(userScore) {
  if (!userScore.achievements) {
    userScore.achievements = {};
  }

  const defaults = {
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
  };

  Object.keys(defaults).forEach((key) => {
    if (!userScore.achievements[key]) {
      userScore.achievements[key] = {
        ...defaults[key]
      };

      return;
    }

    if (
      typeof userScore.achievements[key].current !==
      'number'
    ) {
      userScore.achievements[key].current = 0;
    }

    userScore.achievements[key].target =
      ACHIEVEMENT_TARGETS[key];

    userScore.achievements[key].completed =
      userScore.achievements[key].current >=
      ACHIEVEMENT_TARGETS[key];
  });
}

// =========================================================
// GET OR CREATE USER SCORE
// =========================================================

async function getUserScore(userId) {
  let userScore = await UserScore.findOne({
    userId
  });

  if (!userScore) {
    userScore = new UserScore({
      userId,

      totalPoints: 0,

      level: 1,

      levelName: 'Seedling',

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
        longestTaskStreak: 0
      },

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
  | Important for existing users
  |--------------------------------------------------------------------------
  |
  | Existing UserScore documents may have been created before all
  | achievement fields existed.
  |
  |--------------------------------------------------------------------------
  */

  ensureAchievementStructure(userScore);

  /*
  |--------------------------------------------------------------------------
  | Keep Active Farmer synchronized with current login streak
  |--------------------------------------------------------------------------
  */

  userScore.achievements.activeFarmer.current =
    Number(
      userScore.streaks?.currentLoginStreak || 0
    );

  userScore.achievements.activeFarmer.target =
    ACHIEVEMENT_TARGETS.activeFarmer;

  userScore.achievements.activeFarmer.completed =
    userScore.achievements.activeFarmer.current >=
    ACHIEVEMENT_TARGETS.activeFarmer;

  return userScore;
}

// =========================================================
// CALCULATE LEVEL FROM POINTS
// =========================================================

function calculateLevel(points) {
  for (
    let i = LEVELS.length - 1;
    i >= 0;
    i--
  ) {
    if (
      points >= LEVELS[i].minPoints
    ) {
      return {
        level: LEVELS[i].level,
        levelName: LEVELS[i].name
      };
    }
  }

  return {
    level: 1,
    levelName: 'Seedling'
  };
}

// =========================================================
// UPDATE ACHIEVEMENT PROGRESS
// =========================================================

function updateAchievement(
  userScore,
  achievementKey,
  currentValue
) {
  if (
    !userScore.achievements ||
    !userScore.achievements[achievementKey]
  ) {
    return;
  }

  const target =
    ACHIEVEMENT_TARGETS[
      achievementKey
    ];

  userScore.achievements[
    achievementKey
  ].current = Math.max(
    0,
    Number(currentValue) || 0
  );

  userScore.achievements[
    achievementKey
  ].target = target;

  userScore.achievements[
    achievementKey
  ].completed =
    userScore.achievements[
      achievementKey
    ].current >= target;
}

// =========================================================
// SYNCHRONIZE ALL ACHIEVEMENTS
// =========================================================
//
// This is intentionally based on the actual UserScore statistics.
// It prevents achievement values from becoming inconsistent with
// the underlying counters.
//

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

  updateAchievement(
    userScore,
    'activeFarmer',
    userScore.streaks
      ?.currentLoginStreak || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Disease Detector
  |--------------------------------------------------------------------------
  */

  updateAchievement(
    userScore,
    'diseaseDetector',
    userScore.stats
      ?.diseaseUploads || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Soil Master
  |--------------------------------------------------------------------------
  */

  updateAchievement(
    userScore,
    'soilMaster',
    userScore.stats
      ?.soilReportsUploaded || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Weather Watcher
  |--------------------------------------------------------------------------
  */

  updateAchievement(
    userScore,
    'weatherWatcher',
    userScore.stats
      ?.weatherChecks || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Community Helper
  |--------------------------------------------------------------------------
  */

  updateAchievement(
    userScore,
    'communityHelper',
    userScore.stats
      ?.forumReplies || 0
  );

  /*
  |--------------------------------------------------------------------------
  | Expert Adviser
  |--------------------------------------------------------------------------
  */

  updateAchievement(
    userScore,
    'expertAdviser',
    userScore.stats
      ?.helpfulReplies || 0
  );
}

// =========================================================
// CHECK AND AWARD BADGES
// =========================================================

async function checkAndAwardBadges(
  userScore
) {
  const newBadges = [];

  synchronizeAchievements(
    userScore
  );

  /*
  |--------------------------------------------------------------------------
  | Active Farmer
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.activeFarmer.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'active_farmer'
    )
  ) {
    newBadges.push(
      BADGES.ACTIVE_FARMER
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Soil Master
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.soilMaster.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'soil_master'
    )
  ) {
    newBadges.push(
      BADGES.SOIL_MASTER
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Disease Free
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.diseaseDetector.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'disease_free'
    )
  ) {
    newBadges.push(
      BADGES.DISEASE_FREE
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Community Helper
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.communityHelper.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'community_helper'
    )
  ) {
    newBadges.push(
      BADGES.COMMUNITY_HELPER
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Expert Adviser
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.expertAdviser.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'expert_adviser'
    )
  ) {
    newBadges.push(
      BADGES.EXPERT_ADVISER
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Weather Watcher
  |--------------------------------------------------------------------------
  */

  if (
    userScore.achievements.weatherWatcher.completed &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'weather_watcher'
    )
  ) {
    newBadges.push(
      BADGES.WEATHER_WATCHER
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Irrigation Pro
  |--------------------------------------------------------------------------
  |
  | This badge will be activated when the task system provides an
  | irrigation on-time counter.
  |
  | We intentionally do NOT use total tasks here because that would
  | incorrectly award an irrigation-specific badge for non-irrigation
  | tasks.
  |
  |--------------------------------------------------------------------------
  */

  const irrigationTasksOnTime =
    Number(
      userScore.stats
        ?.irrigationTasksOnTime || 0
    );

  if (
    irrigationTasksOnTime >= 50 &&
    !userScore.badges.find(
      (b) =>
        b.badgeId === 'irrigation_pro'
    )
  ) {
    newBadges.push(
      BADGES.IRRIGATION_PRO
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Add new badges
  |--------------------------------------------------------------------------
  */

  if (
    newBadges.length > 0
  ) {
    userScore.badges.push(
      ...newBadges
    );
  }

  return newBadges;
}

// =========================================================
// SEND GAMIFICATION NOTIFICATIONS
// =========================================================

async function sendGamificationNotifications({
  userId,
  activityType,
  points,
  totalPoints,
  previousLevel,
  currentLevel,
  currentStreak,
  newBadges
}) {
  try {
    /*
    |--------------------------------------------------------------------------
    | XP NOTIFICATION
    |--------------------------------------------------------------------------
    */

    if (
      points > 0
    ) {
      let reason =
        'FarmAI activity';

      switch (
        activityType
      ) {
        case 'login':
          reason =
            'logging in to FarmAI';
          break;

        case 'task_completed':
          reason =
            'completing a farming task';
          break;

        case 'disease_upload':
          reason =
            'using crop disease detection';
          break;

        case 'soil_upload':
          reason =
            'uploading a soil report';
          break;

        case 'weather_check':
          reason =
            'checking the weather';
          break;

        case 'forum_post':
          reason =
            'creating a community post';
          break;

        case 'forum_reply':
          reason =
            'helping the farming community';
          break;

        case 'helpful_reply':
          reason =
            'providing a helpful community reply';
          break;

        case 'news_read':
          reason =
            'reading agriculture news';
          break;

        case 'consecutive_login':
          reason =
            'maintaining your login streak';
          break;

        default:
          reason =
            'FarmAI activity';
      }

      await notifyXpEarned({
        userId,
        xp: points,
        reason
      });
    }

    /*
    |--------------------------------------------------------------------------
    | LEVEL UP NOTIFICATION
    |--------------------------------------------------------------------------
    */

    if (
      currentLevel >
      previousLevel
    ) {
      await notifyLevelUp({
        userId,
        level:
          currentLevel
      });
    }

    /*
    |--------------------------------------------------------------------------
    | STREAK NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    if (
      activityType === 'login' &&
      currentStreak > 1
    ) {
      if (
        STREAK_MILESTONES.includes(
          currentStreak
        )
      ) {
        await notifyStreakMilestone({
          userId,
          streakDays:
            currentStreak
        });
      } else {
        await notifyStreak({
          userId,
          streakDays:
            currentStreak
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | BADGE NOTIFICATIONS
    |--------------------------------------------------------------------------
    */

    if (
      Array.isArray(
        newBadges
      ) &&
      newBadges.length > 0
    ) {
      for (
        const badge of newBadges
      ) {
        await notifyBadgeEarned({
          userId,

          badgeName:
            badge.badgeName,

          badgeId:
            badge.badgeId
        });
      }
    }
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | Notification errors must never break gamification.
    |--------------------------------------------------------------------------
    */

    console.error(
      'Error sending gamification notifications:',
      error
    );
  }
}

// =========================================================
// LOG ACTIVITY AND AWARD POINTS
// =========================================================

router.post(
  '/log-activity',
  auth,
  async (req, res) => {
    try {
      const {
        activityType,
        description
      } = req.body;

      /*
      |--------------------------------------------------------------------------
      | Validate activity
      |--------------------------------------------------------------------------
      */

      if (
        !activityType ||
        !Object.prototype.hasOwnProperty.call(
          ACTIVITY_POINTS,
          activityType
        )
      ) {
        return res.status(400).json({
          error:
            'Invalid activity type'
        });
      }

      /*
      |--------------------------------------------------------------------------
      | Get UserScore
      |--------------------------------------------------------------------------
      */

      const userScore =
        await getUserScore(
          req.user._id
        );

      /*
      |--------------------------------------------------------------------------
      | Previous state
      |--------------------------------------------------------------------------
      */

      const previousLevel =
        userScore.level || 1;

      const previousStreak =
        Number(
          userScore.streaks
            ?.currentLoginStreak || 0
        );

      /*
      |--------------------------------------------------------------------------
      | POINTS
      |--------------------------------------------------------------------------
      */

      let points =
        ACTIVITY_POINTS[
          activityType
        ];

      /*
      |--------------------------------------------------------------------------
      | LOGIN
      |--------------------------------------------------------------------------
      |
      | A user can log in multiple times on the same day, but that should
      | not repeatedly award login XP or increase the login streak.
      |
      |--------------------------------------------------------------------------
      */

      let loginWasCounted =
        true;

      if (
        activityType === 'login'
      ) {
        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );

        const lastLogin =
          userScore.stats
            .lastLoginDate
            ? new Date(
                userScore.stats
                  .lastLoginDate
              )
            : null;

        if (lastLogin) {
          lastLogin.setHours(
            0,
            0,
            0,
            0
          );

          const daysDiff =
            Math.round(
              (
                today.getTime() -
                lastLogin.getTime()
              ) /
              (
                1000 *
                60 *
                60 *
                24
              )
            );

          /*
          |--------------------------------------------------------------------------
          | Same day
          |--------------------------------------------------------------------------
          */

          if (
            daysDiff === 0
          ) {
            loginWasCounted =
              false;

            points = 0;
          }

          /*
          |--------------------------------------------------------------------------
          | Consecutive day
          |--------------------------------------------------------------------------
          */

          else if (
            daysDiff === 1
          ) {
            userScore.streaks
              .currentLoginStreak =
              Number(
                userScore.streaks
                  .currentLoginStreak || 0
              ) + 1;

            userScore.stats
              .consecutiveLogins =
              userScore.streaks
                .currentLoginStreak;

            userScore.stats
              .totalLogins += 1;

            userScore.stats
              .lastLoginDate =
              new Date();

            if (
              userScore.streaks
                .currentLoginStreak >
              userScore.streaks
                .longestLoginStreak
            ) {
              userScore.streaks
                .longestLoginStreak =
                userScore.streaks
                  .currentLoginStreak;
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Streak broken
          |--------------------------------------------------------------------------
          */

          else {
            userScore.streaks
              .currentLoginStreak =
              1;

            userScore.stats
              .consecutiveLogins =
              1;

            userScore.stats
              .totalLogins += 1;

            userScore.stats
              .lastLoginDate =
              new Date();
          }
        }

        /*
        |--------------------------------------------------------------------------
        | First-ever login
        |--------------------------------------------------------------------------
        */

        else {
          userScore.streaks
            .currentLoginStreak =
            1;

          userScore.streaks
            .longestLoginStreak =
            Math.max(
              1,
              Number(
                userScore.streaks
                  .longestLoginStreak || 0
              )
            );

          userScore.stats
            .totalLogins += 1;

          userScore.stats
            .consecutiveLogins =
            1;

          userScore.stats
            .lastLoginDate =
            new Date();
        }
      }

      /*
      |--------------------------------------------------------------------------
      | ADD POINTS
      |--------------------------------------------------------------------------
      */

      userScore.totalPoints =
        Number(
          userScore.totalPoints || 0
        ) + points;

      /*
      |--------------------------------------------------------------------------
      | UPDATE ACTIVITY STATISTICS
      |--------------------------------------------------------------------------
      */

    if (
      activityType ===
      'task_completed'
    ) {
      /*
       * ---------------------------------------------------------
       * TASK COMPLETION
       * ---------------------------------------------------------
       *
       * Every completed task earns XP and increases the total
       * task counter.
       *
       * BUT:
       * Task Streak counts ACTIVE DAYS, not number of tasks.
       *
       * Example:
       *   4 tasks today = 1 streak day
       *   1 task tomorrow = 2 streak days
       *   3 tasks tomorrow = still 2 streak days
       *
       * ---------------------------------------------------------
       */
    
      userScore.stats.tasksCompleted += 1;
    
      const today = new Date();
      today.setHours(0, 0, 0, 0);
    
      /*
       * UserScore has lastTaskCompletionDate in the updated
       * streak schema.
       */
      const lastTaskDate =
        userScore.streaks.lastTaskCompletionDate
          ? new Date(
              userScore.streaks.lastTaskCompletionDate
            )
          : null;
    
      if (lastTaskDate) {
        lastTaskDate.setHours(0, 0, 0, 0);
    
        const daysDiff =
          Math.round(
            (
              today.getTime() -
              lastTaskDate.getTime()
            ) /
            (
              1000 *
              60 *
              60 *
              24
            )
          );
    
        /*
         * Same calendar day:
         * Do NOT increase the streak.
         */
        if (daysDiff === 0) {
          // Keep currentTaskStreak unchanged.
        }
    
        /*
         * Exactly the next calendar day:
         * Continue the streak by one day.
         */
        else if (daysDiff === 1) {
          userScore.streaks.currentTaskStreak =
            Number(
              userScore.streaks.currentTaskStreak || 0
            ) + 1;
        }
    
        /*
         * More than one day has passed:
         * The task streak is broken.
         */
        else if (daysDiff > 1) {
          userScore.streaks.currentTaskStreak = 1;
        }
    
        /*
         * Defensive handling for an unexpected future date.
         */
        else {
          userScore.streaks.currentTaskStreak = 1;
        }
      }
    
      /*
       * First task ever.
       */
      else {
        userScore.streaks.currentTaskStreak = 1;
      }
    
      /*
       * Store the calendar day of the latest task.
       */
      userScore.streaks.lastTaskCompletionDate =
        new Date();
    
      /*
       * Update longest task streak.
       */
      userScore.streaks.longestTaskStreak =
        Math.max(
          Number(
            userScore.streaks.longestTaskStreak || 0
          ),
          Number(
            userScore.streaks.currentTaskStreak || 0
          )
        );
    }

      else if (
        activityType ===
        'disease_upload'
      ) {
        userScore.stats
          .diseaseUploads += 1;
      }

      else if (
        activityType ===
        'soil_upload'
      ) {
        userScore.stats
          .soilReportsUploaded += 1;
      }

      else if (
        activityType ===
        'weather_check'
      ) {
        userScore.stats
          .weatherChecks += 1;
      }

      else if (
        activityType ===
        'forum_post'
      ) {
        userScore.stats
          .forumPosts += 1;
      }

      else if (
        activityType ===
        'forum_reply'
      ) {
        userScore.stats
          .forumReplies += 1;
      }

      else if (
        activityType ===
        'helpful_reply'
      ) {
        userScore.stats
          .helpfulReplies += 1;
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
      | ADD RECENT GAMIFICATION ACTIVITY
      |--------------------------------------------------------------------------
      |
      | Do not add a duplicate same-day login activity when the user has
      | already logged in today.
      |
      |--------------------------------------------------------------------------
      */

      if (
        loginWasCounted
      ) {
        userScore.recentActivities.unshift({
          activityType,
          points,
          description:
            description ||
            activityType
              .replace(
                /_/g,
                ' '
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
      | UPDATE LEVEL
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
      | CHECK BADGES
      |--------------------------------------------------------------------------
      */

      const newBadges =
        await checkAndAwardBadges(
          userScore
        );

      /*
      |--------------------------------------------------------------------------
      | SAVE EVERYTHING
      |--------------------------------------------------------------------------
      */

      await userScore.save();

      /*
      |--------------------------------------------------------------------------
      | NOTIFICATIONS
      |--------------------------------------------------------------------------
      */

      await sendGamificationNotifications({
        userId:
          req.user._id,

        activityType,

        points,

        totalPoints:
          userScore.totalPoints,

        previousLevel,

        currentLevel:
          userScore.level,

        currentStreak:
          userScore.streaks
            .currentLoginStreak,

        newBadges
      });

      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      res.json({
        success: true,

        pointsEarned:
          points,

        totalPoints:
          userScore.totalPoints,

        level:
          userScore.level,

        levelName:
          userScore.levelName,

        currentStreak:
          userScore.streaks
            .currentLoginStreak,

        achievements:
          userScore.achievements,

        newBadges
      });

    } catch (error) {
      console.error(
        'Error logging activity:',
        error
      );

      res.status(500).json({
        error:
          'Failed to log activity'
      });
    }
  }
);

// =========================================================
// GET USER'S SCORE AND ACHIEVEMENTS
// =========================================================

router.get(
  '/my-score',
  auth,
  async (req, res) => {
    try {
      const userScore =
        await getUserScore(
          req.user._id
        );

      /*
      |--------------------------------------------------------------------------
      | Synchronize old/incomplete records before returning them.
      |--------------------------------------------------------------------------
      */

      synchronizeAchievements(
        userScore
      );

      const levelInfo =
        calculateLevel(
          userScore.totalPoints
        );

      userScore.level =
        levelInfo.level;

      userScore.levelName =
        levelInfo.levelName;

      await userScore.save();

      res.json({
        success: true,
        score:
          userScore
      });

    } catch (error) {
      console.error(
        'Error fetching user score:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch score'
      });
    }
  }
);

// =========================================================
// GET LEADERBOARD
// =========================================================

router.get(
  '/leaderboard',
  async (req, res) => {
    try {
      const {
        limit = 50,
        period = 'all'
      } = req.query;

      let query = {};

      /*
      |--------------------------------------------------------------------------
      | Period support remains compatible with existing implementation.
      |--------------------------------------------------------------------------
      */

      if (
        period === 'week'
      ) {
        const weekAgo =
          new Date();

        weekAgo.setDate(
          weekAgo.getDate() -
            7
        );

        /*
        |--------------------------------------------------------------------------
        | UserScore currently stores lifetime points only.
        |
        | Therefore a true weekly leaderboard requires a separate
        | point-history collection and is intentionally not fabricated here.
        |--------------------------------------------------------------------------
        */
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

      const topUsers =
        await UserScore.find(
          query
        )
          .sort({
            totalPoints: -1
          })
          .limit(
            parsedLimit
          )
          .populate(
            'userId',
            'name fullName state'
          );

      /*
      |--------------------------------------------------------------------------
      | Add rank
      |--------------------------------------------------------------------------
      */

      const leaderboard =
        topUsers.map(
          (
            user,
            index
          ) => ({
            rank:
              index + 1,

            userName:
              user.userId?.fullName ||
              user.userId?.name ||
              'Anonymous',

            state:
              user.userId?.state ||
              '',

            totalPoints:
              user.totalPoints,

            level:
              user.level,

            levelName:
              user.levelName,

            badgeCount:
              Array.isArray(
                user.badges
              )
                ? user.badges.length
                : 0
          })
        );

      res.json({
        success: true,
        leaderboard
      });

    } catch (error) {
      console.error(
        'Error fetching leaderboard:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch leaderboard'
      });
    }
  }
);

// =========================================================
// GET USER'S RANK
// =========================================================

router.get(
  '/my-rank',
  auth,
  async (req, res) => {
    try {
      const userScore =
        await getUserScore(
          req.user._id
        );

      const rank =
        await UserScore.countDocuments({
          totalPoints: {
            $gt:
              userScore.totalPoints
          }
        }) + 1;

      res.json({
        success: true,

        rank,

        totalPoints:
          userScore.totalPoints,

        level:
          userScore.level,

        levelName:
          userScore.levelName
      });

    } catch (error) {
      console.error(
        'Error fetching rank:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch rank'
      });
    }
  }
);

// =========================================================
// GET ALL AVAILABLE BADGES
// =========================================================

router.get(
  '/badges',
  async (req, res) => {
    try {
      res.json({
        success: true,

        badges:
          Object.values(
            BADGES
          )
      });

    } catch (error) {
      console.error(
        'Error fetching badges:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch badges'
      });
    }
  }
);

// =========================================================
// GET LEVEL INFORMATION
// =========================================================

router.get(
  '/levels',
  async (req, res) => {
    try {
      res.json({
        success: true,

        levels:
          LEVELS
      });

    } catch (error) {
      console.error(
        'Error fetching levels:',
        error
      );

      res.status(500).json({
        error:
          'Failed to fetch levels'
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports = router;