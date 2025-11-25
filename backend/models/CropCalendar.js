const mongoose = require('mongoose');

const cropTaskSchema = new mongoose.Schema({
  taskType: {
    type: String,
    enum: ['sowing', 'irrigation', 'fertilizer', 'pesticide', 'harvesting', 'other'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  scheduledDate: {
    type: Date,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedDate: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  stage: String, // e.g., "Basal", "Vegetative", "Flowering", "Fruiting"
  notes: String
});

const cropCalendarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  crop: {
    type: String,
    required: true
  },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'year-round'],
    required: true
  },
  location: {
    state: String,
    district: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  sowingDate: {
    type: Date,
    required: true
  },
  expectedHarvestDate: Date,
  tasks: [cropTaskSchema],
  weatherConsideration: {
    avgRainfall: Number,
    avgTemperature: Number,
    avgHumidity: Number
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
cropCalendarSchema.index({ userId: 1, active: 1 });
cropCalendarSchema.index({ 'tasks.scheduledDate': 1, 'tasks.completed': 1 });

module.exports = mongoose.model('CropCalendar', cropCalendarSchema);

