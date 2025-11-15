// backend/routes/marketPrices.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

router.get("/", async (req, res) => {
  try {
    const { district, crop } = req.query;

    let url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=5000`;

    // Proper gov filters:
    if (crop && crop !== "all") {
      url += `&filters[commodity]=${crop.toUpperCase()}`;
    }
    if (district && district !== "all") {
      url += `&filters[district]=${district.toUpperCase()}`;
    }

    const api = await axios.get(url);
    const records = api.data?.records || [];

    const cleaned = records.map(r => ({
      crop: r.commodity,
      variety: r.variety || "N/A",
      currentPrice: Number(r.modal_price) || 0,
      previousPrice: Number(r.min_price) || null,
      change: r.modal_price && r.min_price
        ? ((r.modal_price - r.min_price) / r.min_price) * 100
        : null,
      market: r.market,
      district: r.district,
      state: r.state,
      date: r.arrival_date,
      unit: r.unit_of_measurement || "Quintal"
    }));

    res.json({ success: true, data: cleaned });

  } catch (err) {
    console.error("MARKET PRICE API ERROR:", err);
    res.status(500).json({ success: false, message: "Market price fetch failed" });
  }
});

module.exports = router;
