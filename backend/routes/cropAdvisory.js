// backend/routes/cropAdvisory.js
//
// Location-Specific Crop Advisory
//
// Combines:
// 1. Farmer profile
// 2. Registered farm location / selected location
// 3. Current + 7-day weather
// 4. Agricultural season
// 5. Soil information when available
// 6. Irrigation availability
// 7. Farm size
// 8. Budget
// 9. Farmer's existing crops
//
// IMPORTANT:
// This route does NOT invent weather, soil or market values.
// Missing data is handled explicitly.

const express = require("express");
const axios = require("axios");
const dayjs = require("dayjs");

const router = express.Router();

const auth = require("../middleware/auth");
const SoilReport = require("../models/SoilReport");
const { logActivity } = require("./activities");

// =========================================================
// CONFIGURATION
// =========================================================

const OPEN_METEO_FORECAST =
  "https://api.open-meteo.com/v1/forecast";

const OPEN_METEO_GEOCODING =
  "https://geocoding-api.open-meteo.com/v1/search";

const AGMARK_RESOURCE =
  "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070";

const DATA_GOV_API_KEY =
  process.env.DATA_GOV_API_KEY || "";


// =========================================================
// CROP KNOWLEDGE BASE
//
// This is the deterministic part of the advisory system.
// Scores are based on agricultural requirements rather
// than generated randomly.
// =========================================================

