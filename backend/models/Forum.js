const mongoose = require('mongoose');

const forumReplySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  images: [String], // Array of image URLs
  isModeratorAnswer: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const forumPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userLocation: String,
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: ['pests', 'fertilizer', 'weather', 'machinery', 'seeds', 'irrigation', 'market', 'general'],
    required: true
  },
  crop: String, // Related crop if any
  images: [String], // Array of image URLs
  replies: [forumReplySchema],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  tags: [String],
  flagged: {
    type: Boolean,
    default: false
  },
  flagReason: String
}, {
  timestamps: true
});

// Indexes
forumPostSchema.index({ category: 1, createdAt: -1 });
forumPostSchema.index({ userId: 1 });
forumPostSchema.index({ status: 1, createdAt: -1 });
forumPostSchema.index({ tags: 1 });

module.exports = mongoose.model('ForumPost', forumPostSchema);

