const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: ['login', 'task_completed', 'disease_upload', 'soil_upload', 'weather_check', 'forum_post', 'forum_reply', 'news_read'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  description: String,
  date: {
    type: Date,
    default: Date.now
  }
});

const badgeSchema = new mongoose.Schema({
  badgeId: {
    type: String,
    required: true
  },
  badgeName: {
    type: String,
    required: true
  },
  badgeDescription: String,
  badgeIcon: String,
  earnedDate: {
    type: Date,
    default: Date.now
  },
  category: {
    type: String,
    enum: ['irrigation', 'soil', 'disease', 'activity', 'community', 'expert']
  }
});

const userScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Overall score
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
    default: 'Beginner Farmer'
  },
  
  // Activity counters
  stats: {
    totalLogins: { type: Number, default: 0 },
    consecutiveLogins: { type: Number, default: 0 },
    lastLoginDate: Date,
    tasksCompleted: { type: Number, default: 0 },
    diseaseUploads: { type: Number, default: 0 },
    soilReportsUploaded: { type: Number, default: 0 },
    weatherChecks: { type: Number, default: 0 },
    forumPosts: { type: Number, default: 0 },
    forumReplies: { type: Number, default: 0 },
    helpfulReplies: { type: Number, default: 0 } // Replies with upvotes
  },
  
  // Badges earned
  badges: [badgeSchema],
  
  // Activity log
  recentActivities: [activityLogSchema],
  
  // Streaks
  streaks: {
    currentLoginStreak: { type: Number, default: 0 },
    longestLoginStreak: { type: Number, default: 0 },
    currentTaskStreak: { type: Number, default: 0 },
    longestTaskStreak: { type: Number, default: 0 }
  },
  
  // Ranking
  rank: Number, // Among all users
  
  // Achievements progress
  achievements: {
    expertAdviser: { current: Number, target: Number, completed: Boolean }, // 50 helpful replies
    activeFarmer: { current: Number, target: Number, completed: Boolean }, // 30 day login streak
    diseaseDetector: { current: Number, target: Number, completed: Boolean }, // 20 disease detections
    soilMaster: { current: Number, target: Number, completed: Boolean }, // 5 soil reports
    weatherWatcher: { current: Number, target: Number, completed: Boolean }, // 100 weather checks
    communityHelper: { current: Number, target: Number, completed: Boolean } // 25 forum posts
  }
}, {
  timestamps: true
});

// Indexes
userScoreSchema.index({ totalPoints: -1 }); // For leaderboard
userScoreSchema.index({ userId: 1 });

module.exports = mongoose.model('UserScore', userScoreSchema);