const CROP_PROFILES = {

  rice: {
    name: "Rice",
    aliases: ["rice", "paddy"],

    seasons: ["kharif"],
    durationDays: 120,

    soilTypes: ["clay", "loamy", "alluvial"],
    ph: { min: 5.5, max: 7.5 },

    water: "very-high",
    irrigation: ["flood", "rainfed"],

    temperature: {
      min: 20,
      idealMin: 25,
      idealMax: 32,
      max: 38
    },

    rainfall: {
      min: 500,
      idealMin: 800,
      idealMax: 1500
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "WEST BENGAL",
      "ODISHA",
      "PUNJAB",
      "ANDHRA PRADESH",
      "TELANGANA",
      "KARNATAKA",
      "CHHATTISGARH"
    ],

    risks: [
      "Excessive waterlogging",
      "Blast disease",
      "Stem borer",
      "Heavy rain during harvesting"
    ]
  },

  wheat: {
    name: "Wheat",
    aliases: ["wheat"],

    seasons: ["rabi"],
    durationDays: 120,

    soilTypes: ["loamy", "alluvial", "clay"],
    ph: { min: 6.0, max: 7.5 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "flood"],

    temperature: {
      min: 10,
      idealMin: 15,
      idealMax: 25,
      max: 32
    },

    rainfall: {
      min: 300,
      idealMin: 400,
      idealMax: 700
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "PUNJAB",
      "HARYANA",
      "UTTAR PRADESH",
      "MADHYA PRADESH",
      "RAJASTHAN",
      "BIHAR"
    ],

    risks: [
      "Rust disease",
      "Heat during grain filling",
      "Water stress"
    ]
  },

  maize: {
    name: "Maize",
    aliases: ["maize", "corn"],

    seasons: ["kharif", "rabi", "zaid"],
    durationDays: 100,

    soilTypes: ["loamy", "alluvial", "black", "red"],
    ph: { min: 5.8, max: 7.0 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "flood", "rainfed"],

    temperature: {
      min: 18,
      idealMin: 21,
      idealMax: 30,
      max: 35
    },

    rainfall: {
      min: 400,
      idealMin: 500,
      idealMax: 800
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "KARNATAKA",
      "MADHYA PRADESH",
      "BIHAR",
      "TELANGANA",
      "ANDHRA PRADESH",
      "RAJASTHAN"
    ],

    risks: [
      "Fall armyworm",
      "Water stress during flowering",
      "High heat during tasseling"
    ]
  },

  soybean: {
    name: "Soybean",
    aliases: ["soybean", "soyabean"],

    seasons: ["kharif"],
    durationDays: 100,

    soilTypes: ["black", "loamy", "red"],
    ph: { min: 6.0, max: 7.5 },

    water: "medium",
    irrigation: ["rainfed", "drip", "sprinkler"],

    temperature: {
      min: 18,
      idealMin: 20,
      idealMax: 30,
      max: 35
    },

    rainfall: {
      min: 450,
      idealMin: 600,
      idealMax: 1000
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "MADHYA PRADESH",
      "RAJASTHAN",
      "KARNATAKA",
      "TELANGANA"
    ],

    risks: [
      "Waterlogging",
      "Defoliating insects",
      "Excessive rainfall during maturity"
    ]
  },

  cotton: {
    name: "Cotton",
    aliases: ["cotton"],

    seasons: ["kharif"],
    durationDays: 150,

    soilTypes: ["black", "loamy", "alluvial"],
    ph: { min: 5.8, max: 8.0 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "rainfed"],

    temperature: {
      min: 18,
      idealMin: 21,
      idealMax: 32,
      max: 38
    },

    rainfall: {
      min: 500,
      idealMin: 700,
      idealMax: 1200
    },

    budget: "high",

    states: [
      "MAHARASHTRA",
      "GUJARAT",
      "TELANGANA",
      "KARNATAKA",
      "MADHYA PRADESH",
      "PUNJAB",
      "HARYANA"
    ],

    risks: [
      "Pink bollworm",
      "American bollworm",
      "Excessive rain",
      "Water stress"
    ]
  },

  groundnut: {
    name: "Groundnut",
    aliases: ["groundnut", "peanut"],

    seasons: ["kharif", "zaid"],
    durationDays: 110,

    soilTypes: ["sandy", "loamy", "red"],
    ph: { min: 6.0, max: 7.5 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "rainfed"],

    temperature: {
      min: 20,
      idealMin: 25,
      idealMax: 30,
      max: 35
    },

    rainfall: {
      min: 400,
      idealMin: 500,
      idealMax: 1000
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "GUJARAT",
      "KARNATAKA",
      "ANDHRA PRADESH",
      "RAJASTHAN",
      "TAMIL NADU"
    ],

    risks: [
      "Waterlogging",
      "Leaf spot",
      "Aflatoxin risk under poor storage conditions"
    ]
  },

  potato: {
    name: "Potato",
    aliases: ["potato"],

    seasons: ["rabi"],
    durationDays: 90,

    soilTypes: ["loamy", "sandy", "alluvial"],
    ph: { min: 5.0, max: 7.0 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "flood"],

    temperature: {
      min: 7,
      idealMin: 15,
      idealMax: 22,
      max: 30
    },

    rainfall: {
      min: 300,
      idealMin: 400,
      idealMax: 700
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "UTTAR PRADESH",
      "WEST BENGAL",
      "BIHAR",
      "GUJARAT",
      "PUNJAB"
    ],

    risks: [
      "Late blight",
      "Heat stress",
      "Excessive soil moisture"
    ]
  },

  onion: {
    name: "Onion",
    aliases: ["onion"],

    seasons: ["rabi", "kharif"],
    durationDays: 120,

    soilTypes: ["loamy", "sandy", "alluvial"],
    ph: { min: 6.0, max: 7.5 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "flood"],

    temperature: {
      min: 13,
      idealMin: 15,
      idealMax: 25,
      max: 32
    },

    rainfall: {
      min: 350,
      idealMin: 500,
      idealMax: 800
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "KARNATAKA",
      "GUJARAT",
      "MADHYA PRADESH",
      "RAJASTHAN",
      "BIHAR"
    ],

    risks: [
      "Thrips",
      "Purple blotch",
      "Excess moisture near maturity"
    ]
  },

  tomato: {
    name: "Tomato",
    aliases: ["tomato"],

    seasons: ["kharif", "rabi", "zaid"],
    durationDays: 90,

    soilTypes: ["loamy", "sandy", "red", "alluvial"],
    ph: { min: 6.0, max: 7.5 },

    water: "medium",
    irrigation: ["drip", "sprinkler", "flood"],

    temperature: {
      min: 15,
      idealMin: 20,
      idealMax: 30,
      max: 35
    },

    rainfall: {
      min: 400,
      idealMin: 600,
      idealMax: 1000
    },

    budget: "medium",

    states: [
      "MAHARASHTRA",
      "KARNATAKA",
      "ANDHRA PRADESH",
      "TELANGANA",
      "GUJARAT",
      "MADHYA PRADESH"
    ],

    risks: [
      "Early blight",
      "Late blight",
      "Fruit borer",
      "Excessive rain"
    ]
  },

  sugarcane: {
    name: "Sugarcane",
    aliases: ["sugarcane"],

    seasons: ["year-round"],
    durationDays: 365,

    soilTypes: ["loamy", "black", "alluvial"],
    ph: { min: 6.0, max: 8.0 },

    water: "very-high",
    irrigation: ["drip", "flood"],

    temperature: {
      min: 20,
      idealMin: 25,
      idealMax: 35,
      max: 40
    },

    rainfall: {
      min: 750,
      idealMin: 1000,
      idealMax: 1500
    },

    budget: "high",

    states: [
      "MAHARASHTRA",
      "UTTAR PRADESH",
      "KARNATAKA",
      "GUJARAT",
      "TAMIL NADU",
      "BIHAR"
    ],

    risks: [
      "High water requirement",
      "Pest pressure",
      "Long crop duration"
    ]
  }
};


