# 🚀 Quick Start Guide - New Features

## Overview
This guide helps you quickly set up and test all the new features added to FarmAI.

---

## 🎯 New Features Added

1. ✅ **Smart Crop Calendar** - Automated farming task scheduler
2. ✅ **Farmer Community Forum** - Q&A platform for farmers
3. ✅ **Government Scheme Finder** - Personalized scheme recommendations
4. ✅ **Soil Report Analysis** - AI-powered soil health insights
5. ✅ **Agri News Feed** - Personalized agriculture news
6. ✅ **Gamification System** - Points, badges, and leaderboards

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (if not already installed)
cd ..
npm install
```

### Step 2: Environment Variables

Ensure your `.env` file has:

```env
MONGO_URI=mongodb://127.0.0.1:27017/farmAI
PORT=5000
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key  # For soil analysis feature
```

### Step 3: Create Upload Directories

```bash
cd backend
mkdir -p uploads/forum uploads/soil-reports
```

### Step 4: Seed Sample Data (Optional)

```bash
cd backend
node seedSampleData.js
```

This will populate:
- 5 government schemes
- 6 agriculture news articles

### Step 5: Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 🧪 Testing Each Feature

### 1. Smart Crop Calendar

**Test Steps:**
1. Navigate to `/dashboard/crop-calendar`
2. Click "Create Calendar"
3. Select crop: "Tomato"
4. Set sowing date: Today's date
5. Click "Create Calendar"
6. View automatically generated tasks

**Expected Result:**
- Calendar created with 13 automated tasks
- Tasks visible in "Upcoming Tasks" section
- Can mark tasks as complete

**Points:** Complete a task to earn 15 XP

---

### 2. Community Forum

**Test Steps:**
1. Navigate to `/dashboard/community`
2. Click "Ask Question"
3. Fill form:
   - Title: "How to control aphids in cotton?"
   - Category: "Pests & Diseases"
   - Description: "I'm seeing aphids on my cotton plants..."
   - Crop: "Cotton"
4. Click "Post Question"
5. View your post in the list
6. Click post to add a reply

**Expected Result:**
- Post created and visible
- Can upvote posts
- Can add replies
- View count increases

**Points:** Post earns 10 XP, Reply earns 8 XP

---

### 3. Government Schemes

**Test Steps:**
1. Navigate to `/dashboard/schemes`
2. View "Recommended for You" tab
3. Switch to "All Schemes" tab
4. Use search: "PM-KISAN"
5. Click on a scheme to view details

**Expected Result:**
- Personalized recommendations based on profile
- Detailed scheme information
- Application process visible
- External links work

**Note:** Recommendations work best with complete profile (state, category filled)

---

### 4. Soil Report Analysis

**Test Steps:**
1. Navigate to `/dashboard/soil-report`
2. Click "Upload Report"
3. Select a sample PDF or image
4. Fill optional details (test date, lab name)
5. Click "Upload"
6. Wait for AI analysis (30-60 seconds)

**Expected Result:**
- File uploaded successfully
- AI analysis shows:
  - Soil health summary
  - NPK status
  - Suitable crops
  - Fertilizer recommendations
  - Correction measures

**Points:** Upload earns 30 XP

**Note:** Requires valid GEMINI_API_KEY

---

### 5. Agri News Feed

**Test Steps:**
1. Navigate to `/dashboard/news`
2. View "Your Feed" (personalized)
3. Filter by category: "Market"
4. Click "Trending" tab
5. Click on a news article
6. Like the article

**Expected Result:**
- News feed shows relevant articles
- Categories filter correctly
- Trending shows popular articles
- Article details display properly

**Points:** Read article earns 2 XP

---

### 6. Gamification & Achievements

**Test Steps:**
1. View dashboard home - see gamification widget
2. Navigate to `/dashboard/achievements`
3. View tabs:
   - Overview: Level, rank, badges
   - Badges: Earned badges
   - Achievements: Progress tracking
   - Leaderboard: Top farmers
   - Activity Log: Recent actions

**Expected Result:**
- Current level and points visible
- Achievement progress shows
- Leaderboard displays rankings
- Activity log tracks all actions

**How to Earn Points:**
- Login: 5 XP (daily)
- Complete task: 15 XP
- Disease upload: 20 XP
- Soil upload: 30 XP
- Forum post: 10 XP
- Forum reply: 8 XP
- Weather check: 3 XP
- Read news: 2 XP

---

## 🎮 Gamification Levels

| Level | Name | Points Required |
|-------|------|----------------|
| 1 | Beginner Farmer | 0 |
| 2 | Learning Farmer | 100 |
| 3 | Practicing Farmer | 300 |
| 4 | Skilled Farmer | 600 |
| 5 | Expert Farmer | 1000 |
| 6 | Master Farmer | 1500 |
| 7 | Agricultural Expert | 2500 |
| 8 | Farming Legend | 5000 |

---

## 🏆 Badges to Unlock

1. **Active Farmer** 🌟 - 30 day login streak
2. **Soil Master** 🌱 - Upload 5 soil reports
3. **Disease-Free Champion** 🏆 - Detect 20 diseases
4. **Community Helper** 🤝 - 25 forum posts
5. **Expert Adviser** 👨‍🌾 - 50 helpful replies
6. **Weather Watcher** 🌤️ - Check weather 100 times

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Ensure MongoDB is running
```bash
# Start MongoDB
mongod --dbpath /path/to/data
```

### Issue: "Soil analysis not working"
**Solution:** Check Gemini API key
- Verify GEMINI_API_KEY in .env
- Get key from: https://makersuite.google.com/app/apikey

### Issue: "Images not uploading"
**Solution:** Check upload directories exist
```bash
cd backend
mkdir -p uploads/forum uploads/soil-reports
chmod 755 uploads/*
```

### Issue: "No schemes showing in recommended"
**Solution:** 
1. Complete your profile (state, category)
2. Run seed script: `node seedSampleData.js`

### Issue: "Gamification not updating"
**Solution:** 
- Ensure you're logged in
- Check browser console for errors
- Verify JWT token is valid

---

## 📱 Navigation

All new features accessible from sidebar:

- 📅 **Crop Calendar** → `/dashboard/crop-calendar`
- 👥 **Community Forum** → `/dashboard/community`
- 🏛️ **Government Schemes** → `/dashboard/schemes`
- 🌱 **Soil Reports** → `/dashboard/soil-report`
- 📰 **Agri News** → `/dashboard/news`
- 🏆 **Achievements** → `/dashboard/achievements`

---

## 🔌 API Testing

You can test APIs using curl or Postman:

### Example: Create Crop Calendar
```bash
curl -X POST http://localhost:5000/api/crop-calendar/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "crop": "tomato",
    "sowingDate": "2024-01-15",
    "location": {"state": "Maharashtra", "district": "Pune"}
  }'
```

### Example: Get Recommended Schemes
```bash
curl -X GET http://localhost:5000/api/schemes/recommended \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Example: Log Activity (Earn Points)
```bash
curl -X POST http://localhost:5000/api/gamification/log-activity \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "activityType": "task_completed",
    "description": "Completed irrigation task"
  }'
```

---

## 📊 Sample Test Scenario

Complete this scenario to test all features:

**Day 1:**
1. ✅ Login (earn 5 XP)
2. ✅ Create crop calendar for Tomato (view tasks)
3. ✅ Post question in forum (earn 10 XP)
4. ✅ Browse government schemes
5. ✅ Read 3 news articles (earn 6 XP)
6. ✅ Check achievements page (Level 1, 21 XP total)

**Day 2:**
1. ✅ Login (earn 5 XP, 2-day streak starts)
2. ✅ Upload soil report (earn 30 XP)
3. ✅ Complete 1 calendar task (earn 15 XP)
4. ✅ Reply to a forum post (earn 8 XP)
5. ✅ Check achievements (Level 2 unlocked at 79 XP!)

**Day 3-30:**
- Continue logging in daily (build streak)
- Complete tasks regularly
- Participate in community
- Unlock badges!

---

## 💡 Pro Tips

1. **Profile Completion:** Fill complete profile for better scheme recommendations
2. **Daily Logins:** Login daily to build streak and earn bonus points
3. **Community Engagement:** Helpful replies earn more points (15 XP vs 8 XP)
4. **Task Planning:** Use crop calendar to never miss important farm activities
5. **News Feed:** Check daily for timely alerts and market updates
6. **Soil Reports:** Upload regularly for season-wise recommendations
7. **Badges:** Focus on one badge at a time for faster achievement

---

## 📚 Additional Resources

- **Full Documentation:** See `NEW_FEATURES_DOCUMENTATION.md`
- **API Reference:** Check documentation for all endpoints
- **Database Models:** Review `backend/models/` for schemas
- **Frontend Components:** See `app/dashboard/` for pages

---

## 🤝 Support

Having issues? Check:
1. Console logs (browser & terminal)
2. MongoDB connection
3. Environment variables
4. Upload directory permissions
5. JWT token validity

---

## ✨ What's Next?

After testing, you can:
- Customize crop templates in `backend/routes/cropCalendar.js`
- Add more government schemes via seeder
- Integrate real news API
- Add push notifications
- Implement advanced search
- Create mobile app

---

**Happy Farming! 🌾**

---

*Last Updated: November 2024*  
*FarmAI Version: 2.0.0*

