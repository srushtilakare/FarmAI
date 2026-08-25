// backend/routes/soilReport.js

const express = require("express");
const router = express.Router();

const SoilReport = require("../models/SoilReport");
const auth = require("../middleware/auth");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  extractTextFromPDF,
  extractTextFromImage
} = require("../utils/pdfExtractor");

const { logActivity } = require("./activities");

// =========================================================
// MULTER CONFIGURATION
// =========================================================

const uploadDirectory = path.join(
  __dirname,
  "../uploads/soil-reports"
);

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, {
    recursive: true
  });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.random().toString(36).substring(7) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {
    const allowedExtensions = [
      ".pdf",
      ".jpg",
      ".jpeg",
      ".png"
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      return cb(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        )
      );
    }

    cb(null, true);
  }
});

// =========================================================
// DEFAULT SOIL PARAMETERS
// =========================================================

function createEmptySoilParameters() {
  return {
    nitrogen: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    phosphorus: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    potassium: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    pH: {
      value: null,
      status: "not_reported"
    },

    electricalConductivity: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    organicCarbon: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    // IMPORTANT:
    // Organic matter is different from organic carbon.
    organicMatter: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    iron: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    zinc: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    manganese: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    copper: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    boron: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    sulphur: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    calcium: {
      value: null,
      unit: null,
      status: "not_reported"
    },

    magnesium: {
      value: null,
      unit: null,
      status: "not_reported"
    }
  };
}

// =========================================================
// NORMALIZE OCR TEXT
// =========================================================

function normalizeOCRText(text) {
  if (!text) return "";

  return String(text)
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[|]+/g, " | ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim();
}

// =========================================================
// NORMALIZE OCR COMMON ERRORS
// =========================================================

function normalizeOCRTokens(text) {
  if (!text) return "";

  let result = String(text);

  // =======================================================
  // lbs/A
  // =======================================================

  result = result
    .replace(/\bIbs\s*\/\s*A\b/gi, "lbs/A")
    .replace(/\b1bs\s*\/\s*A\b/gi, "lbs/A")
    .replace(/\blbs\s*\/\s*A\b/gi, "lbs/A")
    .replace(/\blb\s*\/\s*A\b/gi, "lbs/A")
    .replace(/\bbs\s*\/\s*A\b/gi, "lbs/A");

  // =======================================================
  // mg/kg
  // =======================================================

  result = result
    .replace(/\bmg\s*\/\s*kg\b/gi, "mg/kg")
    .replace(/\bmg\s*kg-?1\b/gi, "mg/kg");

  // =======================================================
  // kg/ha
  // =======================================================

  result = result
    .replace(/\bkg\s*\/\s*ha\b/gi, "kg/ha")
    .replace(/\bkg\s*ha-?1\b/gi, "kg/ha");

  // =======================================================
  // PERCENTAGE
  // =======================================================

  result = result
    .replace(/\bpercent\b/gi, "%")
    .replace(/\bo\/o\b/gi, "%")
    .replace(/\b0\/0\b/gi, "%");

  // =======================================================
  // OCR DAMAGE AROUND UNITS
  // =======================================================

  result = result
    .replace(/\bmg\s*\/\s*kg\b/gi, "mg/kg")
    .replace(/\bkg\s*\/\s*ha\b/gi, "kg/ha");

  return result;
}

// =========================================================
// NUMBER NORMALIZATION
// =========================================================

function parseNumber(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  let cleaned = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.+\-eE]/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}

// =========================================================
// UNIT NORMALIZATION
// =========================================================

function normalizeUnit(unit) {
  if (!unit) return null;

  const cleaned = String(unit)
    .trim()
    .replace(/\s+/g, " ");

  const lower = cleaned.toLowerCase();

  if (
    lower === "kg/ha" ||
    lower === "kg / ha" ||
    lower === "kg ha-1"
  ) {
    return "kg/ha";
  }

  if (
    lower === "lbs/a" ||
    lower === "lb/a" ||
    lower === "lbs / a" ||
    lower === "lb / a" ||
    lower === "lbs/acre" ||
    lower === "lb/acre"
  ) {
    return "lbs/A";
  }

  if (
    lower === "mg/kg" ||
    lower === "mg / kg" ||
    lower === "mg kg-1"
  ) {
    return "mg/kg";
  }

  if (
    lower === "%" ||
    lower === "percent"
  ) {
    return "%";
  }

  if (lower === "ppm") {
    return "ppm";
  }

  if (
    lower === "ds/m" ||
    lower === "dsm-1" ||
    lower === "ds m-1"
  ) {
    return "dS/m";
  }

  if (
    lower === "meq/100g" ||
    lower === "meq / 100g"
  ) {
    return "meq/100g";
  }

  return cleaned;
}

