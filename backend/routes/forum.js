const express = require('express');
const router = express.Router();
const ForumPost = require('../models/Forum');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { logActivity } = require('./activities');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/forum/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Create a new forum post
router.post('/posts', auth, upload.array('images', 3), async (req, res) => {
  try {
    const { title, content, category, crop, tags } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }
    
    const images = req.files ? req.files.map(file => `/uploads/forum/${file.filename}`) : [];
    
    const forumPost = new ForumPost({
      userId: req.user._id,
      userName: req.user.name || 'Anonymous Farmer',
      userLocation: req.user.state || '',
      title,
      content,
      category,
      crop,
      images,
      tags: tags ? JSON.parse(tags) : []
    });
    
    await forumPost.save();
    
    // Log activity
    await logActivity(req.user._id, {
      activityType: 'community-forum',
      title: `Forum Post Created - ${title}`,
      description: `Created forum post in ${category} category`,
      status: 'completed',
      result: 'Post published successfully',
      relatedId: forumPost._id,
      relatedModel: 'ForumPost',
      metadata: { category, crop, hasImages: images.length > 0 }
    });
    
    res.json({
      success: true,
      message: 'Post created successfully',
      post: forumPost
    });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all forum posts with pagination and filters
router.get('/posts', async (req, res) => {
  try {
    const { 
      category, 
      crop, 
      status, 
      search,
      page = 1, 
      limit = 20,
      sort = 'recent' 
    } = req.query;
    
    const query = {};
    if (category) query.category = category;
    if (crop) query.crop = crop;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    let sortOption = {};
    if (sort === 'recent') sortOption = { createdAt: -1 };
    else if (sort === 'popular') sortOption = { views: -1, 'upvotes': -1 };
    else if (sort === 'answered') sortOption = { 'replies': -1 };
    
    const posts = await ForumPost.find(query)
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Add replyCount to each post and remove full replies array for performance
    const postsWithCount = posts.map(post => {
      const postObj = post.toObject();
      const replyCount = postObj.replies ? postObj.replies.length : 0;
      postObj.replyCount = replyCount;
      delete postObj.replies; // Remove full replies array to keep response light
      return postObj;
    });
    
    
    const count = await ForumPost.countDocuments(query);
    
    res.json({
      success: true,
      posts: postsWithCount,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalPosts: count
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get a single post with all replies
router.get('/posts/:postId', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    res.json({ success: true, post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Add a reply to a post
router.post('/posts/:postId/replies', auth, upload.array('images', 2), async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const post = await ForumPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const images = req.files ? req.files.map(file => `/uploads/forum/${file.filename}`) : [];
    
    const reply = {
      userId: req.user._id,
      userName: req.user.name || 'Anonymous Farmer',
      content,
      images
    };
    
    post.replies.push(reply);
    
    // Update post status if it was open
    if (post.status === 'open' && post.replies.length > 0) {
      post.status = 'answered';
    }
    
    await post.save();
    
    // Log activity
    await logActivity(req.user._id, {
      activityType: 'community-forum',
      title: `Reply Added - ${post.title}`,
      description: `Added reply to forum post: ${post.title}`,
      status: 'completed',
      result: 'Reply published successfully',
      relatedId: post._id,
      relatedModel: 'ForumPost',
      metadata: { postTitle: post.title, category: post.category, hasImages: images.length > 0 }
    });
    
    res.json({
      success: true,
      message: 'Reply added successfully',
      reply: post.replies[post.replies.length - 1]
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Upvote a post
router.post('/posts/:postId/upvote', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const userId = req.user._id;
    const upvoteIndex = post.upvotes.indexOf(userId);
    
    if (upvoteIndex > -1) {
      // Remove upvote
      post.upvotes.splice(upvoteIndex, 1);
    } else {
      // Add upvote
      post.upvotes.push(userId);
    }
    
    await post.save();
    
    res.json({
      success: true,
      upvoted: upvoteIndex === -1,
      upvoteCount: post.upvotes.length
    });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ error: 'Failed to upvote post' });
  }
});

// Upvote a reply
router.post('/posts/:postId/replies/:replyId/upvote', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const reply = post.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    const userId = req.user._id;
    const upvoteIndex = reply.upvotes.indexOf(userId);
    
    if (upvoteIndex > -1) {
      reply.upvotes.splice(upvoteIndex, 1);
    } else {
      reply.upvotes.push(userId);
    }
    
    await post.save();
    
    res.json({
      success: true,
      upvoted: upvoteIndex === -1,
      upvoteCount: reply.upvotes.length
    });
  } catch (error) {
    console.error('Error upvoting reply:', error);
    res.status(500).json({ error: 'Failed to upvote reply' });
  }
});

// Get user's posts
router.get('/my-posts', auth, async (req, res) => {
  try {
    const posts = await ForumPost.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-replies');
    
    res.json({ success: true, posts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Flag a post
router.post('/posts/:postId/flag', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const post = await ForumPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.flagged = true;
    post.flagReason = reason || 'Reported by user';
    await post.save();
    
    res.json({ success: true, message: 'Post flagged for review' });
  } catch (error) {
    console.error('Error flagging post:', error);
    res.status(500).json({ error: 'Failed to flag post' });
  }
});

// Get popular tags
router.get('/tags', async (req, res) => {
  try {
    const posts = await ForumPost.find({}, 'tags');
    const tagCounts = {};
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
    
    res.json({ success: true, tags: sortedTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

module.exports = router;

