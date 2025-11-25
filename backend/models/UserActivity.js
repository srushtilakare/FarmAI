const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  activityType: {
    type: String,
    required: true,
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
      'logout'
    ],
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'active', 'viewed', 'failed'],
    default: 'completed'
  },
  result: String, // Additional result information
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Reference to related document (e.g., disease detection ID, forum post ID)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel'
  },
  relatedModel: {
    type: String,
    enum: ['DiseaseDetection', 'CropCalendar', 'ForumPost', 'GovernmentScheme', 'SoilReport', 'AgriNews', null]
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);