// =========================================================
// STATUS HELPER
// =========================================================

function setReportedStatus(parameter) {
  if (
    parameter &&
    parameter.value !== null &&
    parameter.value !== undefined
  ) {
    parameter.status = "reported";
  }
}

// =========================================================
// PARAMETER DEFINITIONS
// =========================================================

const parameterDefinitions = [
  {
    key: "organicCarbon",
    names: [
      "organic carbon"
    ]
  },

  {
    key: "organicMatter",
    names: [
      "organic matter"
    ]
  },

  {
    key: "nitrogen",
    names: [
      "available nitrogen",
      "total kjeldahl nitrogen",
      "total nitrogen"
    ]
  },

  {
    key: "phosphorus",
    names: [
      "available phosphorus",
      "phosphorous",
      "phosphorus"
    ]
  },

  {
    key: "potassium",
    names: [
      "available potassium",
      "potassium"
    ]
  },

  {
    key: "magnesium",
    names: [
      "available magnesium",
      "magnesium"
    ]
  },

  {
    key: "calcium",
    names: [
      "available calcium",
      "calcium"
    ]
  },

  {
    key: "manganese",
    names: [
      "available manganese",
      "manganese"
    ]
  },

  {
    key: "iron",
    names: [
      "available iron",
      "iron"
    ]
  },

  {
    key: "copper",
    names: [
      "available copper",
      "copper"
    ]
  },

  {
    key: "zinc",
    names: [
      "available zinc",
      "zinc"
    ]
  },

  {
    key: "boron",
    names: [
      "available boron",
      "boron"
    ]
  },

  {
    key: "sulphur",
    names: [
      "available sulphur",
      "available sulfur",
      "sulphur",
      "sulfur",
      "sulfur (so4-s)"
    ]
  }
];

// =========================================================
// PARAMETER SEARCH ORDER
// =========================================================

const allParameterAliases = [
  "organic carbon",
  "organic matter",

  "available nitrogen",
  "total kjeldahl nitrogen",
  "total nitrogen",

  "available phosphorus",
  "phosphorous",
  "phosphorus",

  "available potassium",
  "potassium",

  "available magnesium",
  "magnesium",

  "available calcium",
  "calcium",

  "available manganese",
  "manganese",

  "available iron",
  "iron",

  "available copper",
  "copper",

  "available zinc",
  "zinc",

  "available boron",
  "boron",

  "available sulphur",
  "available sulfur",
  "sulphur",
  "sulfur",

  "ph"
];

// =========================================================
// SOIL TABLE TEXT ONLY
// =========================================================

function isolateSoilTestSection(text) {
  if (!text) return "";

  let result = text;

  const stopPatterns = [
    /\bnutrient requirements\b/i,
    /\bcropping options\b/i,
    /\blimestone suggestions\b/i
  ];

  for (const pattern of stopPatterns) {
    const match = result.search(pattern);

    if (match !== -1) {
      result = result.substring(0, match);
    }
  }

  return result;
}

// =========================================================
// FIND PARAMETER SEGMENT ON A LINE
// =========================================================

function getParameterSegment(
  line,
  parameterName
) {
  if (!line || !parameterName) {
    return "";
  }

  const lowerLine =
    line.toLowerCase();

  const startIndex =
    lowerLine.indexOf(
      parameterName.toLowerCase()
    );

  if (startIndex === -1) {
    return "";
  }

  let endIndex = line.length;

  for (
    const alias of allParameterAliases
  ) {
    const aliasLower =
      alias.toLowerCase();

    if (
      aliasLower ===
      parameterName.toLowerCase()
    ) {
      continue;
    }

    const index =
      lowerLine.indexOf(
        aliasLower,
        startIndex +
          parameterName.length
      );

    if (
      index !== -1 &&
      index < endIndex
    ) {
      endIndex = index;
    }
  }

  return line
    .substring(
      startIndex,
      endIndex
    )
    .trim();
}

