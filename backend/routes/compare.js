// backend/routes/compare.js

const express = require("express");

const router = express.Router();

// =========================================================
// CONFIG
// =========================================================

const DATA_API_BASE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const API_KEY =
  process.env.DATA_GOV_API_KEY ||
  process.env.DATA_GOV_IN_API_KEY ||
  "579b464db66ec23bdd0000011e4f8d3c";

const STATE_NAME = "MAHARASHTRA";

const API_LIMIT = 10000;

// =========================================================
// HELPERS
// =========================================================

function cleanString(value) {
  return String(value ?? "").trim();
}

function normalize(value) {
  return cleanString(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[₹]/g, "")
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}

// =========================================================
// DATE PARSER
// =========================================================

function parseDate(value) {
  if (!value) {
    return null;
  }

  const raw = cleanString(value);

  // DD/MM/YYYY
  let match = raw.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // DD-MM-YYYY
  match = raw.match(
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  );

  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  // YYYY-MM-DD
  match = raw.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
  );

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    const date = new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  const parsed = new Date(raw);

  if (
    !Number.isNaN(
      parsed.getTime()
    )
  ) {
    return parsed;
  }

  return null;
}

function dateKey(date) {
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

// =========================================================
// MARKET NORMALIZATION
// =========================================================

function normalizeMarketInput(value) {
  return normalize(value)
    .replace(/\bapmc\b/g, "")
    .replace(/\bmarket\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function marketMatches(
  actualMarket,
  requestedMarket
) {
  const actual =
    normalizeMarketInput(
      actualMarket
    );

  const requested =
    normalizeMarketInput(
      requestedMarket
    );

  if (!actual || !requested) {
    return false;
  }

  // Exact normalized match
  if (actual === requested) {
    return true;
  }

  // Safe contains matching
  if (
    actual.includes(requested) ||
    requested.includes(actual)
  ) {
    return true;
  }

  return false;
}

// =========================================================
// API REQUEST
// =========================================================

async function requestRecords(
  commodity,
  market = null
) {
  const params =
    new URLSearchParams();

  params.set(
    "api-key",
    API_KEY
  );

  params.set(
    "format",
    "json"
  );

  params.set(
    "limit",
    String(API_LIMIT)
  );

  params.set(
    "filters[state]",
    STATE_NAME
  );

  params.set(
    "filters[commodity]",
    cleanString(
      commodity
    ).toUpperCase()
  );

  if (market) {
    params.set(
      "filters[market]",
      cleanString(
        market
      ).toUpperCase()
    );
  }

  const url =
    `${DATA_API_BASE}?${params.toString()}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    const text =
      await response.text();

    throw new Error(
      `data.gov.in returned ${response.status}: ${text.slice(
        0,
        300
      )}`
    );
  }

  const json =
    await response.json();

  return Array.isArray(
    json.records
  )
    ? json.records
    : [];
}

// =========================================================
// NORMALIZE API RECORD
// =========================================================

function normalizeRecord(record) {
  const rawDate =
    record.arrival_date ??
    record.arrivalDate ??
    record.date ??
    record.arrival;

  const parsedDate =
    parseDate(rawDate);

  return {
    commodity: cleanString(
      record.commodity
    ),

    variety: cleanString(
      record.variety ||
        record.variety_name ||
        "Local"
    ),

    market: cleanString(
      record.market
    ),

    district: cleanString(
      record.district
    ),

    state: cleanString(
      record.state
    ),

    minPrice: toNumber(
      record.min_price
    ),

    maxPrice: toNumber(
      record.max_price
    ),

    modalPrice: toNumber(
      record.modal_price
    ),

    date: parsedDate,

    dateKey: dateKey(
      parsedDate
    ),
  };
}

// =========================================================
// REMOVE DUPLICATES
// =========================================================

function deduplicateRecords(
  records
) {
  const map = new Map();

  for (const record of records) {
    if (
      !record.dateKey ||
      record.modalPrice === null
    ) {
      continue;
    }

    const key = [
      normalize(
        record.commodity
      ),
      normalize(
        record.variety
      ),
      normalize(
        record.market
      ),
      normalize(
        record.district
      ),
      record.dateKey,
      record.modalPrice,
      record.minPrice,
      record.maxPrice,
    ].join("|");

    if (!map.has(key)) {
      map.set(
        key,
        record
      );
    }
  }

  return Array.from(
    map.values()
  );
}

// =========================================================
// GET MARKET SERIES
//
// IMPORTANT:
// We DO NOT compare against today's date.
//
// Instead:
// 1. Find latest date available in the API.
// 2. Use that as the anchor.
// 3. Take the previous 30 available calendar days.
// =========================================================

async function fetchSeries(
  commodity,
  requestedMarket,
  days = 30
) {
  let records = [];

  // -------------------------------------------------------
  // FIRST ATTEMPT
  // Try the exact market directly through API.
  // -------------------------------------------------------

  try {
    records =
      await requestRecords(
        commodity,
        requestedMarket
      );
  } catch (error) {
    console.warn(
      `Exact market request failed for ${commodity} / ${requestedMarket}:`,
      error.message
    );
  }

  // -------------------------------------------------------
  // FALLBACK
  // If exact market query doesn't return records,
  // fetch commodity-wide Maharashtra records and
  // match the market locally.
  // -------------------------------------------------------

  if (!records.length) {
    try {
      const allRecords =
        await requestRecords(
          commodity
        );

      records =
        allRecords.filter(
          (record) =>
            marketMatches(
              record.market,
              requestedMarket
            )
        );
    } catch (error) {
      console.error(
        `Commodity fallback failed for ${commodity}:`,
        error.message
      );
    }
  }

  // -------------------------------------------------------
  // NORMALIZE
  // -------------------------------------------------------

  let normalized =
    records
      .map(normalizeRecord)
      .filter(
        (record) =>
          record.date &&
          record.dateKey &&
          record.modalPrice !== null
      );

  normalized =
    deduplicateRecords(
      normalized
    );

  // -------------------------------------------------------
  // EXTRA SAFETY
  //
  // Even if the API's market filter behaved loosely,
  // ensure that every record actually belongs to the
  // requested market.
  // -------------------------------------------------------

  normalized =
    normalized.filter(
      (record) =>
        marketMatches(
          record.market,
          requestedMarket
        )
    );

  // -------------------------------------------------------
  // NO DATA
  // -------------------------------------------------------

  if (!normalized.length) {
    return {
      commodity,
      requestedMarket,
      market: requestedMarket,

      series: [],

      latestPrice: null,
      latestDate: null,

      previousPrice: null,
      change: null,

      highestPrice: null,
      lowestPrice: null,
      averagePrice: null,

      daysWithData: 0,
    };
  }

  // -------------------------------------------------------
  // FIND LATEST AVAILABLE DATE
  // -------------------------------------------------------

  let latestDate =
    normalized[0].date;

  for (const record of normalized) {
    if (
      record.date >
      latestDate
    ) {
      latestDate =
        record.date;
    }
  }

  // -------------------------------------------------------
  // BUILD ALLOWED DATE WINDOW
  //
  // We anchor the 30-day period to the latest
  // available government record.
  // -------------------------------------------------------

  const latestTime =
    latestDate.getTime();

  const earliestAllowed =
    latestTime -
    (days - 1) *
      24 *
      60 *
      60 *
      1000;

  const recent =
    normalized.filter(
      (record) => {
        const time =
          record.date.getTime();

        return (
          time >=
            earliestAllowed &&
          time <= latestTime
        );
      }
    );

  // -------------------------------------------------------
  // GROUP BY DATE
  //
  // Multiple varieties / records can exist on one date.
  // We calculate the average modal price for that date.
  // -------------------------------------------------------

  const byDate =
    new Map();

  for (const record of recent) {
    const key =
      record.dateKey;

    if (!key) {
      continue;
    }

    if (!byDate.has(key)) {
      byDate.set(
        key,
        []
      );
    }

    byDate
      .get(key)
      .push(record);
  }

  // -------------------------------------------------------
  // BUILD SERIES
  // -------------------------------------------------------

  const series = [];

  for (const [
    key,
    dateRecords,
  ] of byDate.entries()) {
    const modalPrices =
      dateRecords
        .map(
          (record) =>
            record.modalPrice
        )
        .filter(
          (value) =>
            value !== null
        );

    if (!modalPrices.length) {
      continue;
    }

    const minPrices =
      dateRecords
        .map(
          (record) =>
            record.minPrice
        )
        .filter(
          (value) =>
            value !== null
        );

    const maxPrices =
      dateRecords
        .map(
          (record) =>
            record.maxPrice
        )
        .filter(
          (value) =>
            value !== null
        );

    const avgPrice =
      modalPrices.reduce(
        (sum, value) =>
          sum + value,
        0
      ) /
      modalPrices.length;

    const avgMin =
      minPrices.length
        ? minPrices.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          minPrices.length
        : null;

    const avgMax =
      maxPrices.length
        ? maxPrices.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          maxPrices.length
        : null;

    const markets =
      Array.from(
        new Set(
          dateRecords
            .map(
              (record) =>
                record.market
            )
            .filter(Boolean)
        )
      );

    series.push({
      date: key,

      avgPrice:
        Math.round(
          avgPrice
        ),

      minPrice:
        avgMin === null
          ? null
          : Math.round(
              avgMin
            ),

      maxPrice:
        avgMax === null
          ? null
          : Math.round(
              avgMax
            ),

      recordCount:
        dateRecords.length,

      markets,
    });
  }

  // -------------------------------------------------------
  // SORT OLDEST → NEWEST
  // -------------------------------------------------------

  series.sort(
    (a, b) =>
      new Date(
        a.date
      ).getTime() -
      new Date(
        b.date
      ).getTime()
  );

  // -------------------------------------------------------
  // NO SERIES AFTER GROUPING
  // -------------------------------------------------------

  if (!series.length) {
    return {
      commodity,
      requestedMarket,
      market: requestedMarket,

      series: [],

      latestPrice: null,
      latestDate: null,

      previousPrice: null,
      change: null,

      highestPrice: null,
      lowestPrice: null,
      averagePrice: null,

      daysWithData: 0,
    };
  }

  // -------------------------------------------------------
  // ACTUAL MARKET NAME
  //
  // When the user types something like "Pune", the API
  // may actually return "Pune(Pimpri)".
  //
  // Use the actual market name returned by the source.
  // -------------------------------------------------------

  const marketFrequency =
    new Map();

  for (const record of recent) {
    const name =
      cleanString(
        record.market
      );

    if (!name) {
      continue;
    }

    marketFrequency.set(
      name,
      (marketFrequency.get(
        name
      ) || 0) + 1
    );
  }

  let resolvedMarket =
    requestedMarket;

  let highestFrequency = 0;

  for (const [
    name,
    frequency,
  ] of marketFrequency.entries()) {
    if (
      frequency >
      highestFrequency
    ) {
      highestFrequency =
        frequency;

      resolvedMarket =
        name;
    }
  }

  // -------------------------------------------------------
  // LATEST / PREVIOUS
  // -------------------------------------------------------

  const latest =
    series[
      series.length - 1
    ];

  const previous =
    series.length >= 2
      ? series[
          series.length - 2
        ]
      : null;

  const latestPrice =
    latest.avgPrice;

  const previousPrice =
    previous
      ? previous.avgPrice
      : null;

  let change = null;

  if (
    previousPrice !== null &&
    previousPrice !== 0
  ) {
    change =
      ((latestPrice -
        previousPrice) /
        previousPrice) *
      100;

    change =
      Math.round(
        change * 10
      ) / 10;
  }

  // -------------------------------------------------------
  // HIGH / LOW / AVERAGE
  // -------------------------------------------------------

  const prices =
    series.map(
      (item) =>
        item.avgPrice
    );

  const highestPrice =
    Math.max(...prices);

  const lowestPrice =
    Math.min(...prices);

  const averagePrice =
    prices.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / prices.length;

  // -------------------------------------------------------
  // RETURN
  // -------------------------------------------------------

  return {
    commodity,

    requestedMarket,

    market:
      resolvedMarket,

    series,

    latestPrice,

    latestDate:
      latest.date,

    previousPrice,

    change,

    highestPrice:
      Math.round(
        highestPrice
      ),

    lowestPrice:
      Math.round(
        lowestPrice
      ),

    averagePrice:
      Math.round(
        averagePrice
      ),

    daysWithData:
      series.length,
  };
}

// =========================================================
// COMPARE ROUTE
// =========================================================

router.get(
  "/",
  async (req, res) => {
    try {
      const {
        crop1,
        market1,
        crop2,
        market2,
      } = req.query;

      // -----------------------------------------------------
      // VALIDATION
      // -----------------------------------------------------

      if (
        !crop1 ||
        !market1 ||
        !crop2 ||
        !market2
      ) {
        return res.status(400).json({
          success: false,
          message:
            "crop1, market1, crop2 and market2 are required.",
        });
      }

      // -----------------------------------------------------
      // FETCH BOTH SIDES
      // -----------------------------------------------------

      const [
        result1,
        result2,
      ] = await Promise.all([
        fetchSeries(
          cleanString(
            crop1
          ),
          cleanString(
            market1
          ),
          30
        ),

        fetchSeries(
          cleanString(
            crop2
          ),
          cleanString(
            market2
          ),
          30
        ),
      ]);

      // -----------------------------------------------------
      // RESPONSE
      // -----------------------------------------------------

      return res.json({
        success: true,

        data: {
          crop1: result1,
          crop2: result2,
        },

        meta: {
          source:
            "data.gov.in / Agmarknet",

          state:
            STATE_NAME,

          requestedDays: 30,

          comparisonReady:
            result1.daysWithData > 0 &&
            result2.daysWithData > 0,
        },
      });
    } catch (error) {
      console.error(
        "COMPARE ROUTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to compare market prices.",

        error:
          process.env.NODE_ENV ===
          "development"
            ? error.message
            : undefined,
      });
    }
  }
);

module.exports = router;