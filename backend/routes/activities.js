const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const auth = require('../middleware/auth');

// Helper function to log activity (can be used by other routes)
async function logActivity(userId, activityData) {
  try {
    if (!userId) {
      // Skip logging if no user ID provided
      console.log('⚠️ Activity logging skipped - no userId provided');
      return null;
    }
    
    // Convert userId to ObjectId if it's a string
    const mongoose = require('mongoose');
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId)
      : userId;
    
    const activity = new UserActivity({
      userId: userIdObj,
      ...activityData
    });
    
    const saved = await activity.save();
    console.log('✅ Activity logged:', {
      id: saved._id,
      type: saved.activityType,
      title: saved.title,
      userId: saved.userId
    });
    return saved;
  } catch (error) {
    console.error('❌ Error logging activity:', error.message);
    console.error('Activity data:', { userId, activityData });
    // Don't throw - logging should not break main functionality
    return null;
  }
}

// Helper function to extract user ID from request (optional auth)
async function getUserIdFromRequest(req) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return null;
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "farmai_secret");
    return decoded.id;
  } catch (error) {
    // Token invalid or expired - return null (optional logging)
    return null;
  }
}

// GET /api/activities - Get user's activity history
router.get('/', auth, async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const userId = req.user._id;

    // Ensure userId is ObjectId
    const mongoose = require('mongoose');
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId)
      : userId;

    const query = { userId: userIdObj };
    if (type && type !== 'all') {
      query.activityType = type;
    }
    
    console.log('🔍 Query:', JSON.stringify(query));

    const activities = await UserActivity.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('relatedId', 'title name schemeName')
      .lean();

    const total = await UserActivity.countDocuments(query);
    

    // Format dates for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity._id.toString(),
      type: activity.activityType,
      title: activity.title,
      description: activity.description,
      date: activity.createdAt.toISOString().split('T')[0],
      time: activity.createdAt.toTimeString().split(' ')[0].substring(0, 5),
      status: activity.status,
      result: activity.result,
      metadata: activity.metadata || {},
      relatedId: activity.relatedId ? activity.relatedId.toString() : null
    }));

    res.json({
      success: true,
      activities: formattedActivities,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/stats - Get activity statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Ensure userId is ObjectId
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) 
      ? (typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId)
      : userId;

    const stats = await UserActivity.aggregate([
      { $match: { userId: userIdObj } },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(stat => {
      statsMap[stat._id] = stat.count;
    });

    res.json({
      success: true,
      stats: statsMap
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// POST /api/activities/log - Log an activity from frontend
router.post('/log', auth, async (req, res) => {
  try {
    const { activityType, title, description, status, result, metadata } = req.body;
    
    console.log('📝 Log activity request:', { 
      userId: req.user._id, 
      activityType, 
      title,
      description: description ? description.substring(0, 100) : 'NO DESCRIPTION',
      descriptionLength: description ? description.length : 0
    });
    
    // Validate required fields - check for truthy and non-empty strings
    if (!activityType || typeof activityType !== 'string' || !activityType.trim()) {
      console.error('❌ Invalid activityType:', activityType);
      return res.status(400).json({ 
        success: false, 
        error: 'activityType is required and must be a non-empty string' 
      });
    }
    
    if (!title || typeof title !== 'string' || !title.trim()) {
      console.error('❌ Invalid title:', title);
      return res.status(400).json({ 
        success: false, 
        error: 'title is required and must be a non-empty string' 
      });
    }
    
    if (!description || typeof description !== 'string' || !description.trim()) {
      console.error('❌ Invalid description:', description);
      return res.status(400).json({ 
        success: false, 
        error: 'description is required and must be a non-empty string' 
      });
    }
    
    // Trim whitespace from fields
    const trimmedActivityType = activityType.trim();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    
    console.log('📝 Calling logActivity with:', {
      userId: req.user._id,
      activityType: trimmedActivityType,
      title: trimmedTitle,
      description: trimmedDescription.substring(0, 50) + '...',
      descriptionLength: trimmedDescription.length
    });
    
    const activity = await logActivity(req.user._id, {
      activityType: trimmedActivityType,
      title: trimmedTitle,
      description: trimmedDescription,
      status: status || 'completed',
      result,
      metadata: metadata || {}
    });
    
    if (activity) {
      console.log('✅ Activity logged successfully via /log endpoint:', {
        id: activity._id,
        type: activity.activityType,
        title: activity.title
      });
      res.json({
        success: true,
        message: 'Activity logged successfully',
        activity: {
          id: activity._id,
          type: activity.activityType,
          title: activity.title
        }
      });
    } else {
      console.error('❌ Failed to log activity - logActivity returned null. Check logActivity function.');
      res.status(500).json({ 
        success: false, 
        error: 'Failed to save activity to database. Check server logs for details.' 
      });
    }
  } catch (error) {
    console.error('❌ Error logging activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to create a sample activity (for debugging)
router.post('/test', auth, async (req, res) => {
  try {
    const testActivity = await logActivity(req.user._id, {
      activityType: 'chat',
      title: 'Test Activity',
      description: 'This is a test activity to verify logging works',
      status: 'completed',
      result: 'Test successful',
      metadata: { test: true }
    });
    
    res.json({
      success: true,
      message: 'Test activity created',
      activity: testActivity
    });
  } catch (error) {
    console.error('Error creating test activity:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the logActivity function for use in other routes
module.exports = { router, logActivity, getUserIdFromRequest };

