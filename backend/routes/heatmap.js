/* eslint-env node */
// backend/routes/heatmap.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

// Maharashtra districts only
const MAHARASHTRA_DISTRICTS = [
  "PUNE", "NASHIK", "AHMEDNAGAR", "KOLHAPUR", "SATARA", "SANGLI",
  "SOLAPUR", "AURANGABAD", "BEED", "JALGAON", "DHULE", "NANDURBAR",
  "NAGPUR", "WARDHA", "AMRAVATI", "YAVATMAL", "AKOLA", "BULDHANA",
  "OSMANABAD", "LATUR", "PARBHANI", "HINGOLI", "RAIGAD", "RATNAGIRI",
  "SINDHUDURG", "MUMBAI", "THANE", "NAVI MUMBAI", "KALYAN", "MUMBAI SUBURBAN"
];

router.get("/", async (req, res) => {
  try {
    const { crop } = req.query;

    let url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=5000`;

    if (crop) url += `&filters[commodity]=${crop.toUpperCase()}`;
    
    // Filter by Maharashtra state
    url += `&filters[state]=MAHARASHTRA`;

    const api = await axios.get(url);
    const recs = api.data.records || [];

    // Group by district (only Maharashtra districts)
    const byDistrict = {};
    recs.forEach(r => {
      const d = r.district?.toUpperCase() || "";
      const p = Number(r.modal_price);
      
      // Skip if no district, no price, or not in Maharashtra districts list
      if (!d || !p) return;
      if (!MAHARASHTRA_DISTRICTS.includes(d)) return;
      
      if (!byDistrict[d]) byDistrict[d] = { sum: 0, count: 0 };
      byDistrict[d].sum += p;
      byDistrict[d].count++;
    });

    // Convert to array and format district names properly
    const heat = Object.keys(byDistrict).map(d => ({
      district: d.charAt(0) + d.slice(1).toLowerCase(), // Proper case
      avg: Math.round(byDistrict[d].sum / byDistrict[d].count)
    })).sort((a, b) => b.avg - a.avg); // Sort by price (highest first)

    res.json({ success: true, data: heat });

  } catch (err) {
    console.error("HEATMAP ERROR:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
