/* eslint-env node */
// backend/routes/marketPrices.js

const express = require("express");
const router = express.Router();
const axios = require("axios");

const {
  logActivity,
  getUserIdFromRequest,
} = require("./activities");

// =========================================================
// DATA.GOV.IN / AGMARKNET CONFIGURATION
// =========================================================

const RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070";
const API_KEY = process.env.DATA_GOV_API_KEY;

const DATA_GOV_BASE_URL =
  `https://api.data.gov.in/resource/${RESOURCE_ID}`;

// Keep the request reasonably large so we can calculate
// previous available prices from the returned records.
const API_LIMIT = 10000;

// =========================================================
// DISTRICT ALIASES
// =========================================================
// Agmarknet/data.gov.in naming can differ from the name
// displayed to the farmer.
//
// The frontend can continue using the familiar names while
// this backend handles common official/current variations.
// =========================================================

const DISTRICT_ALIASES = {
  AHMEDNAGAR: [
    "AHMEDNAGAR",
    "AHILYANAGAR",
  ],

  AHILYANAGAR: [
    "AHILYANAGAR",
    "AHMEDNAGAR",
  ],

  AURANGABAD: [
    "AURANGABAD",
    "CHHATRAPATI SAMBHAJINAGAR",
    "CHHATRAPATI SAMBHAJI NAGAR",
  ],

  "CHHATRAPATI SAMBHAJINAGAR": [
    "CHHATRAPATI SAMBHAJINAGAR",
    "CHHATRAPATI SAMBHAJI NAGAR",
    "AURANGABAD",
  ],

  OSMANABAD: [
    "OSMANABAD",
    "DHARASHIV",
  ],

  DHARASHIV: [
    "DHARASHIV",
    "OSMANABAD",
  ],
};

// =========================================================
// HELPERS
// =========================================================

