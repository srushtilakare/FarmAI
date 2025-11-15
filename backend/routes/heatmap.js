// backend/routes/heatmap.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

router.get("/", async (req, res) => {
  try {
    const { crop } = req.query;

    let url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=5000`;

    if (crop) url += `&filters[commodity]=${crop.toUpperCase()}`;

    const api = await axios.get(url);
    const recs = api.data.records || [];

    // group by district
    const byDistrict = {};
    recs.forEach(r => {
      const d = r.district?.toUpperCase() || "";
      const p = Number(r.modal_price);
      if (!d || !p) return;
      if (!byDistrict[d]) byDistrict[d] = { sum: 0, count: 0 };
      byDistrict[d].sum += p;
      byDistrict[d].count++;
    });

    const heat = Object.keys(byDistrict).map(d => ({
      district: d,
      avg: Math.round(byDistrict[d].sum / byDistrict[d].count)
    }));

    res.json({ success: true, data: heat });

  } catch (err) {
    console.error("HEATMAP ERROR:", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