// =========================================================
// SEASON
// =========================================================

function getAgriculturalSeason(date = new Date()) {

  const month = date.getMonth() + 1;

  // Approximate Indian agricultural seasons.
  //
  // We deliberately use explicit ranges here rather than
  // reusing cropCalendar.js because that file has existing
  // functionality that should not be changed.

  if (month >= 6 && month <= 10) {
    return "kharif";
  }

  if (month >= 11 || month === 1 || month === 2) {
    return "rabi";
  }

  if (month >= 3 && month <= 5) {
    return "zaid";
  }

  return "year-round";
}


// =========================================================
// GEOCODING
// =========================================================

async function geocodeLocation(locationText) {

  if (!locationText) {
    return null;
  }

  try {

    const response = await axios.get(
      OPEN_METEO_GEOCODING,
      {
        params: {
          name: locationText,
          count: 1,
          language: "en",
          format: "json"
        },
        timeout: 10000
      }
    );

    const result =
      response.data?.results?.[0];

    if (!result) {
      return null;
    }

    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      district: result.admin2 || "",
      state: result.admin1 || "",
      country: result.country || ""
    };

  } catch (error) {

    console.error(
      "Advisory geocoding error:",
      error.message
    );

    return null;
  }
}


// =========================================================
// WEATHER
// =========================================================

async function getWeather(latitude, longitude) {

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    latitude === 0 ||
    longitude === 0
  ) {
    return null;
  }

  try {

    const response = await axios.get(
      OPEN_METEO_FORECAST,
      {
        params: {
          latitude,
          longitude,

          current:
            "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",

          daily:
            [
              "temperature_2m_max",
              "temperature_2m_min",
              "precipitation_sum",
              "precipitation_probability_max",
              "windspeed_10m_max"
            ].join(","),

          forecast_days: 7,
          timezone: "auto"
        },

        timeout: 15000
      }
    );

    const data = response.data;

    if (!data) {
      return null;
    }

    const daily = [];

    const dates = data.daily?.time || [];

    for (let i = 0; i < dates.length; i++) {

      daily.push({
        date: dates[i],

        tempMax:
          data.daily.temperature_2m_max?.[i] ?? null,

        tempMin:
          data.daily.temperature_2m_min?.[i] ?? null,

        rainfall:
          data.daily.precipitation_sum?.[i] ?? null,

        rainProbability:
          data.daily.precipitation_probability_max?.[i] ?? null,

        wind:
          data.daily.windspeed_10m_max?.[i] ?? null
      });
    }

    return {
      current: {
        temperature:
          data.current?.temperature_2m ?? null,

        humidity:
          data.current?.relative_humidity_2m ?? null,

        precipitation:
          data.current?.precipitation ?? null,

        wind:
          data.current?.wind_speed_10m ?? null
      },

      daily
    };

  } catch (error) {

    console.error(
      "Advisory weather error:",
      error.message
    );

    return null;
  }
}


// =========================================================
// SOIL REPORT
// =========================================================

async function getLatestSoilReport(userId) {

  try {

    const report =
      await SoilReport.findOne({
        userId,
        processed: true
      })
        .sort({ createdAt: -1 })
        .lean();

    if (!report) {
      return null;
    }

    return {
      source: "soil-report",

      location: report.location || {},

      parameters:
        report.soilParameters || {},

      analysis:
        report.aiAnalysis || {},

      testDate:
        report.testDate || report.createdAt
    };

  } catch (error) {

    console.error(
      "Advisory soil lookup error:",
      error.message
    );

    return null;
  }
}


// =========================================================
// SOIL TYPE NORMALIZATION
// =========================================================

function normalizeSoilType(value) {

  if (!value) {
    return "";
  }

  const soil = String(value)
    .trim()
    .toLowerCase();

  const aliases = {

    clay: "clay",
    "clay soil": "clay",

    loam: "loamy",
    loamy: "loamy",
    "loamy soil": "loamy",

    sandy: "sandy",
    "sandy soil": "sandy",

    black: "black",
    "black soil": "black",

    red: "red",
    "red soil": "red",

    alluvial: "alluvial",
    "alluvial soil": "alluvial"
  };

  return aliases[soil] || soil;
}