// =========================================================
// EXTRACT EXPLICIT RATING
// =========================================================

function extractRating(segment) {
  if (!segment) return null;

  const match =
    segment.match(
      /\b(low|medium|high|very\s+low|very\s+high|normal|adequate|deficient|sufficient)\b/i
    );

  if (!match) {
    return null;
  }

  return match[1]
    .toLowerCase()
    .replace(/\s+/g, "_");
}

// =========================================================
// EXTRACT VALUE + UNIT
// =========================================================

function extractValueAndUnit(
  segment,
  key
) {
  if (!segment) {
    return null;
  }

  let text =
    normalizeOCRTokens(segment);

  /*
   * IMPORTANT:
   *
   * Only inspect this parameter's own
   * segment.
   *
   * Example:
   *
   * Phosphorus | 144 | kg/ha | Low | Zinc | 1.31 | mg/kg
   *
   * The phosphorus segment must stop before Zinc.
   */

  // =======================================================
  // UNIT + VALUE
  // =======================================================

  const unitPattern =
    /(kg\s*\/\s*ha|lbs?\s*\/\s*A|lbs?\s*\/\s*acre|mg\s*\/\s*kg|ppm|dS\s*\/\s*m|meq\s*\/\s*100g|%)/i;

  /*
   * Permit optional OCR separators such as:
   *
   * 542 | kg/ha
   * 542 kg/ha
   * 542 |kg/ha
   */

  const valueBeforeUnit =
    new RegExp(
      "(-?\\d+(?:\\.\\d+)?)\\s*(?:\\|\\s*)?" +
        unitPattern.source,
      "i"
    );

  const match =
    text.match(valueBeforeUnit);

  if (match) {
    let value =
      parseNumber(match[1]);

    let unit =
      normalizeUnit(match[2]);

    if (
      value !== null &&
      unit
    ) {
      // ===================================================
      // ORGANIC CARBON OCR CORRECTION
      // ===================================================

      if (
        key === "organicCarbon" &&
        unit !== "%" &&
        value > 1 &&
        value <= 1000 &&
        /\b(?:ow|o\/o|0\/0)\b/i.test(
          text
        )
      ) {
        value =
          value / 100;

        unit = "%";
      }

      // ===================================================
      // ORGANIC MATTER OCR CORRECTION
      // ===================================================

      if (
        key === "organicMatter" &&
        unit !== "%" &&
        value > 1 &&
        value <= 1000 &&
        /\b(?:ow|o\/o|0\/0)\b/i.test(
          text
        )
      ) {
        value =
          value / 10;

        unit = "%";
      }

      return {
        value,
        unit,
        rating:
          extractRating(text)
      };
    }
  }

  // =======================================================
  // PH WITHOUT UNIT
  // =======================================================

  if (key === "pH") {
    const pHMatch =
      text.match(
        /(?:pHs?|salt\s*pH|pH\s*in\s*water)[^0-9-]*(-?\d+(?:\.\d+)?)/i
      );

    if (pHMatch) {
      let value =
        parseNumber(
          pHMatch[1]
        );

      if (
        value !== null &&
        value > 14 &&
        value <= 140
      ) {
        /*
         * OCR:
         *
         * 4.8 -> 48
         * 5.5 -> 55
         */

        value =
          value / 10;
      }

      if (
        value !== null &&
        value >= 0 &&
        value <= 14
      ) {
        return {
          value,
          unit: null,
          rating:
            extractRating(text)
        };
      }
    }
  }

  // =======================================================
  // ORGANIC CARBON / MATTER WITHOUT %
  // =======================================================

  if (
    key === "organicCarbon" ||
    key === "organicMatter"
  ) {
    const numberMatch =
      text.match(
        /(?:organic\s+carbon|organic\s+matter)[^0-9]*(-?\d+(?:\.\d+)?)/i
      );

    if (numberMatch) {
      let value =
        parseNumber(
          numberMatch[1]
        );

      if (
        value !== null &&
        value > 10 &&
        value <= 1000
      ) {
        if (
          key ===
          "organicCarbon"
        ) {
          value =
            value / 100;
        } else {
          value =
            value / 10;
        }

        return {
          value,
          unit: "%",
          rating:
            extractRating(text)
        };
      }

      if (
        value !== null &&
        value >= 0 &&
        value <= 10
      ) {
        return {
          value,
          unit: "%",
          rating:
            extractRating(text)
        };
      }
    }
  }

  /*
   * IMPORTANT:
   *
   * There is NO generic "take any number"
   * fallback here.
   *
   * This prevents values from being extracted
   * without a reliable unit.
   */

  return null;
}

