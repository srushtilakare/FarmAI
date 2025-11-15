// backend/routes/compare.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const dayjs = require("dayjs");

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

async function fetchSeries(commodity, market, days = 7) {
  const end = dayjs();
  const start = end.subtract(days, "day").format("YYYY-MM-DD");

  const url =
    `https://api.data.gov.in/resource/${RESOURCE_ID}` +
    `?api-key=${API_KEY}&format=json&limit=5000` +
    `&filters[commodity]=${commodity.toUpperCase()}` +
    `&filters[market]=${market}`;

  const api = await axios.get(url);
  const recs = api.data.records || [];

  const grouped = {};
  recs.forEach(r => {
    const date = r.arrival_date?.split("T")[0] || null;
    if (!date) return;

    const price = Number(r.modal_price);
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(price);
  });

  return Object.entries(grouped).map(([date, arr]) => ({
    date,
    avgPrice: arr.reduce((a, b) => a + b, 0) / arr.length
  }));
}

router.get("/", async (req, res) => {
  try {
    const { crop1, market1, crop2, market2 } = req.query;

    const s1 = await fetchSeries(crop1, market1);
    const s2 = await fetchSeries(crop2, market2);

    res.json({
      success: true,
      data: {
        crop1: { commodity: crop1, market: market1, series: s1 },
        crop2: { commodity: crop2, market: market2, series: s2 }
      }
    });
  } catch (err) {
    console.error("COMPARE ERROR", err);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
