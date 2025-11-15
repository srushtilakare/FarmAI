const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");

const AGMARK_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";
const KEY = process.env.DATA_GOV_API_KEY;

// Remove duplicates helper
function uniqueArray(arr) {
  return [...new Set(arr.filter(Boolean))];
}

// -----------------------------
// 1️⃣ GET ALL STATES
// -----------------------------
router.get("/states", async (req, res) => {
  try {
    const users = await User.find({}, { state: 1 });

    const statesFromDB = users.map(u => u.state?.toUpperCase());

    // Also fetch from Agmarknet
    const agRes = await axios.get(AGMARK_URL, {
      params: { "api-key": KEY, format: "json", limit: 1000 }
    });

    const statesFromAPI = agRes.data.records.map(r =>
      (r.state || "").toUpperCase()
    );

    const finalStates = uniqueArray([...statesFromDB, ...statesFromAPI]);

    res.json({ success: true, data: finalStates });
  } catch (err) {
    console.error("STATE API ERROR", err);
    res.json({ success: true, data: [] }); // return empty but valid
  }
});

// -----------------------------
// 2️⃣ GET DISTRICTS BY STATE
// -----------------------------
router.get("/districts", async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.json({ success: true, data: [] });

    const users = await User.find({ state }, { district: 1 });
    const districtsFromDB = users.map(u => u.district?.toUpperCase());

    const agRes = await axios.get(AGMARK_URL, {
      params: {
        "api-key": KEY,
        format: "json",
        limit: 1000,
        filters: `state:${state}`
      }
    });

    const districtsFromAPI = agRes.data.records.map(r =>
      (r.district || "").toUpperCase()
    );

    const finalDistricts = uniqueArray([...districtsFromDB, ...districtsFromAPI]);

    res.json({ success: true, data: finalDistricts });
  } catch (err) {
    console.error("DISTRICT API ERROR", err);
    res.json({ success: true, data: [] });
  }
});

// -----------------------------
// 3️⃣ ALL CROPS (dynamic)
// -----------------------------
router.get("/crops", async (req, res) => {
  try {
    const agRes = await axios.get(AGMARK_URL, {
      params: { "api-key": KEY, format: "json", limit: 1000 }
    });

    const crops = uniqueArray(
      agRes.data.records.map(r => (r.commodity || "").toUpperCase())
    );

    res.json({ success: true, data: crops });
  } catch (err) {
    console.error("CROPS API ERROR", err);
    res.json({ success: true, data: [] });
  }
});

module.exports = router;