// =========================================================
// WATER COMPATIBILITY
// =========================================================

function scoreWaterCompatibility(
  crop,
  irrigationType
) {

  if (!irrigationType) {
    return {
      score: 5,
      reason: "Irrigation information was not provided."
    };
  }

  const irrigation =
    String(irrigationType)
      .trim()
      .toLowerCase();

  if (crop.irrigation.includes(irrigation)) {

    return {
      score: 10,
      reason:
        `The ${irrigation} irrigation method is compatible with ${crop.name}.`
    };
  }

  if (
    crop.water === "very-high" &&
    irrigation === "rainfed"
  ) {

    return {
      score: 2,
      reason:
        `${crop.name} has a very high water requirement and rainfed conditions may be risky.`
    };
  }

  return {
    score: 5,
    reason:
      `Water availability should be monitored carefully for ${crop.name}.`
  };
}


// =========================================================
// BUDGET COMPATIBILITY
// =========================================================

function scoreBudgetCompatibility(
  cropBudget,
  farmerBudget
) {

  if (!farmerBudget) {
    return {
      score: 5,
      reason: "Budget was not provided."
    };
  }

  const order = {
    low: 1,
    medium: 2,
    high: 3
  };

  const required =
    order[cropBudget] || 2;

  const available =
    order[String(farmerBudget).toLowerCase()] || 2;

  if (available >= required) {

    return {
      score: 5,
      reason: "The selected budget is broadly suitable."
    };
  }

  return {
    score: 1,
    reason:
      `This crop may require a higher investment than the selected budget.`
  };
}


// =========================================================
// WEATHER SCORING
// =========================================================

function scoreWeather(crop, weather) {

  if (!weather || !weather.daily?.length) {

    return {
      score: 5,
      reason: "Live weather data was not available."
    };
  }

  const validTemps =
    weather.daily
      .map(day => day.tempMax)
      .filter(value => typeof value === "number");

  const rainfall =
    weather.daily
      .map(day => day.rainfall)
      .filter(value => typeof value === "number");

  if (!validTemps.length) {

    return {
      score: 5,
      reason: "Temperature forecast was unavailable."
    };
  }

  const avgTemp =
    validTemps.reduce(
      (sum, value) => sum + value,
      0
    ) / validTemps.length;

  const totalRain =
    rainfall.reduce(
      (sum, value) => sum + value,
      0
    );

  let score = 5;
  const reasons = [];

  // Temperature

  if (
    avgTemp >= crop.temperature.idealMin &&
    avgTemp <= crop.temperature.idealMax
  ) {

    score += 3;

    reasons.push(
      `The forecast temperature is within the preferred range for ${crop.name}.`
    );

  } else if (
    avgTemp >= crop.temperature.min &&
    avgTemp <= crop.temperature.max
  ) {

    score += 1;

    reasons.push(
      `The forecast temperature is acceptable for ${crop.name}, but not ideal.`
    );

  } else {

    score -= 3;

    reasons.push(
      `The forecast temperature is outside the preferred range for ${crop.name}.`
    );
  }

  // Rainfall

  if (
    totalRain >= crop.rainfall.idealMin &&
    totalRain <= crop.rainfall.idealMax
  ) {

    score += 2;

  } else if (
    totalRain >= crop.rainfall.min
  ) {

    score += 1;

  } else {

    score -= 1;

    reasons.push(
      `Forecast rainfall may be lower than preferred for ${crop.name}.`
    );
  }

  return {
    score: Math.max(0, Math.min(10, score)),
    reason: reasons.join(" ")
  };
}


// =========================================================
// SOIL SCORING
// =========================================================

function scoreSoil(
  crop,
  soilType,
  soilReport
) {

  let score = 5;
  const reasons = [];

  const normalizedType =
    normalizeSoilType(
      soilType ||
      soilReport?.analysis?.soilType
    );

  // Soil type

  if (normalizedType) {

    if (
      crop.soilTypes.includes(normalizedType)
    ) {

      score += 3;

      reasons.push(
        `${normalizedType} soil is suitable for ${crop.name}.`
      );

    } else {

      score -= 2;

      reasons.push(
        `${normalizedType} soil is not the preferred soil type for ${crop.name}.`
      );
    }
  }

  // pH

  const ph =
    soilReport?.parameters?.pH?.value;

  if (typeof ph === "number") {

    if (
      ph >= crop.ph.min &&
      ph <= crop.ph.max
    ) {

      score += 2;

      reasons.push(
        `The soil pH of ${ph} is suitable for ${crop.name}.`
      );

    } else {

      score -= 3;

      reasons.push(
        `The soil pH of ${ph} is outside the preferred range for ${crop.name}.`
      );
    }
  }

  return {
    score: Math.max(0, Math.min(10, score)),
    reason:
      reasons.length
        ? reasons.join(" ")
        : "Detailed soil information was not available."
  };
}


