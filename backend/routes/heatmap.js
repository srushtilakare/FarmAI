/* eslint-env node */
// backend/routes/heatmap.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

const DATA_GOV_BASE_URL =
  `https://api.data.gov.in/resource/${RESOURCE_ID}`;

const API_LIMIT = 10000;

// =========================================================
// HELPERS
// =========================================================

function cleanString(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalize(value) {
  return cleanString(value).toUpperCase();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function parseDate(value) {
  if (!value) return null;

  const raw = String(value).trim();

  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

// =========================================================
// DISTRICT NAME NORMALIZATION
// =========================================================

const DISTRICT_DISPLAY_NAMES = {
  PUNE: "Pune",
  NASHIK: "Nashik",
  AHMEDNAGAR: "Ahmednagar",
  AHILYANAGAR: "Ahmednagar",

  KOLHAPUR: "Kolhapur",
  SATARA: "Satara",
  SANGLI: "Sangli",
  SOLAPUR: "Solapur",

  AURANGABAD: "Aurangabad",
  "CHHATRAPATI SAMBHAJINAGAR":
    "Aurangabad",
  "CHHATRAPATI SAMBHAJI NAGAR":
    "Aurangabad",

  BEED: "Beed",
  JALGAON: "Jalgaon",
  DHULE: "Dhule",
  NANDURBAR: "Nandurbar",

  NAGPUR: "Nagpur",
  WARDHA: "Wardha",
  AMRAVATI: "Amravati",
  YAVATMAL: "Yavatmal",
  AKOLA: "Akola",
  BULDHANA: "Buldhana",

  OSMANABAD: "Osmanabad",
  DHARASHIV: "Osmanabad",

  LATUR: "Latur",
  PARBHANI: "Parbhani",
  HINGOLI: "Hingoli",

  RAIGAD: "Raigad",
  RATNAGIRI: "Ratnagiri",
  SINDHUDURG: "Sindhudurg",

  MUMBAI: "Mumbai",
  THANE: "Thane",
  "NAVI MUMBAI": "Navi Mumbai",
  KALYAN: "Kalyan",
  "MUMBAI SUBURBAN": "Mumbai Suburban",
};

// =========================================================
// FETCH AGMARKNET DATA
// =========================================================

async function fetchCropRecords(crop) {
  if (!API_KEY) {
    throw new Error(
      "DATA_GOV_API_KEY is not configured."
    );
  }

  const params = new URLSearchParams();

  params.set("api-key", API_KEY);
  params.set("format", "json");
  params.set("limit", String(API_LIMIT));

  // Always restrict heatmap to Maharashtra.
  params.set("filters[state]", "MAHARASHTRA");

  if (crop && crop !== "all") {
    params.set(
      "filters[commodity]",
      normalize(crop)
    );
  }

  const url =
    `${DATA_GOV_BASE_URL}?${params.toString()}`;

  const response = await axios.get(url, {
    timeout: 20000,
  });

  return Array.isArray(response.data?.records)
    ? response.data.records
    : [];
}

// =========================================================
// BUILD LATEST PRICE PER MARKET / VARIETY / DISTRICT
// =========================================================
//
// We don't want old records to influence a "current"
// heatmap.
//
// First we group records by:
// district + market + variety
//
// Then we keep the latest available date for that
// combination.
//
// Finally we calculate the district average from those
// latest market-level observations.
// =========================================================

function buildHeatmap(records) {
  const marketGroups = new Map();

  records.forEach((record) => {
    const rawDistrict =
      cleanString(record.district);

    const districtKey =
      normalize(rawDistrict);

    const market =
      cleanString(record.market);

    const variety =
      cleanString(record.variety) || "N/A";

    const date =
      parseDate(record.arrival_date);

    const modalPrice =
      toNumber(record.modal_price);

    if (
      !districtKey ||
      !market ||
      !date ||
      modalPrice === null ||
      modalPrice <= 0
    ) {
      return;
    }

    // Ignore districts we don't recognize.
    if (!DISTRICT_DISPLAY_NAMES[districtKey]) {
      return;
    }

    const key = [
      districtKey,
      normalize(market),
      normalize(variety),
    ].join("|");

    if (!marketGroups.has(key)) {
      marketGroups.set(key, {
        districtKey,
        district: DISTRICT_DISPLAY_NAMES[
          districtKey
        ],
        market,
        variety,
        records: [],
      });
    }

    marketGroups.get(key).records.push({
      date,
      modalPrice,
    });
  });

  // =====================================================
  // FIND LATEST RECORD(S) FOR EACH MARKET + VARIETY
  // =====================================================

  const latestObservations = [];

  for (const group of marketGroups.values()) {
    group.records.sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    if (group.records.length === 0) {
      continue;
    }

    const latestDate =
      group.records[0].date;

    const latestRecords =
      group.records.filter(
        (record) =>
          record.date === latestDate
      );

    const average =
      latestRecords.reduce(
        (sum, record) =>
          sum + record.modalPrice,
        0
      ) / latestRecords.length;

    latestObservations.push({
      districtKey: group.districtKey,
      district: group.district,
      market: group.market,
      variety: group.variety,
      date: latestDate,
      modalPrice: Math.round(average),
    });
  }

  // =====================================================
  // GROUP LATEST OBSERVATIONS BY DISTRICT
  // =====================================================

  const districts = new Map();

  latestObservations.forEach((observation) => {
    if (!districts.has(observation.districtKey)) {
      districts.set(
        observation.districtKey,
        {
          districtKey:
            observation.districtKey,

          district:
            observation.district,

          prices: [],

          markets: new Set(),

          dates: [],
        }
      );
    }

    const district =
      districts.get(
        observation.districtKey
      );

    district.prices.push(
      observation.modalPrice
    );

    district.markets.add(
      observation.market
    );

    district.dates.push(
      observation.date
    );
  });

  // =====================================================
  // FINAL DISTRICT RESULTS
  // =====================================================

  const heat = Array.from(
    districts.values()
  )
    .map((district) => {
      const prices = district.prices;

      const avg =
        prices.length > 0
          ? Math.round(
              prices.reduce(
                (sum, price) =>
                  sum + price,
                0
              ) / prices.length
            )
          : null;

      const latestDate =
        district.dates.length > 0
          ? district.dates.sort().reverse()[0]
          : null;

      const lowest =
        prices.length > 0
          ? Math.min(...prices)
          : null;

      const highest =
        prices.length > 0
          ? Math.max(...prices)
          : null;

      return {
        district:
          district.district,

        avg,

        lowest,

        highest,

        marketCount:
          district.markets.size,

        recordCount:
          prices.length,

        latestDate,
      };
    })
    .filter(
      (item) =>
        item.avg !== null &&
        item.avg > 0
    )
    .sort(
      (a, b) => b.avg - a.avg
    );

  return heat;
}

// =========================================================
// API ENDPOINT
// =========================================================

router.get("/", async (req, res) => {
  try {
    const crop = cleanString(req.query.crop);

    if (!crop || crop === "all") {
      return res.json({
        success: true,
        data: [],
        meta: {
          message:
            "Select a crop to view Maharashtra market prices.",
        },
      });
    }

    const records =
      await fetchCropRecords(crop);

    const heat =
      buildHeatmap(records);

    res.json({
      success: true,

      data: heat,

      meta: {
        source:
          "data.gov.in / Agmarknet",

        state:
          "MAHARASHTRA",

        crop,

        districtCount:
          heat.length,

        latestDate:
          heat.length > 0
            ? heat.reduce(
                (latest, item) =>
                  !latest ||
                  (item.latestDate &&
                    item.latestDate >
                      latest)
                    ? item.latestDate
                    : latest,
                null
              )
            : null,
      },
    });
  } catch (err) {
    console.error(
      "HEATMAP ERROR:",
      err.response?.data ||
        err.message ||
        err
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to fetch Maharashtra price heatmap.",
      data: [],
    });
  }
});

module.exports = router;