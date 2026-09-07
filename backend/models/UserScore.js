const mongoose = require('mongoose');

/*
|--------------------------------------------------------------------------
| ACTIVITY LOG SCHEMA
|--------------------------------------------------------------------------
|
| Stores canonical gamification activities shown on the Achievements page.
|
|--------------------------------------------------------------------------
*/

const activityLogSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,

      enum: [
        'login',
        'task_completed',
        'disease_upload',
        'soil_upload',
        'weather_check',
        'forum_post',
        'forum_reply',
        'helpful_reply',
        'news_read'
      ],

      required: true
    },

    points: {
      type: Number,
      required: true
    },

    description: {
      type: String
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

/*
|--------------------------------------------------------------------------
| BADGE SCHEMA
|--------------------------------------------------------------------------
*/

const badgeSchema = new mongoose.Schema(
  {
    badgeId: {
      type: String,
      required: true
    },

    badgeName: {
      type: String,
      required: true
    },

    badgeDescription: {
      type: String
    },

    badgeIcon: {
      type: String
    },

    earnedDate: {
      type: Date,
      default: Date.now
    },

    category: {
      type: String,

      enum: [
        'irrigation',
        'soil',
        'disease',
        'activity',
        'community',
        'expert'
      ]
    }
  },
  {
    _id: false
  }
);

/*
|--------------------------------------------------------------------------
| USER SCORE SCHEMA
|--------------------------------------------------------------------------
*/

const userScoreSchema = new mongoose.Schema(
  {
    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    userId: {
      type: mongoose.Schema.Types.ObjectId,

      ref: 'User',

      required: true,

      unique: true
    },

    /*
    |--------------------------------------------------------------------------
    | OVERALL SCORE
    |--------------------------------------------------------------------------
    */

    totalPoints: {
      type: Number,

      default: 0
    },

    level: {
      type: Number,

      default: 1
    },

    levelName: {
      type: String,

      default: 'Seedling'
    },

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY COUNTERS
    |--------------------------------------------------------------------------
    */

    stats: {
      /*
      |--------------------------------------------------------------------------
      | Login statistics
      |--------------------------------------------------------------------------
      */

      totalLogins: {
        type: Number,

        default: 0
      },

      consecutiveLogins: {
        type: Number,

        default: 0
      },

      lastLoginDate: {
        type: Date
      },

      /*
      |--------------------------------------------------------------------------
      | Task statistics
      |--------------------------------------------------------------------------
      */

      tasksCompleted: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Disease statistics
      |--------------------------------------------------------------------------
      */

      diseaseUploads: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Soil statistics
      |--------------------------------------------------------------------------
      */

      soilReportsUploaded: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Weather statistics
      |--------------------------------------------------------------------------
      */

      weatherChecks: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Forum statistics
      |--------------------------------------------------------------------------
      */

      forumPosts: {
        type: Number,

        default: 0
      },

      forumReplies: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | Helpful reply statistics
      |--------------------------------------------------------------------------
      */

      helpfulReplies: {
        type: Number,

        default: 0
      }
    },

    /*
    |--------------------------------------------------------------------------
    | BADGES
    |--------------------------------------------------------------------------
    */

    badges: {
      type: [badgeSchema],

      default: []
    },

    /*
    |--------------------------------------------------------------------------
    | RECENT GAMIFICATION ACTIVITIES
    |--------------------------------------------------------------------------
    */

    recentActivities: {
      type: [activityLogSchema],

      default: []
    },

    /*
    |--------------------------------------------------------------------------
    | STREAKS
    |--------------------------------------------------------------------------
    */

    streaks: {
      /*
      |--------------------------------------------------------------------------
      | LOGIN STREAK
      |--------------------------------------------------------------------------
      */

      currentLoginStreak: {
        type: Number,

        default: 0
      },

      longestLoginStreak: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | TASK STREAK
      |--------------------------------------------------------------------------
      |
      | currentTaskStreak represents consecutive CALENDAR DAYS on which
      | at least one farming task was completed.
      |
      | Multiple tasks completed on the same day do NOT increase the
      | streak multiple times.
      |
      |--------------------------------------------------------------------------
      */

      currentTaskStreak: {
        type: Number,

        default: 0
      },

      longestTaskStreak: {
        type: Number,

        default: 0
      },

      /*
      |--------------------------------------------------------------------------
      | LAST TASK COMPLETION DATE
      |--------------------------------------------------------------------------
      |
      | Required to calculate a true day-based task streak.
      |
      | Existing UserScore documents will remain compatible because
      | this field is optional for old records.
      |
      |--------------------------------------------------------------------------
      */

      lastTaskCompletionDate: {
        type: Date
      }
    },

    /*
    |--------------------------------------------------------------------------
    | RANKING
    |--------------------------------------------------------------------------
    */

    rank: {
      type: Number
    },

    /*
    |--------------------------------------------------------------------------
    | ACHIEVEMENTS
    |--------------------------------------------------------------------------
    */

    achievements: {
      /*
      |--------------------------------------------------------------------------
      | Expert Adviser
      |--------------------------------------------------------------------------
      | Target: 50 helpful replies
      |--------------------------------------------------------------------------
      */

      expertAdviser: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 50
        },

        completed: {
          type: Boolean,

          default: false
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Active Farmer
      |--------------------------------------------------------------------------
      | Target: 30 day login streak
      |--------------------------------------------------------------------------
      */

      activeFarmer: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 30
        },

        completed: {
          type: Boolean,

          default: false
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Disease Detector
      |--------------------------------------------------------------------------
      | Target: 20 disease detections
      |--------------------------------------------------------------------------
      */

      diseaseDetector: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 20
        },

        completed: {
          type: Boolean,

          default: false
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Soil Master
      |--------------------------------------------------------------------------
      | Target: 5 soil reports
      |--------------------------------------------------------------------------
      */

      soilMaster: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 5
        },

        completed: {
          type: Boolean,

          default: false
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Weather Watcher
      |--------------------------------------------------------------------------
      | Target: 100 weather checks
      |--------------------------------------------------------------------------
      */

      weatherWatcher: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 100
        },

        completed: {
          type: Boolean,

          default: false
        }
      },

      /*
      |--------------------------------------------------------------------------
      | Community Helper
      |--------------------------------------------------------------------------
      | Target: 25 forum replies
      |--------------------------------------------------------------------------
      */

      communityHelper: {
        current: {
          type: Number,

          default: 0
        },

        target: {
          type: Number,

          default: 25
        },

        completed: {
          type: Boolean,

          default: false
        }
      }
    }
  },
  {
    timestamps: true
  }
);

/*
|--------------------------------------------------------------------------
| INDEXES
|--------------------------------------------------------------------------
*/

userScoreSchema.index({
  totalPoints: -1
});

userScoreSchema.index({
  userId: 1
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

module.exports =
  mongoose.model(
    'UserScore',
    userScoreSchema
  );