// =========================================================
// SEASON SCORING
// =========================================================

function scoreSeason(crop, season) {

  if (
    crop.seasons.includes("year-round") ||
    crop.seasons.includes(season)
  ) {

    return {
      score: 10,
      reason:
        `${crop.name} is compatible with the ${season} season.`
    };
  }

  return {
    score: 0,
    reason:
      `${crop.name} is not normally recommended for the current ${season} season.`
  };
}


// =========================================================
// LOCATION SCORING
// =========================================================

function scoreLocation(
  crop,
  state
) {

  if (!state) {

    return {
      score: 5,
      reason: "State information was not available."
    };
  }

  const normalizedState =
    String(state)
      .trim()
      .toUpperCase();

  if (
    crop.states.includes(normalizedState)
  ) {

    return {
      score: 10,
      reason:
        `${crop.name} is commonly cultivated in ${normalizedState}.`
    };
  }

  return {
    score: 4,
    reason:
      `Specific state-level suitability data was not available for ${crop.name}.`
  };
}


// =========================================================
// MARKET DATA
//
// We use market data only when available.
// No market price is invented.
// =========================================================

async function getMarketInformation(
  crop,
  state,
  district
) {

  if (!DATA_GOV_API_KEY) {

    return {
      available: false,
      records: [],
      message:
        "Market data API key is not configured."
    };
  }

  try {

    const params = {
      "api-key": DATA_GOV_API_KEY,
      format: "json",
      limit: 100
    };

    if (state) {
      params["filters[state]"] =
        String(state).toUpperCase();
    }

    if (district) {
      params["filters[district]"] =
        String(district).toUpperCase();
    }

    params["filters[commodity]"] =
      crop.name.toUpperCase();

    const response =
      await axios.get(
        AGMARK_RESOURCE,
        {
          params,
          timeout: 12000
        }
      );

    const records =
      response.data?.records || [];

    const cleaned =
      records
        .map(record => ({
          market: record.market || "",
          district: record.district || "",
          state: record.state || "",
          modalPrice:
            Number(record.modal_price) || 0,
          minPrice:
            Number(record.min_price) || 0,
          maxPrice:
            Number(record.max_price) || 0,
          date:
            record.arrival_date || ""
        }))
        .filter(
          record => record.modalPrice > 0
        );

    if (!cleaned.length) {

      return {
        available: false,
        records: [],
        message:
          "No recent market record was found for this crop and location."
      };
    }

    const averagePrice =
      cleaned.reduce(
        (sum, record) =>
          sum + record.modalPrice,
        0
      ) / cleaned.length;

    return {
      available: true,
      records: cleaned.slice(0, 10),
      averageModalPrice:
        Math.round(averagePrice),
      message:
        "Recent market records available."
    };

  } catch (error) {

    console.error(
      "Advisory market error:",
      error.message
    );

    return {
      available: false,
      records: [],
      message:
        "Market information could not be retrieved."
    };
  }
}


// =========================================================
// MARKET SCORE
// =========================================================

function scoreMarket(market) {

  if (
    !market ||
    !market.available
  ) {

    return {
      score: 5,
      reason:
        market?.message ||
        "Market information was unavailable."
    };
  }

  return {
    score: 8,
    reason:
      `Recent market records are available. Average modal price in the retrieved records is approximately ₹${market.averageModalPrice}.`
  };
}


// =========================================================
// FARMER CROP PREFERENCE
// =========================================================

function scoreFarmerCropPreference(
  crop,
  farmerCrops
) {

  if (
    !Array.isArray(farmerCrops) ||
    !farmerCrops.length
  ) {

    return {
      score: 5,
      reason: "No registered crop preference was available."
    };
  }

  const normalized =
    farmerCrops.map(
      value =>
        String(value)
          .toLowerCase()
          .trim()
    );

  const matches =
    crop.aliases.some(
      alias =>
        normalized.includes(
          alias.toLowerCase()
        )
    );

  if (matches) {

    return {
      score: 5,
      reason:
        `${crop.name} matches one of the crops registered in the farmer profile.`
    };
  }

  return {
    score: 3,
    reason:
      `${crop.name} is not currently listed among the farmer's registered crops.`
  };
}