// =========================================================
// FIND PARAMETER IN OCR LINES
// =========================================================

function findParameterValue(
  lines,
  definition
) {
  for (
    const line of lines
  ) {
    const lower =
      line.toLowerCase();

    for (
      const name of definition.names
    ) {
      if (
        !lower.includes(
          name.toLowerCase()
        )
      ) {
        continue;
      }

      const segment =
        getParameterSegment(
          line,
          name
        );

      if (!segment) {
        continue;
      }

      console.log(
        `🔎 ${definition.key} row: ${line}`
      );

      const result =
        extractValueAndUnit(
          segment,
          definition.key
        );

      if (result) {
        console.log(
          `✅ ${definition.key}: ${result.value} ${
            result.unit || ""
          }${
            result.rating
              ? ` (${result.rating})`
              : ""
          }`
        );

        return result;
      }
    }
  }

  return null;
}

// =========================================================
// EXTRACT PHYSICO-CHEMICAL PARAMETERS
// =========================================================

function extractSoilParameters(
  text
) {
  const soil =
    createEmptySoilParameters();

  const normalized =
    normalizeOCRTokens(
      normalizeOCRText(text)
    );

  if (!normalized) {
    return soil;
  }

  /*
   * Remove lower recommendation sections.
   */

  const soilSection =
    isolateSoilTestSection(
      normalized
    );

  const lines =
    soilSection
      .split("\n")
      .map(line =>
        line.trim()
      )
      .filter(Boolean);

  console.log(
    "🔍 Table-aware soil extraction started..."
  );

  // =======================================================
  // PH
  // =======================================================

  const pHLines =
    lines.filter(line =>
      /\bpHs?\b|salt\s*pH|pH\s*in\s*water/i.test(
        line
      )
    );

  for (
    const line of pHLines
  ) {
    if (
      /phosph|phosphor/i.test(
        line
      )
    ) {
      continue;
    }

    console.log(
      `🔎 pH row: ${line}`
    );

    const result =
      extractValueAndUnit(
        line,
        "pH"
      );

    if (result) {
      soil.pH.value =
        result.value;

      soil.pH.status =
        "reported";

      console.log(
        `✅ pH: ${result.value}${
          result.rating
            ? ` (${result.rating})`
            : ""
        }`
      );

      break;
    }
  }

  // =======================================================
  // ELECTRICAL CONDUCTIVITY
  // =======================================================

  for (
    const line of lines
  ) {
    if (
      !/electrical conductivity|\bEC\b/i.test(
        line
      )
    ) {
      continue;
    }

    console.log(
      `🔎 electricalConductivity row: ${line}`
    );

    const result =
      extractValueAndUnit(
        line,
        "electricalConductivity"
      );

    if (result) {
      soil.electricalConductivity.value =
        result.value;

      soil.electricalConductivity.unit =
        result.unit;

      setReportedStatus(
        soil.electricalConductivity
      );

      break;
    }
  }

  // =======================================================
  // NUTRIENTS / PROPERTIES
  // =======================================================

  for (
    const definition of
      parameterDefinitions
  ) {
    const result =
      findParameterValue(
        lines,
        definition
      );

    if (!result) {
      continue;
    }

    soil[
      definition.key
    ].value =
      result.value;

    soil[
      definition.key
    ].unit =
      result.unit;

    setReportedStatus(
      soil[
        definition.key
      ]
    );
  }

  return soil;
}

// =========================================================
// VALIDATION
// =========================================================

function validateExtractedParameters(
  soil
) {
  const warnings = [];

  const parameterKeys = [
    "nitrogen",
    "phosphorus",
    "potassium",
    "organicCarbon",
    "organicMatter",
    "iron",
    "zinc",
    "manganese",
    "copper",
    "boron",
    "sulphur",
    "calcium",
    "magnesium"
  ];

  for (
    const key of parameterKeys
  ) {
    const parameter =
      soil[key];

    if (
      parameter &&
      parameter.value !== null &&
      parameter.value !== undefined
    ) {
      if (
        !parameter.unit &&
        key !== "pH"
      ) {
        warnings.push(
          `${key}: value detected but unit was not detected`
        );
      }
    }
  }

  if (
    soil.pH.value === null
  ) {
    warnings.push(
      "pH was not reported in the uploaded report"
    );
  }

  if (
    soil.electricalConductivity
      .value === null
  ) {
    warnings.push(
      "Electrical conductivity was not reported in the uploaded report"
    );
  }

  return warnings;
}

