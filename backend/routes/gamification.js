const express = require('express');
const router = express.Router();
const UserScore = require('../models/UserScore');
const auth = require('../middleware/auth');

// Point values for different activities
const ACTIVITY_POINTS = {
  login: 5,
  consecutive_login: 10,
  task_completed: 15,
  disease_upload: 20,
  soil_upload: 30,
  weather_check: 3,
  forum_post: 10,
  forum_reply: 8,
  helpful_reply: 15, // Reply with 5+ upvotes
  news_read: 2
};

// Badge definitions
const BADGES = {
  ACTIVE_FARMER: {
    badgeId: 'active_farmer',
    badgeName: 'Active Farmer',
    badgeDescription: '30 day login streak',
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

// Level thresholds
const LEVELS = [
  { level: 1, name: 'Beginner Farmer', minPoints: 0 },
  { level: 2, name: 'Learning Farmer', minPoints: 100 },
  { level: 3, name: 'Practicing Farmer', minPoints: 300 },
  { level: 4, name: 'Skilled Farmer', minPoints: 600 },
  { level: 5, name: 'Expert Farmer', minPoints: 1000 },
  { level: 6, name: 'Master Farmer', minPoints: 1500 },
  { level: 7, name: 'Agricultural Expert', minPoints: 2500 },
  { level: 8, name: 'Farming Legend', minPoints: 5000 }
];

// Get or create user score
async function getUserScore(userId) {
  let userScore = await UserScore.findOne({ userId });
  
  if (!userScore) {
    userScore = new UserScore({
      userId,
      achievements: {
        expertAdviser: { current: 0, target: 50, completed: false },
        activeFarmer: { current: 0, target: 30, completed: false },
        diseaseDetector: { current: 0, target: 20, completed: false },
        soilMaster: { current: 0, target: 5, completed: false },
        weatherWatcher: { current: 0, target: 100, completed: false },
        communityHelper: { current: 0, target: 25, completed: false }
      }
    });
    await userScore.save();
  }
  
  return userScore;
}

// Calculate level from points
function calculateLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return { level: LEVELS[i].level, levelName: LEVELS[i].name };
    }
  }
  return { level: 1, levelName: 'Beginner Farmer' };
}

// Check and award badges
async function checkAndAwardBadges(userScore) {
  const newBadges = [];
  
  // Check Active Farmer
  if (userScore.streaks.currentLoginStreak >= 30 && 
      !userScore.badges.find(b => b.badgeId === 'active_farmer')) {
    newBadges.push(BADGES.ACTIVE_FARMER);
  }
  
  // Check Soil Master
  if (userScore.stats.soilReportsUploaded >= 5 && 
      !userScore.badges.find(b => b.badgeId === 'soil_master')) {
    newBadges.push(BADGES.SOIL_MASTER);
  }
  
  // Check Disease Free
  if (userScore.stats.diseaseUploads >= 20 && 
      !userScore.badges.find(b => b.badgeId === 'disease_free')) {
    newBadges.push(BADGES.DISEASE_FREE);
  }
  
  // Check Community Helper
  if (userScore.stats.forumReplies >= 25 && 
      !userScore.badges.find(b => b.badgeId === 'community_helper')) {
    newBadges.push(BADGES.COMMUNITY_HELPER);
  }
  
  // Check Expert Adviser
  if (userScore.stats.helpfulReplies >= 50 && 
      !userScore.badges.find(b => b.badgeId === 'expert_adviser')) {
    newBadges.push(BADGES.EXPERT_ADVISER);
  }
  
  // Check Weather Watcher
  if (userScore.stats.weatherChecks >= 100 && 
      !userScore.badges.find(b => b.badgeId === 'weather_watcher')) {
    newBadges.push(BADGES.WEATHER_WATCHER);
  }
  
  // Add new badges
  if (newBadges.length > 0) {
    userScore.badges.push(...newBadges);
    await userScore.save();
  }
  
  return newBadges;
}