// =========================================================
// OVERALL SCORE
//
// Maximum = 100
// =========================================================

function calculateSuitabilityScore({
  seasonScore,
  locationScore,
  weatherScore,
  soilScore,
  waterScore,
  budgetScore,
  marketScore,
  farmerCropScore
}) {

  // Weighted scoring.
  //
  // Season and weather receive high importance.
  // Soil is important when available.
  // Market and farmer preference provide supporting signals.

  const weighted =
    (
      seasonScore * 0.20 +
      locationScore * 0.10 +
      weatherScore * 0.20 +
      soilScore * 0.18 +
      waterScore * 0.12 +
      budgetScore * 0.06 +
      marketScore * 0.09 +
      farmerCropScore * 0.05
    );

  return Math.round(
    Math.max(0, Math.min(100, weighted * 10))
  );
}


// =========================================================
// GENERATE FARM ADVICE
// =========================================================

function generateCropAdvice({
  crop,
  weather,
  irrigationType,
  season
}) {

  const advice = [];

  if (
    irrigationType === "rainfed" &&
    crop.water === "very-high"
  ) {

    advice.push(
      `Because ${crop.name} requires substantial water, rainfall should be monitored closely and a backup water source is advisable.`
    );
  }

  if (
    weather?.daily?.length
  ) {

    const heavyRainDays =
      weather.daily.filter(
        day =>
          typeof day.rainProbability === "number" &&
          day.rainProbability >= 70
      );

    if (heavyRainDays.length) {

      advice.push(
        "Avoid unnecessary fertilizer or pesticide spraying immediately before heavy rainfall."
      );
    }

    const hotDays =
      weather.daily.filter(
        day =>
          typeof day.tempMax === "number" &&
          day.tempMax >= 35
      );

    if (hotDays.length) {

      advice.push(
        "High-temperature days are expected. Monitor soil moisture and crop heat stress."
      );
    }
  }

  advice.push(
    `Plan cultivation according to the ${season} season and local agricultural recommendations.`
  );

  return advice;
}


// =========================================================
// MAIN ADVISORY ENDPOINT
//
// POST /api/crop-advisory
//
// Authentication required.
// =========================================================