// =========================================================
// SOIL ANALYSIS
// =========================================================

async function analyzeSoilReport(
  soil,
  location = {}
) {
  const correctionMeasures = [];

  // =======================================================
  // PH
  // =======================================================

  if (
    soil.pH.value !== null
  ) {
    const ph =
      soil.pH.value;

    if (ph < 5.5) {
      soil.pH.status =
        "acidic";
    } else if (
      ph <= 7.5
    ) {
      soil.pH.status =
        "near_neutral";
    } else {
      soil.pH.status =
        "alkaline";
    }
  }

  // =======================================================
  // ORGANIC CARBON
  // =======================================================

  if (
    soil.organicCarbon.value !==
      null &&
    soil.organicCarbon.unit ===
      "%"
  ) {
    const oc =
      soil.organicCarbon.value;

    if (oc < 0.5) {
      soil.organicCarbon.status =
        "low";

      correctionMeasures.push({
        issue:
          "Low organic carbon",

        solution:
          "Increase organic matter through well-decomposed farmyard manure, compost, crop residues or other locally recommended organic inputs.",

        priority:
          "medium"
      });
    } else if (
      oc < 0.75
    ) {
      soil.organicCarbon.status =
        "medium";
    } else {
      soil.organicCarbon.status =
        "high";
    }
  }

  // =======================================================
  // ORGANIC MATTER
  // =======================================================

  if (
    soil.organicMatter &&
    soil.organicMatter.value !==
      null &&
    soil.organicMatter.unit ===
      "%"
  ) {
    const om =
      soil.organicMatter.value;

    if (om < 2) {
      soil.organicMatter.status =
        "low";
    } else if (
      om < 4
    ) {
      soil.organicMatter.status =
        "medium";
    } else {
      soil.organicMatter.status =
        "high";
    }
  }

  // =======================================================
  // EC
  // =======================================================

  if (
    soil.electricalConductivity
      .value !== null &&
    soil.electricalConductivity
      .unit === "dS/m"
  ) {
    if (
      soil.electricalConductivity
        .value > 4
    ) {
      soil.electricalConductivity.status =
        "high";

      correctionMeasures.push({
        issue:
          "High electrical conductivity",

        solution:
          "Assess irrigation-water quality, drainage and salt-management requirements before making fertilizer changes.",

        priority:
          "high"
      });
    } else if (
      soil.electricalConductivity
        .value > 2
    ) {
      soil.electricalConductivity.status =
        "elevated";
    } else {
      soil.electricalConductivity.status =
        "normal";
    }
  }

  // =======================================================
  // REPORTED NUTRIENTS
  // =======================================================

  const reportedNutrients = [];

  if (
    soil.nitrogen.value !== null
  ) {
    reportedNutrients.push(
      "Nitrogen"
    );
  }

  if (
    soil.phosphorus.value !== null
  ) {
    reportedNutrients.push(
      "Phosphorus"
    );
  }

  if (
    soil.potassium.value !== null
  ) {
    reportedNutrients.push(
      "Potassium"
    );
  }

  // =======================================================
  // SUMMARY
  // =======================================================

  let summary =
    "The uploaded laboratory report was successfully read. ";

  if (
    reportedNutrients.length > 0
  ) {
    summary +=
      `The report contains results for ${reportedNutrients.join(
        ", "
      )}. `;
  }

  if (
    soil.pH.value === null
  ) {
    summary +=
      "pH was not reported, so pH-based recommendations are not generated. ";
  }

  if (
    soil.electricalConductivity
      .value === null
  ) {
    summary +=
      "Electrical conductivity was not reported, so salinity cannot be assessed from this report alone. ";
  }

  if (
    soil.organicCarbon.value !==
      null
  ) {
    summary +=
      `Organic carbon was reported at ${soil.organicCarbon.value}${
        soil.organicCarbon.unit || ""
      }. `;
  }

  if (
    soil.organicMatter &&
    soil.organicMatter.value !==
      null
  ) {
    summary +=
      `Organic matter was reported at ${soil.organicMatter.value}${
        soil.organicMatter.unit || ""
      }.`;
  }

  // =======================================================
  // OVERALL RATING
  // =======================================================

  let overallRating =
    "moderate";

  if (
    soil.pH.value !== null &&
    (
      soil.organicCarbon.value !==
        null ||
      (
        soil.organicMatter &&
        soil.organicMatter.value !==
          null
      )
    )
  ) {
    overallRating =
      "good";
  }

  if (
    correctionMeasures.some(
      item =>
        item.priority ===
        "high"
    )
  ) {
    overallRating =
      "moderate";
  }

  // =======================================================
  // SUITABLE CROPS
  // =======================================================

  const suitableCrops = [
    {
      cropName:
        "Crop selection requires more information",

      suitabilityScore:
        0,

      reason:
        "Select the intended crop and provide location/season information for a meaningful soil-based suitability assessment."
    }
  ];

  // =======================================================
  // FERTILIZER RECOMMENDATION
  // =======================================================

  const fertilizerRecommendation = {
    plan:
      "Use the laboratory results together with the selected crop, soil-test method, target yield and applicable local/state fertilizer recommendation. Do not apply a blanket NPK ratio.",

    npkRatio:
      "Crop-specific — no blanket NPK ratio",

    organicOptions: [
      "Compost",
      "Farmyard manure",
      "Vermicompost"
    ],

    applicationSchedule:
      "Determine timing and quantity after selecting the crop and applying the relevant local recommendation."
  };

  // =======================================================
  // EXPLICIT LAB RATINGS
  // =======================================================

  const explicitRatings = {};

  /*
   * Ratings are intentionally not stored in parameter.status
   * because status is already used by the frontend for
   * reported/not_reported and analysis states.
   */

  return {
    analysis: {
      soilHealthSummary:
        summary,

      soilType:
        "Not reported",

      overallRating,

      suitableCrops,

      fertilizerRecommendation,

      correctionMeasures,

      seasonalAdvice:
        "Interpret the soil report together with crop, season, irrigation availability and local agricultural recommendations. Parameters not reported by the laboratory should not be assumed."
    },

    extractedParameters:
      soil
  };
}