function cleanString(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeForCompare(value) {
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

  // Most Agmarknet records use YYYY-MM-DD or a
  // date/time variation.
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);

  if (match) {
    return match[1];
  }

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function getDistrictCandidates(district) {
  const normalized = normalizeForCompare(district);

  if (!normalized || normalized === "ALL") {
    return [];
  }

  return DISTRICT_ALIASES[normalized] || [normalized];
}

function getApiUrl({
  crop,
  district,
  offset = 0,
}) {
  const params = new URLSearchParams();

  params.set("api-key", API_KEY || "");
  params.set("format", "json");
  params.set("limit", String(API_LIMIT));
  params.set("offset", String(offset));

  // Always restrict this module to Maharashtra.
  params.set("filters[state]", "MAHARASHTRA");

  if (crop && crop !== "all") {
    params.set("filters[commodity]", normalizeForCompare(crop));
  }

  if (district && district !== "all") {
    params.set(
      "filters[district]",
      normalizeForCompare(district)
    );
  }

  return `${DATA_GOV_BASE_URL}?${params.toString()}`;
}

// =========================================================
// FETCH AGMARKNET RECORDS
// =========================================================

async function fetchRecords({
  crop,
  district,
}) {
  if (!API_KEY) {
    throw new Error(
      "DATA_GOV_API_KEY is not configured in the backend environment."
    );
  }

  const candidates =
    district && district !== "all"
      ? getDistrictCandidates(district)
      : [null];

  let lastError = null;

  for (const candidate of candidates) {
    try {
      const url = getApiUrl({
        crop,
        district: candidate,
        offset: 0,
      });

      const response = await axios.get(url, {
        timeout: 20000,
      });

      const records = Array.isArray(response.data?.records)
        ? response.data.records
        : [];

      if (records.length > 0) {
        return records;
      }
    } catch (error) {
      lastError = error;

      console.error(
        "AGMARKNET REQUEST ERROR:",
        error.response?.data || error.message
      );
    }
  }

  // If the district-specific request returned nothing,
  // don't silently return unrelated data.
  if (lastError && candidates.length > 0) {
    throw lastError;
  }

  return [];
}

// =========================================================
// RECORD NORMALIZATION
// =========================================================

function normalizeRecord(record) {
  const crop = cleanString(record.commodity);
  const variety = cleanString(record.variety) || "N/A";
  const market = cleanString(record.market);
  const district = cleanString(record.district);
  const state = cleanString(record.state);

  const modalPrice = toNumber(record.modal_price);
  const minPrice = toNumber(record.min_price);
  const maxPrice = toNumber(record.max_price);

  const date = parseDate(record.arrival_date);

  return {
    crop,
    variety,
    market,
    district,
    state,

    // Actual Agmarknet price fields.
    modalPrice,
    minPrice,
    maxPrice,

    date,

    unit:
      cleanString(record.unit_of_measurement) ||
      "Quintal",
  };
}

// =========================================================
// BUILD PREVIOUS-PRICE MAP
// =========================================================
// We calculate previousPrice from the previous AVAILABLE
// arrival date for the same:
//
// crop + market + variety
//
// We deliberately do NOT use min_price as previousPrice.
// =========================================================

function buildPreviousPriceMap(records) {
  const groups = new Map();

  for (const record of records) {
    if (
      !record.crop ||
      !record.market ||
      !record.date ||
      record.modalPrice === null ||
      record.modalPrice <= 0
    ) {
      continue;
    }

    const key = [
      normalizeForCompare(record.crop),
      normalizeForCompare(record.market),
      normalizeForCompare(record.variety),
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(record);
  }

  const previousMap = new Map();

  for (const [key, group] of groups.entries()) {
    // Sort oldest -> newest.
    group.sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // If multiple records exist on the same date,
    // calculate the date-level modal average first.
    const byDate = new Map();

    for (const record of group) {
      if (!byDate.has(record.date)) {
        byDate.set(record.date, []);
      }

      byDate.get(record.date).push(record.modalPrice);
    }

    const daily = Array.from(byDate.entries())
      .map(([date, prices]) => ({
        date,
        modalPrice: Math.round(
          prices.reduce((sum, value) => sum + value, 0) /
            prices.length
        ),
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );

    for (let i = 0; i < daily.length; i++) {
      const current = daily[i];
      const previous = i > 0 ? daily[i - 1] : null;

      previousMap.set(
        `${key}|${current.date}`,
        previous ? previous.modalPrice : null
      );
    }
  }

  return previousMap;
}

// =========================================================
// BUILD FINAL RESPONSE
// =========================================================

function buildCleanedRecords(rawRecords) {
  const normalized = rawRecords
    .map(normalizeRecord)
    .filter(
      (record) =>
        record.crop &&
        record.market &&
        record.date &&
        record.modalPrice !== null &&
        record.modalPrice > 0
    );

  const previousPriceMap =
    buildPreviousPriceMap(normalized);

  const cleaned = normalized.map((record) => {
    const key = [
      normalizeForCompare(record.crop),
      normalizeForCompare(record.market),
      normalizeForCompare(record.variety),
    ].join("|");

    const previousPrice =
      previousPriceMap.get(
        `${key}|${record.date}`
      ) ?? null;

    let change = null;

    if (
      previousPrice !== null &&
      previousPrice > 0 &&
      record.modalPrice !== null
    ) {
      change =
        ((record.modalPrice - previousPrice) /
          previousPrice) *
        100;
    }

    return {
      crop: record.crop,
      variety: record.variety,

      currentPrice: record.modalPrice,

      // IMPORTANT:
      // This is now the previous AVAILABLE modal price,
      // NOT Agmarknet's min_price.
      previousPrice,

      change:
        change !== null
          ? Number(change.toFixed(2))
          : null,

      // Preserve these actual market values so the
      // frontend can be improved without another API change.
      minPrice: record.minPrice,
      maxPrice: record.maxPrice,
      modalPrice: record.modalPrice,

      market: record.market,
      district: record.district,
      state: record.state,

      date: record.date,

      unit: record.unit,
    };
  });

  // Latest records first.
  cleaned.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return String(a.market).localeCompare(
      String(b.market)
    );
  });

  return cleaned;
}

// =========================================================
// REMOVE EXACT DUPLICATES
// =========================================================

function removeDuplicates(records) {
  const seen = new Set();

  return records.filter((record) => {
    const key = [
      normalizeForCompare(record.crop),
      normalizeForCompare(record.variety),
      normalizeForCompare(record.market),
      normalizeForCompare(record.district),
      record.date,
      record.currentPrice,
      record.minPrice,
      record.maxPrice,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// =========================================================
// MAIN MARKET PRICE ENDPOINT
// =========================================================

router.get("/", async (req, res) => {
  try {
    const crop = cleanString(req.query.crop);
    const district = cleanString(req.query.district);

    const rawRecords = await fetchRecords({
      crop,
      district,
    });

    let cleaned = buildCleanedRecords(rawRecords);

    cleaned = removeDuplicates(cleaned);

    // =====================================================
    // ACTIVITY LOGGING
    // =====================================================

    try {
      const userId =
        await getUserIdFromRequest(req);

      if (userId) {
        await logActivity(userId, {
          activityType: "market-prices",
          title: "Market Price Check",

          description:
            `Checked market prices` +
            `${crop && crop !== "all" ? ` for ${crop}` : ""}` +
            `${
              district && district !== "all"
                ? ` in ${district}`
                : ""
            }`,

          status: "viewed",

          result:
            `${cleaned.length} price records found`,

          metadata: {
            crop:
              crop && crop !== "all"
                ? crop
                : null,

            district:
              district && district !== "all"
                ? district
                : null,

            recordCount: cleaned.length,
          },
        });
      }
    } catch (activityError) {
      // Activity logging must never break market prices.
      console.warn(
        "MARKET PRICE ACTIVITY LOG ERROR:",
        activityError.message
      );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    res.json({
      success: true,
      data: cleaned,

      meta: {
        source: "data.gov.in / Agmarknet",
        state: "MAHARASHTRA",
        recordCount: cleaned.length,

        latestDate:
          cleaned.length > 0
            ? cleaned[0].date
            : null,
      },
    });
  } catch (err) {
    console.error(
      "MARKET PRICE API ERROR:",
      err.response?.data || err.message || err
    );

    res.status(500).json({
      success: false,
      message:
        "Market price fetch failed",
      data: [],
    });
  }
});

module.exports = router;