const express = require('express');
const router = express.Router();
const GovernmentScheme = require('../models/GovernmentScheme');
const auth = require('../middleware/auth');
const { logActivity, getUserIdFromRequest } = require('./activities');

// Get schemes based on user profile
router.get('/recommended', auth, async (req, res) => {
  try {
    const { state, category, farmerType, gender } = req.user;
    
    const query = {
      active: true,
      $or: [
        { state: { $in: [state, 'all'] } },
        { state: 'all' }
      ]
    };
    
    // Add category filter if available
    if (category) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { category: { $in: [category, 'all'] } },
          { category: 'all' }
        ]
      });
    }
    
    const schemes = await GovernmentScheme.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(50);
    
    // Further filter based on farmer type and gender
    const filteredSchemes = schemes.filter(scheme => {
      const typeMatch = !farmerType || 
                       scheme.farmerType.includes('all') || 
                       scheme.farmerType.includes(farmerType);
      
      const genderMatch = !gender || 
                         scheme.gender.includes('all') || 
                         scheme.gender.includes(gender);
      
      return typeMatch && genderMatch;
    });
    
    res.json({
      success: true,
      schemes: filteredSchemes,
      count: filteredSchemes.length
    });
  } catch (error) {
    console.error('Error fetching recommended schemes:', error);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// Get all schemes with filters
router.get('/all', async (req, res) => {
  try {
    const { state, category, schemeType, search, page = 1, limit = 20 } = req.query;
    
    const query = { active: true };
    
    if (state) {
      query.$or = [
        { state: state },
        { state: 'all' }
      ];
    }
    
    if (category) {
      query.category = { $in: [category, 'all'] };
    }
    
    if (schemeType) {
      query.schemeType = schemeType;
    }
    
    if (search) {
      query.$or = [
        { schemeName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { benefits: { $regex: search, $options: 'i' } }
      ];
    }
    
    const schemes = await GovernmentScheme.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const count = await GovernmentScheme.countDocuments(query);
    
    res.json({
      success: true,
      schemes,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalSchemes: count
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ error: 'Failed to fetch schemes' });
  }
});

// Get scheme by ID
router.get('/:schemeId', async (req, res) => {
  try {
    const scheme = await GovernmentScheme.findById(req.params.schemeId);
    
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' });
    }
    
    // Log activity (optional - only if user is authenticated)
    const userId = await getUserIdFromRequest(req);
    if (userId) {
      await logActivity(userId, {
        activityType: 'government-scheme',
        title: `Scheme Viewed - ${scheme.schemeName}`,
        description: `Viewed government scheme: ${scheme.schemeName}`,
        status: 'viewed',
        result: 'Scheme details viewed',
        relatedId: scheme._id,
        relatedModel: 'GovernmentScheme',
        metadata: { schemeType: scheme.schemeType, ministry: scheme.ministry }
      });
    }
    
    res.json({ success: true, scheme });
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ error: 'Failed to fetch scheme' });
  }
});

// Search schemes
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const schemes = await GovernmentScheme.find({
      active: true,
      $or: [
        { schemeName: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { benefits: { $regex: q, $options: 'i' } },
        { ministry: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);
    
    res.json({ success: true, schemes });
  } catch (error) {
    console.error('Error searching schemes:', error);
    res.status(500).json({ error: 'Failed to search schemes' });
  }
});

// Admin: Create a new scheme (protected - would need admin middleware)
router.post('/admin/create', async (req, res) => {
  try {
    const scheme = new GovernmentScheme(req.body);
    await scheme.save();
    
    res.json({
      success: true,
      message: 'Scheme created successfully',
      scheme
    });
  } catch (error) {
    console.error('Error creating scheme:', error);
    res.status(500).json({ error: 'Failed to create scheme' });
  }
});

// Get scheme types/categories
router.get('/meta/types', async (req, res) => {
  try {
    const types = await GovernmentScheme.distinct('schemeType');
    const categories = await GovernmentScheme.distinct('category');
    const states = await GovernmentScheme.distinct('state');
    
    res.json({
      success: true,
      schemeTypes: types,
      categories: categories.filter(c => c !== 'all'),
      states: states.filter(s => s !== 'all')
    });
  } catch (error) {
    console.error('Error fetching scheme metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

module.exports = router;