// =========================================================
// UPLOAD REPORT
// =========================================================

router.post(
  "/upload",
  auth,
  upload.single("report"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error:
            "Report file is required"
        });
      }

      console.log(
        "================================================="
      );

      console.log(
        "📄 SOIL REPORT UPLOAD"
      );

      console.log(
        "Original file:",
        req.file.originalname
      );

      console.log(
        "Stored file:",
        req.file.path
      );

      console.log(
        "MIME type:",
        req.file.mimetype
      );

      console.log(
        "Extension:",
        path.extname(
          req.file.originalname
        )
      );

      console.log(
        "================================================="
      );

      const {
        location,
        testDate,
        labName
      } = req.body;

      let parsedLocation = {};

      if (location) {
        try {
          parsedLocation =
            JSON.parse(location);
        } catch (error) {
          console.warn(
            "⚠️ Invalid location JSON"
          );
        }
      }

      const soilReport =
        new SoilReport({
          userId:
            req.user._id,

          location:
            parsedLocation,

          reportFile: {
            url:
              `/uploads/soil-reports/${req.file.filename}`,

            fileName:
              req.file.originalname,

            fileType:
              req.file.mimetype
          },

          testDate:
            testDate ||
            new Date(),

          labName:
            labName ||
            "Unknown Lab",

          soilParameters:
            createEmptySoilParameters(),

          processed:
            false
        });

      await soilReport.save();

      // =====================================================
      // EXTRACT REPORT TEXT
      // =====================================================

      let extractedText =
        "";

      const extension =
        path
          .extname(
            req.file.originalname
          )
          .toLowerCase();

      if (
        req.file.mimetype ===
          "application/pdf" ||
        extension === ".pdf"
      ) {
        console.log(
          "📄 PDF detected → starting PDF extraction pipeline"
        );

        extractedText =
          await extractTextFromPDF(
            req.file.path
          );
      } else {
        console.log(
          "🖼️ Image detected → starting image OCR pipeline"
        );

        extractedText =
          await extractTextFromImage(
            req.file.path
          );
      }

      console.log(
        "================================================="
      );

      console.log(
        "📄 SOIL REPORT TEXT LENGTH:",
        extractedText.length
      );

      console.log(
        "📄 SOIL REPORT TEXT PREVIEW:"
      );

      console.log(
        extractedText.slice(
          0,
          4000
        )
      );

      console.log(
        "================================================="
      );

      // =====================================================
      // SAVE EXTRACTION RESULTS
      // =====================================================

      await analyzeReportAsync(
        soilReport._id,
        extractedText
      );

      // =====================================================
      // LOG ACTIVITY
      // =====================================================

      await logActivity(
        req.user._id,
        {
          activityType:
            "soil-report",

          title:
            "Soil Report Uploaded",

          description:
            "Uploaded soil test report",

          status:
            "completed",

          result:
            "Report uploaded and analysis started",

          relatedId:
            soilReport._id,

          relatedModel:
            "SoilReport"
        }
      );

      res.json({
        success:
          true,

        message:
          "Soil report uploaded successfully. Analysis started.",

        reportId:
          soilReport._id
      });
    } catch (error) {
      console.error(
        "❌ Error uploading soil report:",
        error
      );

      res.status(500).json({
        error:
          error.message ||
          "Failed to upload soil report"
      });
    }
  }
);

