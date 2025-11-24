const mongoose = require('mongoose');

const agriNewsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['weather', 'market', 'pest-alert', 'government', 'crop-advisory', 'technology', 'general'],
    required: true
  },
  subCategory: String, // Specific crop, region, etc.
  
  // Targeting
  relevantStates: [String], // Empty means all states
  relevantCrops: [String], // Empty means all crops
  
  // Media
  imageUrl: String,
  videoUrl: String,
  
  // Source
  source: {
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['official', 'news', 'research', 'internal']
    }
  },
  
  // Metadata
  publishDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: Date, // For time-sensitive alerts
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium'
  },
  tags: [String],
  
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Status
  active: {
    type: Boolean,
    default: true
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
agriNewsSchema.index({ category: 1, publishDate: -1 });
agriNewsSchema.index({ relevantStates: 1, active: 1 });
agriNewsSchema.index({ relevantCrops: 1, active: 1 });
agriNewsSchema.index({ priority: 1, publishDate: -1 });
agriNewsSchema.index({ expiryDate: 1 });

module.exports = mongoose.model('AgriNews', agriNewsSchema);