// Log activity and award points
router.post('/log-activity', auth, async (req, res) => {
  try {
    const { activityType, description } = req.body;
    
    if (!ACTIVITY_POINTS[activityType]) {
      return res.status(400).json({ error: 'Invalid activity type' });
    }
    
    const userScore = await getUserScore(req.user._id);
    const points = ACTIVITY_POINTS[activityType];
    
    // Add points
    userScore.totalPoints += points;
    
    // Update stats
    if (activityType === 'login') {
      userScore.stats.totalLogins += 1;
      
      // Check consecutive logins
      const lastLogin = userScore.stats.lastLoginDate;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastLogin) {
        const lastLoginDate = new Date(lastLogin);
        lastLoginDate.setHours(0, 0, 0, 0);
        const daysDiff = (today - lastLoginDate) / (1000 * 60 * 60 * 24);
        
        if (daysDiff === 1) {
          // Consecutive day
          userScore.streaks.currentLoginStreak += 1;
          if (userScore.streaks.currentLoginStreak > userScore.streaks.longestLoginStreak) {
            userScore.streaks.longestLoginStreak = userScore.streaks.currentLoginStreak;
          }
        } else if (daysDiff > 1) {
          // Streak broken
          userScore.streaks.currentLoginStreak = 1;
        }
      } else {
        userScore.streaks.currentLoginStreak = 1;
      }
      
      userScore.stats.lastLoginDate = new Date();
    } else if (activityType === 'task_completed') {
      userScore.stats.tasksCompleted += 1;
    } else if (activityType === 'disease_upload') {
      userScore.stats.diseaseUploads += 1;
      userScore.achievements.diseaseDetector.current += 1;
    } else if (activityType === 'soil_upload') {
      userScore.stats.soilReportsUploaded += 1;
      userScore.achievements.soilMaster.current += 1;
    } else if (activityType === 'weather_check') {
      userScore.stats.weatherChecks += 1;
      userScore.achievements.weatherWatcher.current += 1;
    } else if (activityType === 'forum_post') {
      userScore.stats.forumPosts += 1;
    } else if (activityType === 'forum_reply') {
      userScore.stats.forumReplies += 1;
      userScore.achievements.communityHelper.current += 1;
    } else if (activityType === 'helpful_reply') {
      userScore.stats.helpfulReplies += 1;
      userScore.achievements.expertAdviser.current += 1;
    }
    
    // Log activity
    userScore.recentActivities.unshift({
      activityType,
      points,
      description: description || activityType.replace('_', ' '),
      date: new Date()
    });
    
    // Keep only last 50 activities
    if (userScore.recentActivities.length > 50) {
      userScore.recentActivities = userScore.recentActivities.slice(0, 50);
    }
    
    // Update level
    const levelInfo = calculateLevel(userScore.totalPoints);
    userScore.level = levelInfo.level;
    userScore.levelName = levelInfo.levelName;
    
    await userScore.save();
    
    // Check for new badges
    const newBadges = await checkAndAwardBadges(userScore);
    
    res.json({
      success: true,
      pointsEarned: points,
      totalPoints: userScore.totalPoints,
      level: userScore.level,
      levelName: userScore.levelName,
      newBadges
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// Get user's score and achievements
router.get('/my-score', auth, async (req, res) => {
  try {
    const userScore = await getUserScore(req.user._id);
    
    res.json({
      success: true,
      score: userScore
    });
  } catch (error) {
    console.error('Error fetching user score:', error);
    res.status(500).json({ error: 'Failed to fetch score' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50, period = 'all' } = req.query;
    
    let query = {};
    
    // Filter by period if needed
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      // This would require tracking points by date - simplified for now
    }
    
    const topUsers = await UserScore.find(query)
      .sort({ totalPoints: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name state');
    
    // Add rank
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      userName: user.userId?.name || 'Anonymous',
      state: user.userId?.state || '',
      totalPoints: user.totalPoints,
      level: user.level,
      levelName: user.levelName,
      badgeCount: user.badges.length
    }));
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get user's rank
router.get('/my-rank', auth, async (req, res) => {
  try {
    const userScore = await getUserScore(req.user._id);
    
    const rank = await UserScore.countDocuments({
      totalPoints: { $gt: userScore.totalPoints }
    }) + 1;
    
    res.json({
      success: true,
      rank,
      totalPoints: userScore.totalPoints,
      level: userScore.level
    });
  } catch (error) {
    console.error('Error fetching rank:', error);
    res.status(500).json({ error: 'Failed to fetch rank' });
  }
});

// Get all available badges
router.get('/badges', async (req, res) => {
  try {
    res.json({
      success: true,
      badges: Object.values(BADGES)
    });
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get level information
router.get('/levels', async (req, res) => {
  try {
    res.json({
      success: true,
      levels: LEVELS
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({ error: 'Failed to fetch levels' });
  }
});

module.exports = router;