// =========================================================
// ASYNC ANALYSIS
// =========================================================

async function analyzeReportAsync(
  reportId,
  extractedText
) {
  try {
    const report =
      await SoilReport.findById(
        reportId
      );

    if (!report) {
      console.error(
        "Report not found:",
        reportId
      );

      return;
    }

    // =====================================================
    // EXTRACT PARAMETERS
    // =====================================================

    const soil =
      extractSoilParameters(
        extractedText
      );

    console.log(
      "🔬 FINAL EXTRACTED PARAMETERS:"
    );

    console.log(
      JSON.stringify(
        soil,
        null,
        2
      )
    );

    // =====================================================
    // VALIDATE
    // =====================================================

    const warnings =
      validateExtractedParameters(
        soil
      );

    if (
      warnings.length > 0
    ) {
      console.log(
        "⚠️ Extraction warnings:"
      );

      warnings.forEach(
        warning =>
          console.log(
            " -",
            warning
          )
      );
    }

    // =====================================================
    // ANALYZE
    // =====================================================

    const result =
      await analyzeSoilReport(
        soil,
        report.location
      );

    // =====================================================
    // SAVE
    // =====================================================

    report.soilParameters =
      result.extractedParameters;

    report.aiAnalysis =
      result.analysis;

    report.processed =
      true;

    report.processingError =
      warnings.length > 0
        ? warnings.join(
            " | "
          )
        : null;

    await report.save();

    // =====================================================
    // LOG COMPLETION
    // =====================================================

    await logActivity(
      report.userId,
      {
        activityType:
          "soil-report",

        title:
          "Soil Report Analysis Completed",

        description:
          "Soil report values extracted and analyzed",

        status:
          "completed",

        result:
          `Report processed. ${warnings.length} extraction warning(s).`
      }
    );

    console.log(
      "================================================="
    );

    console.log(
      "✅ SOIL REPORT ANALYSIS COMPLETED"
    );

    console.log(
      "Report ID:",
      reportId
    );

    console.log(
      "================================================="
    );
  } catch (error) {
    console.error(
      "❌ Error in soil report analysis:",
      error
    );

    try {
      await SoilReport.findByIdAndUpdate(
        reportId,
        {
          processed:
            false,

          processingError:
            error.message ||
            "Unknown processing error"
        }
      );
    } catch (updateError) {
      console.error(
        "Could not save processing error:",
        updateError
      );
    }
  }
}

// =========================================================
// GET USER REPORTS
// =========================================================

router.get(
  "/my-reports",
  auth,
  async (req, res) => {
    try {
      const reports =
        await SoilReport.find({
          userId:
            req.user._id
        }).sort({
          createdAt:
            -1
        });

      res.json({
        success:
          true,

        reports
      });
    } catch (error) {
      console.error(
        "Error fetching soil reports:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch reports"
      });
    }
  }
);

// =========================================================
// EXPORT
// =========================================================

module.exports =
  router;