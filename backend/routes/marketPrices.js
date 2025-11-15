// backend/routes/marketPrices.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Example base URL for CEDA/AGMARKNET data
const BASE_URL = 'https://api.ceda.ashoka.edu.in/api/agmarknet'; // adjust as per doc

router.get('/', async (req, res) => {
  try {
    const { state, market, crop } = req.query;

    // Build query for API
    const params = {};
    if (state) params.state = state;
    if (market) params.market = market;
    if (crop) params.commodity = crop;

    const apiRes = await axios.get(BASE_URL, { params });
    const data = apiRes.data;

    // Example transform: pick most recent entry for each crop/market
    const transformed = data.map(item => ({
      crop: item.Commodity,
      variety: item.Variety || 'N/A',
      currentPrice: Number(item.Modal_Price),
      previousPrice: null,   // if not available
      change: null,          // computed if previousPrice available
      market: item.Market,
      date: item.Transaction_Date,
      unit: item.Unit   // e.g., ‘Quintal’
    }));

    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error('Error fetching market prices', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