router.post("/", auth, async (req, res) => {

  try {

    const {
      locationMode = "registered",
      latitude,
      longitude,
      location,
      soilType,
      season: requestedSeason,
      farmSize,
      irrigationType,
      budget
    } = req.body;


    // =====================================================
    // USER PROFILE
    // =====================================================

    const user =
      req.user;

    const farmerCrops =
      Array.isArray(user.crops)
        ? user.crops
        : [];


    // =====================================================
    // DETERMINE LOCATION
    // =====================================================

    let finalLatitude = null;
    let finalLongitude = null;

    let locationName = "";
    let locationState = "";
    let locationDistrict = "";
    let locationVillage = "";

    let locationSource =
      "registered_farm";


    // -----------------------------------------------------
    // 1. CURRENT / MANUAL LOCATION
    // -----------------------------------------------------

    if (
      locationMode === "current" &&
      typeof latitude === "number" &&
      typeof longitude === "number"
    ) {

      finalLatitude = latitude;
      finalLongitude = longitude;

      locationSource =
        "current_location";

      locationName =
        location || "Current location";

    }

    // -----------------------------------------------------
    // 2. MANUAL LOCATION
    // -----------------------------------------------------

    else if (
      locationMode === "manual" &&
      location
    ) {

      const geocoded =
        await geocodeLocation(location);

      if (geocoded) {

        finalLatitude =
          geocoded.latitude;

        finalLongitude =
          geocoded.longitude;

        locationName =
          geocoded.name;

        locationState =
          geocoded.state;

        locationDistrict =
          geocoded.district;

        locationSource =
          "manual_location";

      } else {

        return res.status(400).json({
          success: false,
          code: "LOCATION_NOT_FOUND",
          message:
            "The selected location could not be found. Please choose another location."
        });
      }
    }

    // -----------------------------------------------------
    // 3. REGISTERED FARM LOCATION
    // -----------------------------------------------------

    else {

      finalLatitude =
        typeof user.latitude === "number" &&
        user.latitude !== 0
          ? user.latitude
          : null;

      finalLongitude =
        typeof user.longitude === "number" &&
        user.longitude !== 0
          ? user.longitude
          : null;

      locationName =
        user.farmLocation ||
        user.village ||
        user.district ||
        "Registered farm location";

      locationState =
        user.state || "";

      locationDistrict =
        user.district || "";

      locationVillage =
        user.village || "";

      locationSource =
        "registered_farm";


      // If registration didn't store coordinates,
      // try geocoding the registered farm location.

      if (
        finalLatitude === null ||
        finalLongitude === null
      ) {

        const searchText =
          [
            user.village,
            user.district,
            user.state
          ]
            .filter(Boolean)
            .join(", ");

        const geocoded =
          await geocodeLocation(
            searchText
          );

        if (geocoded) {

          finalLatitude =
            geocoded.latitude;

          finalLongitude =
            geocoded.longitude;

          if (!locationDistrict) {
            locationDistrict =
              geocoded.district;
          }

          if (!locationState) {
            locationState =
              geocoded.state;
          }
        }
      }
    }


    // =====================================================
    // VALIDATE LOCATION
    // =====================================================

    if (
      finalLatitude === null ||
      finalLongitude === null
    ) {

      return res.status(400).json({
        success: false,
        code: "LOCATION_COORDINATES_UNAVAILABLE",
        message:
          "Farm coordinates are not available. Please use your current location or select a location manually."
      });
    }


    // =====================================================
    // SEASON
    // =====================================================

    const currentSeason =
      requestedSeason &&
      requestedSeason !== "auto"
        ? requestedSeason
        : getAgriculturalSeason();


    // =====================================================
    // WEATHER
    // =====================================================

    const weather =
      await getWeather(
        finalLatitude,
        finalLongitude
      );


    // =====================================================
    // SOIL REPORT
    // =====================================================

    const soilReport =
      await getLatestSoilReport(
        user._id
      );


    // =====================================================
    // SOIL TYPE
    // =====================================================

    const selectedSoilType =
      normalizeSoilType(
        soilType
      );


    // =====================================================
    // CANDIDATE CROPS
    //
    // We evaluate all supported crops instead of blindly
    // returning the user's existing crops.
    // =====================================================

    const candidates =
      Object.values(CROP_PROFILES);


    // =====================================================
    // SCORE EACH CROP
    // =====================================================

    const evaluated =
      await Promise.all(

        candidates.map(
          async crop => {

            const seasonResult =
              scoreSeason(
                crop,
                currentSeason
              );

            const locationResult =
              scoreLocation(
                crop,
                locationState ||
                user.state
              );

            const weatherResult =
              scoreWeather(
                crop,
                weather
              );

            const soilResult =
              scoreSoil(
                crop,
                selectedSoilType,
                soilReport
              );

            const waterResult =
              scoreWaterCompatibility(
                crop,
                irrigationType ||
                ""
              );

            const budgetResult =
              scoreBudgetCompatibility(
                crop.budget,
                budget ||
                ""
              );

            const market =
              await getMarketInformation(
                crop,
                locationState ||
                user.state,
                locationDistrict ||
                user.district
              );

            const marketResult =
              scoreMarket(
                market
              );

            const farmerCropResult =
              scoreFarmerCropPreference(
                crop,
                farmerCrops
              );


            const score =
              calculateSuitabilityScore({

                seasonScore:
                  seasonResult.score,

                locationScore:
                  locationResult.score,

                weatherScore:
                  weatherResult.score,

                soilScore:
                  soilResult.score,

                waterScore:
                  waterResult.score,

                budgetScore:
                  budgetResult.score,

                marketScore:
                  marketResult.score,

                farmerCropScore:
                  farmerCropResult.score
              });


            const reasons = [
              seasonResult.reason,
              locationResult.reason,
              weatherResult.reason,
              soilResult.reason,
              waterResult.reason,
              budgetResult.reason,
              marketResult.reason,
              farmerCropResult.reason
            ].filter(Boolean);


            const advice =
              generateCropAdvice({
                crop,
                weather,
                irrigationType,
                season: currentSeason
              });


            return {

              crop:
                crop.name,

              cropKey:
                crop.name.toLowerCase(),

              suitabilityScore:
                score,

              expectedDurationDays:
                crop.durationDays,

              season:
                currentSeason,

              suitableSeasons:
                crop.seasons,

              waterRequirement:
                crop.water,

              preferredSoilTypes:
                crop.soilTypes,

              profitability:
                market.available
                  ? "Market data available"
                  : "Market data unavailable",

              market,

              reasons,

              advice,

              risks:
                crop.risks
            };
          }
        )
      );


    // =====================================================
    // REMOVE VERY POOR MATCHES
    //
    // A crop with a severe season mismatch should not appear
    // as one of the top recommendations.
    // =====================================================

    const filtered =
      evaluated.filter(
        crop =>
          crop.suitabilityScore >= 45
      );


    // Sort highest suitability first

    filtered.sort(
      (a, b) =>
        b.suitabilityScore -
        a.suitabilityScore
    );


    const recommendations =
      filtered.slice(0, 3);


    // =====================================================
    // FALLBACK
    // =====================================================

    if (!recommendations.length) {

      return res.json({

        success: true,

        message:
          "No crop currently reached the recommended suitability threshold with the available information.",

        location: {
          name: locationName,
          village:
            locationVillage ||
            user.village ||
            "",
          district:
            locationDistrict ||
            user.district ||
            "",
          state:
            locationState ||
            user.state ||
            "",
          latitude:
            finalLatitude,
          longitude:
            finalLongitude,
          source:
            locationSource
        },

        season:
          currentSeason,

        farmerProfile: {
          crops:
            farmerCrops,
          farmingType:
            user.farmingType || "",
          farmSize:
            farmSize || "",
          irrigationType:
            irrigationType || "",
          budget:
            budget || ""
        },

        weather,

        soil: soilReport
          ? {
              available: true,
              source:
                "latest_processed_report",
              testDate:
                soilReport.testDate,
              parameters:
                soilReport.parameters,
              analysis:
                soilReport.analysis
            }
          : {
              available: false,
              source:
                selectedSoilType
                  ? "manual_soil_type"
                  : "unavailable"
            },

        recommendations: [],

        warning:
          "Please verify soil conditions, local weather and agricultural department recommendations before making major cultivation decisions."
      });
    }


    // =====================================================
    // FARMER-FRIENDLY SUMMARY
    // =====================================================

    const bestCrop =
      recommendations[0];

    const summary =
      `Based on your ${currentSeason} season, farm location, available weather information, soil information and farming conditions, ${bestCrop.crop} currently has the highest suitability score of ${bestCrop.suitabilityScore}%.`;


    // =====================================================
    // ACTIVITY LOG
    // =====================================================

    try {

      await logActivity(
        user._id,
        {
          activityType:
            "crop-advisory",

          title:
            `Crop Advisory - ${bestCrop.crop}`,

          description:
            `Generated location-specific crop recommendations for ${locationName}`,

          status:
            "completed",

          result:
            `Top recommendation: ${bestCrop.crop} (${bestCrop.suitabilityScore}%)`,

          metadata: {
            location:
              locationName,

            state:
              locationState ||
              user.state,

            district:
              locationDistrict ||
              user.district,

            season:
              currentSeason,

            locationSource,

            recommendations:
              recommendations.map(
                item => ({
                  crop: item.crop,
                  score:
                    item.suitabilityScore
                })
              )
          }
        }
      );

    } catch (activityError) {

      console.error(
        "Advisory activity logging error:",
        activityError.message
      );
    }


    // =====================================================
    // FINAL RESPONSE
    // =====================================================

    return res.json({

      success: true,

      summary,

      location: {

        name:
          locationName,

        village:
          locationVillage ||
          user.village ||
          "",

        district:
          locationDistrict ||
          user.district ||
          "",

        state:
          locationState ||
          user.state ||
          "",

        latitude:
          finalLatitude,

        longitude:
          finalLongitude,

        source:
          locationSource
      },

      season:
        currentSeason,

      farmerProfile: {

        crops:
          farmerCrops,

        farmingType:
          user.farmingType || "",

        farmSize:
          farmSize || "",

        irrigationType:
          irrigationType || "",

        budget:
          budget || ""
      },

      weather: weather
        ? {
            available: true,

            current:
              weather.current,

            forecast:
              weather.daily
          }
        : {
            available: false,

            message:
              "Live weather data could not be retrieved."
          },

      soil: soilReport
        ? {

            available: true,

            source:
              "latest_processed_report",

            testDate:
              soilReport.testDate,

            parameters:
              soilReport.parameters,

            analysis:
              soilReport.analysis
          }
        : {

            available:
              Boolean(selectedSoilType),

            source:
              selectedSoilType
                ? "manual_soil_type"
                : "unavailable",

            soilType:
              selectedSoilType || null
          },

      recommendations,

      disclaimer:
        "These recommendations are generated from available location, weather, soil and farming data. They should be verified with local agricultural experts before major cultivation or financial decisions."
    });

  } catch (error) {

    console.error(
      "CROP ADVISORY ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      code:
        "CROP_ADVISORY_FAILED",

      message:
        "Unable to generate crop advisory right now. Please try again.",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined
    });
  }
});


module.exports = router;