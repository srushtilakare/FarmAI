const mongoose = require('mongoose');

/*
|--------------------------------------------------------------------------
| USER ACTIVITY SCHEMA
|--------------------------------------------------------------------------
|
| Stores the feature-level activity history.
|
| Most feature routes use names such as:
|
| - disease-detection
| - soil-report
| - weather-alert
| - community-forum
| - crop-calendar
|
| Gamification converts these into canonical UserScore activity types.
|
|--------------------------------------------------------------------------
*/

const userActivitySchema = new mongoose.Schema(
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

      index: true
    },

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY TYPE
    |--------------------------------------------------------------------------
    */

    activityType: {
      type: String,

      enum: [
        'disease-detection',
        'crop-advisory',
        'crop-calendar',
        'community-forum',
        'government-scheme',
        'soil-report',
        'weather-alert',
        'market-prices',
        'agri-news',
        'chat',
        'profile-update',
        'settings-change',
        'login',
        'logout',

        /*
        |--------------------------------------------------------------------------
        | Helpful forum reply
        |--------------------------------------------------------------------------
        |
        | Kept for compatibility with the existing forum route.
        |
        |--------------------------------------------------------------------------
        */

        'helpful_reply'
      ],

      required: true
    },

    /*
    |--------------------------------------------------------------------------
    | TITLE
    |--------------------------------------------------------------------------
    */

    title: {
      type: String,

      required: true,

      trim: true
    },

    /*
    |--------------------------------------------------------------------------
    | DESCRIPTION
    |--------------------------------------------------------------------------
    */

    description: {
      type: String,

      required: true,

      trim: true
    },

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    status: {
      type: String,

      enum: [
        'completed',
        'active',
        'viewed',
        'failed'
      ],

      default: 'completed'
    },

    /*
    |--------------------------------------------------------------------------
    | RESULT
    |--------------------------------------------------------------------------
    */

    result: {
      type: String,

      default: ''
    },

    /*
    |--------------------------------------------------------------------------
    | METADATA
    |--------------------------------------------------------------------------
    */

    metadata: {
      type: mongoose.Schema.Types.Mixed,

      default: {}
    },

    /*
    |--------------------------------------------------------------------------
    | RELATED DOCUMENT
    |--------------------------------------------------------------------------
    */

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,

      refPath: 'relatedModel'
    },

    relatedModel: {
      type: String,

      enum: [
        'DiseaseDetection',
        'CropCalendar',
        'ForumPost',
        'GovernmentScheme',
        'SoilReport',
        'AgriNews',
        'Weather',
        null
      ],

      default: null
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

userActivitySchema.index({
  userId: 1,
  createdAt: -1
});

userActivitySchema.index({
  activityType: 1,
  createdAt: -1
});

userActivitySchema.index({
  createdAt: -1
});

/*
|--------------------------------------------------------------------------
| MODEL
|--------------------------------------------------------------------------
*/

module.exports =
  mongoose.model(
    'UserActivity',
    userActivitySchema
  );