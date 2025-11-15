// backend/routes/history.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const dayjs = require("dayjs");

const DATA_GOV_BASE = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

// GET /api/history?commodity=WHEAT&market=XYZ&days=7
router.get("/", async (req, res) => {
  try {
    const { commodity, market, days = 7 } = req.query;
    if (!commodity || !market) {
      return res.status(400).json({ success: false, message: "commodity and market required" });
    }

    const end = dayjs();
    const start = end.subtract(Number(days) || 7, "day");
    const startStr = start.format("YYYY-MM-DD");
    const endStr = end.format("YYYY-MM-DD");

    const filters = [
      `commodity:${commodity.toUpperCase()}`,
      `market:${market}`
    ];
    const url = `${DATA_GOV_BASE}?api-key=${API_KEY}&format=json&limit=1000&filters=${encodeURIComponent(filters.join(","))}&start_date=${startStr}&end_date=${endStr}`;

    const r = await axios.get(url);
    const records = r.data.records || [];

    // Aggregate by date (average modal price)
    const grouped = {};
    records.forEach((rec) => {
      const date = rec.arrival_date || rec.transaction_date || rec.date;
      if (!date) return;
      const key = date.split("T")[0]; // keep YYYY-MM-DD
      const price = Number(rec.modal_price) || 0;
      if (!grouped[key]) grouped[key] = { sum: 0, count: 0 };
      grouped[key].sum += price;
      grouped[key].count += price > 0 ? 1 : 0;
    });

    const series = Object.keys(grouped)
      .sort()
      .map(date => ({
        date,
        avgPrice: grouped[date].count ? grouped[date].sum / grouped[date].count : 0
      }));

    res.json({ success: true, data: series });
  } catch (err) {
    console.error("history error:", err.message);
    res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

module.exports = router;
