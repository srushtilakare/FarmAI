// =========================================================
// FARM AI - SOIL ANALYSIS ENGINE
// =========================================================
//
// This module:
// 1. Detects report type
// 2. Extracts soil parameters from OCR/PDF text
// 3. Normalizes units
// 4. Calculates general soil-test status
// 5. Generates soil-based crop suitability
// 6. Generates conservative fertilizer guidance
//
// IMPORTANT:
// Exact fertilizer dosage is NOT generated without:
// - selected crop
// - region/state
// - crop recommendation standard
// - target yield / agronomic context
//
// =========================================================

// =========================================================
// EMPTY PARAMETERS
// =========================================================

function createEmptySoilParameters() {
    return {
      nitrogen: {
        value: null,
        unit: "kg/ha",
        status: "unknown"
      },
  
      phosphorus: {
        value: null,
        unit: "kg/ha",
        status: "unknown"
      },
  
      potassium: {
        value: null,
        unit: "kg/ha",
        status: "unknown"
      },
  
      pH: {
        value: null,
        unit: "",
        status: "unknown"
      },
  
      electricalConductivity: {
        value: null,
        unit: "dS/m",
        status: "unknown"
      },
  
      organicCarbon: {
        value: null,
        unit: "%",
        status: "unknown"
      },
  
      iron: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      zinc: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      manganese: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      copper: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      boron: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      sulphur: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      calcium: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      },
  
      magnesium: {
        value: null,
        unit: "mg/kg",
        status: "unknown"
      }
    };
  }
  
  // =========================================================
  // TEXT NORMALIZATION
  // =========================================================
  
  function normalizeText(text = "") {
    return String(text)
      .replace(/\r/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[‐-‒–—]/g, "-")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  
  function normalizeNumber(value) {
    if (value === null || value === undefined) {
      return null;
    }
  
    const cleaned = String(value)
      .replace(/,/g, "")
      .trim();
  
    const number = Number(cleaned);
  
    return Number.isFinite(number) ? number : null;
  }
  
  // =========================================================
  // REPORT TYPE DETECTION
  // =========================================================
  
  function detectReportType(text = "") {
    const value = normalizeText(text).toLowerCase();
  
    const agriculturalKeywords = [
      "agriculture soil",
      "agricultural soil",
      "soil fertility",
      "soil health",
      "available nitrogen",
      "available phosphorus",
      "available potassium",
      "organic carbon",
      "organic matter",
      "crop",
      "cultivation",
      "fertility",
      "farm",
      "field",
      "p2o5",
      "k2o"
    ];
  
    const constructionKeywords = [
      "construction",
      "building",
      "industrial canteen",
      "embankment",
      "embankment fill",
      "fill soil",
      "proctor",
      "modified proctor",
      "maximum dry density",
      "optimum moisture content",
      "california bearing ratio",
      "cbr",
      "liquid limit",
      "plastic limit",
      "plasticity index",
      "grain size analysis",
      "sieve size",
      "road construction",
      "geotechnical",
      "compaction",
      "rdso"
    ];
  
    let agriculturalScore = 0;
    let constructionScore = 0;
  
    for (const keyword of agriculturalKeywords) {
      if (value.includes(keyword)) {
        agriculturalScore++;
      }
    }
  
    for (const keyword of constructionKeywords) {
      if (value.includes(keyword)) {
        constructionScore++;
      }
    }
  
    if (constructionScore >= 2) {
      return {
        type: "geotechnical",
        confidence: constructionScore >= 4 ? "high" : "medium"
      };
    }
  
    if (
      agriculturalScore >= 2 ||
      /available\s+(nitrogen|phosphorus|potassium)/i.test(value)
    ) {
      return {
        type: "agricultural",
        confidence: agriculturalScore >= 4 ? "high" : "medium"
      };
    }
  
    return {
      type: "unknown",
      confidence: "low"
    };
  }
  
  // =========================================================
  // SOIL TYPE DETECTION
  // =========================================================
  
  function detectSoilType(text = "") {
    const value = normalizeText(text).toLowerCase();
  
    const soilTypes = [
      "sandy clay loam",
      "sandy loam",
      "clayey loam",
      "clay loam",
      "silty clay loam",
      "silty loam",
      "loamy sand",
      "sandy clay",
      "silty clay",
      "clay",
      "loam",
      "sand"
    ];
  
    for (const type of soilTypes) {
      if (value.includes(type)) {
        return type
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(" ");
      }
    }
  
    return "Not reported";
  }
  
  // =========================================================
  // NUMBER EXTRACTION
  // =========================================================
  
  function extractNumbers(text) {
    const matches = String(text).match(
      /[-+]?\d+(?:,\d{3})*(?:\.\d+)?/g
    );
  
    if (!matches) return [];
  
    return matches
      .map(normalizeNumber)
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value)
      );
  }
  
  // =========================================================
  // UNIT DETECTION
  // =========================================================
  
  function detectUnit(text, fallback = "") {
    const value = String(text).toLowerCase();
  
    if (/kg\s*\/\s*ha/.test(value)) {
      return "kg/ha";
    }
  
    if (/mg\s*\/\s*kg/.test(value)) {
      return "mg/kg";
    }
  
    if (/\bppm\b/.test(value)) {
      return "ppm";
    }
  
    if (/d\s*s\s*\/\s*m/.test(value)) {
      return "dS/m";
    }
  
    if (/m\s*s\s*\/\s*cm/.test(value)) {
      return "mS/cm";
    }
  
    if (/%/.test(value)) {
      return "%";
    }
  
    if (/mg\s*\/\s*g/.test(value)) {
      return "mg/g";
    }
  
    if (/mg\s*\/\s*gm/.test(value)) {
      return "mg/g";
    }
  
    return fallback;
  }
  
  // =========================================================
  // PARAMETER EXTRACTION
  // =========================================================
  
  function extractParameterFromText(
    text,
    aliases,
    defaultUnit = ""
  ) {
    const lines = normalizeText(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  
    for (let i = 0; i < lines.length; i++) {
      const current = lines[i].toLowerCase();
  
      const alias = aliases.find((item) =>
        current.includes(item.toLowerCase())
      );
  
      if (!alias) continue;
  
      const combined = [
        lines[i - 1] || "",
        lines[i],
        lines[i + 1] || "",
        lines[i + 2] || ""
      ].join(" ");
  
      const aliasIndex = current.indexOf(
        alias.toLowerCase()
      );
  
      let searchArea =
        aliasIndex >= 0
          ? lines[i].substring(
              aliasIndex + alias.length
            )
          : lines[i];
  
      const afterAlias = [
        searchArea,
        lines[i + 1] || "",
        lines[i + 2] || ""
      ].join(" ");
  
      let numbers = extractNumbers(afterAlias);
  
      // If OCR split the parameter name/value strangely,
      // search the combined local area.
      if (numbers.length === 0) {
        numbers = extractNumbers(combined);
      }
  
      if (numbers.length === 0) {
        continue;
      }
  
      const value = numbers[0];
  
      const unit =
        detectUnit(afterAlias, defaultUnit) ||
        defaultUnit;
  
      return {
        value,
        unit,
        found: true
      };
    }
  
    return {
      value: null,
      unit: defaultUnit,
      found: false
    };
  }
  
  // =========================================================
  // STATUS RULES
  // =========================================================
  //
  // General Indian soil-test interpretation bands.
  // These are intentionally kept conservative and can later
  // be made state/method specific.
  //
  // =========================================================
  
  function statusFromRange(
    value,
    lowLimit,
    highLimit
  ) {
    if (value === null || value === undefined) {
      return "unknown";
    }
  
    if (value < lowLimit) return "low";
    if (value <= highLimit) return "medium";
  
    return "high";
  }
  
  function calculateStatuses(soil) {
    // pH
    if (soil.pH.value !== null) {
      if (soil.pH.value < 6.5) {
        soil.pH.status = "acidic";
      } else if (soil.pH.value <= 8.2) {
        soil.pH.status = "normal";
      } else {
        soil.pH.status = "alkaline";
      }
    }
  
    // EC
    if (
      soil.electricalConductivity.value !== null
    ) {
      const ec =
        soil.electricalConductivity.value;
  
      if (ec < 1) {
        soil.electricalConductivity.status =
          "normal";
      } else if (ec <= 3) {
        soil.electricalConductivity.status =
          "medium";
      } else {
        soil.electricalConductivity.status =
          "high";
      }
    }
  
    // Organic carbon
    soil.organicCarbon.status =
      statusFromRange(
        soil.organicCarbon.value,
        0.5,
        0.75
      );
  
    // N
    soil.nitrogen.status =
      statusFromRange(
        soil.nitrogen.value,
        280,
        560
      );
  
    // P
    soil.phosphorus.status =
      statusFromRange(
        soil.phosphorus.value,
        28,
        56
      );
  
    // K
    soil.potassium.status =
      statusFromRange(
        soil.potassium.value,
        140,
        280
      );
  
    // S
    soil.sulphur.status =
      statusFromRange(
        soil.sulphur.value,
        10,
        20
      );
  
    // Zn
    soil.zinc.status =
      statusFromRange(
        soil.zinc.value,
        0.5,
        1
      );
  
    // Fe
    soil.iron.status =
      statusFromRange(
        soil.iron.value,
        5,
        10
      );
  
    // Mn
    soil.manganese.status =
      statusFromRange(
        soil.manganese.value,
        5,
        10
      );
  
    // Cu
    soil.copper.status =
      statusFromRange(
        soil.copper.value,
        0.2,
        0.4
      );
  
    // B
    soil.boron.status =
      statusFromRange(
        soil.boron.value,
        0.5,
        1
      );
  
    return soil;
  }
  
  // =========================================================
  // EXTRACT ALL SOIL PARAMETERS
  // =========================================================
  
  function extractSoilParameters(text) {
    const soil = createEmptySoilParameters();
  
    // -------------------------------------------------------
    // Macronutrients
    // -------------------------------------------------------
  
    const nitrogen = extractParameterFromText(
      text,
      [
        "available nitrogen",
        "available nitrogen (as n)",
        "nitrogen (as n)",
        "total nitrogen",
        "nitrogen"
      ],
      "kg/ha"
    );
  
    const phosphorus = extractParameterFromText(
      text,
      [
        "available phosphorus",
        "available phosphorous",
        "available phosphorus (as p)",
        "phosphorus (as p)",
        "phosphorous (as p)"
      ],
      "kg/ha"
    );
  
    const potassium = extractParameterFromText(
      text,
      [
        "available potassium",
        "available potash",
        "available potassium (as k)",
        "potassium (as k)"
      ],
      "kg/ha"
    );
  
    soil.nitrogen.value = nitrogen.value;
    soil.nitrogen.unit = nitrogen.unit;
  
    soil.phosphorus.value = phosphorus.value;
    soil.phosphorus.unit = phosphorus.unit;
  
    soil.potassium.value = potassium.value;
    soil.potassium.unit = potassium.unit;
  
    // -------------------------------------------------------
    // Soil properties
    // -------------------------------------------------------
  
    const ph = extractParameterFromText(
      text,
      [
        "ph value",
        "soil ph",
        "ph (1:2.5)",
        "ph"
      ],
      ""
    );
  
    const ec = extractParameterFromText(
      text,
      [
        "electrical conductivity",
        "electrical conductance",
        "soil ec",
        "ec"
      ],
      "dS/m"
    );
  
    const organicCarbon =
      extractParameterFromText(
        text,
        [
          "organic carbon",
          "soil organic carbon",
          "organic c"
        ],
        "%"
      );
  
    soil.pH.value = ph.value;
    soil.pH.unit = "";
  
    soil.electricalConductivity.value =
      ec.value;
    soil.electricalConductivity.unit =
      ec.unit || "dS/m";
  
    soil.organicCarbon.value =
      organicCarbon.value;
    soil.organicCarbon.unit =
      organicCarbon.unit || "%";
  
    // -------------------------------------------------------
    // Micronutrients
    // -------------------------------------------------------
  
    const iron = extractParameterFromText(
      text,
      [
        "available iron",
        "iron (as fe)",
        "iron"
      ],
      "mg/kg"
    );
  
    const zinc = extractParameterFromText(
      text,
      [
        "available zinc",
        "zinc (as zn)",
        "zinc"
      ],
      "mg/kg"
    );
  
    const manganese =
      extractParameterFromText(
        text,
        [
          "available manganese",
          "manganese (as mn)",
          "manganese"
        ],
        "mg/kg"
      );
  
    const copper = extractParameterFromText(
      text,
      [
        "available copper",
        "copper (as cu)",
        "copper"
      ],
      "mg/kg"
    );
  
    const boron = extractParameterFromText(
      text,
      [
        "available boron",
        "boron (as b)",
        "boron"
      ],
      "mg/kg"
    );
  
    const sulphur = extractParameterFromText(
      text,
      [
        "available sulphur",
        "available sulfur",
        "sulphur",
        "sulfur"
      ],
      "mg/kg"
    );
  
    soil.iron.value = iron.value;
    soil.iron.unit = iron.unit;
  
    soil.zinc.value = zinc.value;
    soil.zinc.unit = zinc.unit;
  
    soil.manganese.value =
      manganese.value;
    soil.manganese.unit =
      manganese.unit;
  
    soil.copper.value = copper.value;
    soil.copper.unit = copper.unit;
  
    soil.boron.value = boron.value;
    soil.boron.unit = boron.unit;
  
    soil.sulphur.value = sulphur.value;
    soil.sulphur.unit = sulphur.unit;
  
    // -------------------------------------------------------
    // Secondary nutrients
    // -------------------------------------------------------
  
    const calcium = extractParameterFromText(
      text,
      [
        "available calcium",
        "calcium (as ca)",
        "calcium"
      ],
      "mg/kg"
    );
  
    const magnesium =
      extractParameterFromText(
        text,
        [
          "available magnesium",
          "magnesium (as mg)",
          "magnesium"
        ],
        "mg/kg"
      );
  
    soil.calcium.value = calcium.value;
    soil.calcium.unit = calcium.unit;
  
    soil.magnesium.value =
      magnesium.value;
    soil.magnesium.unit =
      magnesium.unit;
  
    return calculateStatuses(soil);
  }
  
  // =========================================================
  // DATA QUALITY
  // =========================================================
  
  function getDetectedFieldCount(soil) {
    const fields = [
      "nitrogen",
      "phosphorus",
      "potassium",
      "pH",
      "electricalConductivity",
      "organicCarbon",
      "iron",
      "zinc",
      "manganese",
      "copper",
      "boron",
      "sulphur",
      "calcium",
      "magnesium"
    ];
  
    return fields.filter(
      (field) =>
        soil[field] &&
        soil[field].value !== null
    ).length;
  }
  
  function getExtractionConfidence(
    soil,
    extractionMethod
  ) {
    const count = getDetectedFieldCount(soil);
  
    let confidence = "low";
  
    if (count >= 7) {
      confidence = "high";
    } else if (count >= 3) {
      confidence = "medium";
    }
  
    // OCR is more uncertain than selectable text,
    // so don't call a single OCR value "high".
    if (
      extractionMethod === "ocr" &&
      confidence === "high" &&
      count < 10
    ) {
      confidence = "medium";
    }
  
    return confidence;
  }
  
  // =========================================================
  // CROP PROFILES
  // =========================================================
  
  const CROP_PROFILES = [
    {
      name: "Wheat",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 4
    },
    {
      name: "Rice",
      phMin: 5.5,
      phMax: 7.5,
      ecMax: 4
    },
    {
      name: "Maize",
      phMin: 5.8,
      phMax: 7.0,
      ecMax: 2
    },
    {
      name: "Chickpea",
      phMin: 6.0,
      phMax: 8.0,
      ecMax: 2
    },
    {
      name: "Groundnut",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 2
    },
    {
      name: "Soybean",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 2
    },
    {
      name: "Sorghum",
      phMin: 6.0,
      phMax: 8.0,
      ecMax: 4
    },
    {
      name: "Pearl Millet",
      phMin: 6.0,
      phMax: 8.5,
      ecMax: 6
    },
    {
      name: "Cotton",
      phMin: 6.0,
      phMax: 8.0,
      ecMax: 7
    },
    {
      name: "Sugarcane",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 4
    },
    {
      name: "Tomato",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 2.5
    },
    {
      name: "Onion",
      phMin: 6.0,
      phMax: 7.5,
      ecMax: 2
    }
  ];
  
  // =========================================================
  // CROP SUITABILITY
  // =========================================================
  
  function calculateCropSuitability(
    soil,
    reportType
  ) {
    if (reportType !== "agricultural") {
      return [];
    }
  
    const availableFactors = [];
  
    if (soil.pH.value !== null) {
      availableFactors.push("pH");
    }
  
    if (soil.electricalConductivity.value !== null) {
      availableFactors.push("EC");
    }
  
    if (soil.nitrogen.value !== null) {
      availableFactors.push("N");
    }
  
    if (soil.phosphorus.value !== null) {
      availableFactors.push("P");
    }
  
    if (soil.potassium.value !== null) {
      availableFactors.push("K");
    }
  
    if (soil.organicCarbon.value !== null) {
      availableFactors.push("OC");
    }
  
    if (availableFactors.length < 2) {
      return [];
    }
  
    return CROP_PROFILES.map((crop) => {
      let score = 70;
      const reasons = [];
  
      // -----------------------------------------------------
      // pH
      // -----------------------------------------------------
  
      if (soil.pH.value !== null) {
        if (
          soil.pH.value >= crop.phMin &&
          soil.pH.value <= crop.phMax
        ) {
          score += 15;
          reasons.push("soil pH is suitable");
        } else {
          score -= 20;
          reasons.push("soil pH is outside the preferred range");
        }
      }
  
      // -----------------------------------------------------
      // EC
      // -----------------------------------------------------
  
      if (
        soil.electricalConductivity.value !== null
      ) {
        if (
          soil.electricalConductivity.value <=
          crop.ecMax
        ) {
          score += 5;
        } else {
          score -= 15;
          reasons.push("salinity may limit performance");
        }
      }
  
      // -----------------------------------------------------
      // Nitrogen
      // -----------------------------------------------------
  
      if (soil.nitrogen.value !== null) {
        if (soil.nitrogen.status === "low") {
          score -= 10;
          reasons.push(
            "nitrogen management is required"
          );
        } else if (
          soil.nitrogen.status === "medium"
        ) {
          score += 5;
        }
      }
  
      // -----------------------------------------------------
      // Phosphorus
      // -----------------------------------------------------
  
      if (soil.phosphorus.value !== null) {
        if (
          soil.phosphorus.status === "low"
        ) {
          score -= 8;
          reasons.push(
            "phosphorus may be limiting"
          );
        } else if (
          soil.phosphorus.status === "medium"
        ) {
          score += 4;
        } else if (
          soil.phosphorus.status === "high"
        ) {
          reasons.push(
            "avoid unnecessary phosphorus application"
          );
        }
      }
  
      // -----------------------------------------------------
      // Potassium
      // -----------------------------------------------------
  
      if (soil.potassium.value !== null) {
        if (
          soil.potassium.status === "low"
        ) {
          score -= 8;
          reasons.push(
            "potassium may be limiting"
          );
        } else if (
          soil.potassium.status === "medium"
        ) {
          score += 4;
        } else if (
          soil.potassium.status === "high"
        ) {
          reasons.push(
            "avoid unnecessary potassium application"
          );
        }
      }
  
      // -----------------------------------------------------
      // Organic carbon
      // -----------------------------------------------------
  
      if (
        soil.organicCarbon.value !== null &&
        soil.organicCarbon.status === "low"
      ) {
        score -= 8;
        reasons.push(
          "organic carbon is low"
        );
      }
  
      score = Math.max(
        35,
        Math.min(95, Math.round(score))
      );
  
      const reason =
        reasons.length > 0
          ? reasons.slice(0, 2).join("; ")
          : "soil parameters are generally compatible";
  
      return {
        cropName: crop.name,
        suitabilityScore: score,
        reason:
          reason.charAt(0).toUpperCase() +
          reason.slice(1)
      };
    })
      .sort(
        (a, b) =>
          b.suitabilityScore -
          a.suitabilityScore
      )
      .slice(0, 5);
  }
  
  // =========================================================
  // CORRECTION MEASURES
  // =========================================================
  
  function buildCorrectionMeasures(soil) {
    const measures = [];
  
    if (soil.pH.status === "acidic") {
      measures.push({
        issue: "Acidic soil",
        solution:
          "Consider liming only after confirming the soil test and crop-specific lime requirement. The quantity should be based on an appropriate soil/lime requirement test rather than a blanket dose.",
        priority: "high"
      });
    }
  
    if (soil.pH.status === "alkaline") {
      measures.push({
        issue: "Alkaline soil",
        solution:
          "Do not apply gypsum simply because pH is high. First confirm whether sodicity is present and follow a soil-test-based amendment recommendation.",
        priority: "high"
      });
    }
  
    if (
      soil.electricalConductivity.status === "medium"
    ) {
      measures.push({
        issue: "Elevated salinity risk",
        solution:
          "Check irrigation-water quality, drainage and crop salt tolerance before applying additional fertilizer.",
        priority: "medium"
      });
    }
  
    if (
      soil.electricalConductivity.status === "high"
    ) {
      measures.push({
        issue: "High salinity",
        solution:
          "Prioritize drainage, irrigation-water assessment and a salt-management plan before making fertilizer changes.",
        priority: "high"
      });
    }
  
    if (
      soil.nitrogen.status === "low"
    ) {
      measures.push({
        issue: "Low available nitrogen",
        solution:
          "Nitrogen should be treated as a priority nutrient. Use the selected crop's recommended nitrogen dose rather than a blanket NPK ratio.",
        priority: "high"
      });
    }
  
    if (
      soil.phosphorus.status === "low"
    ) {
      measures.push({
        issue: "Low available phosphorus",
        solution:
          "Use a crop-specific phosphorus recommendation and avoid applying phosphorus without considering the soil-test result.",
        priority: "medium"
      });
    }
  
    if (
      soil.potassium.status === "low"
    ) {
      measures.push({
        issue: "Low available potassium",
        solution:
          "Use a crop-specific potassium recommendation based on the soil test and local fertilizer guidance.",
        priority: "medium"
      });
    }
  
    if (
      soil.organicCarbon.status === "low"
    ) {
      measures.push({
        issue: "Low organic carbon",
        solution:
          "Increase organic matter inputs through suitable compost, farmyard manure, crop residues or other locally appropriate organic sources.",
        priority: "medium"
      });
    }
  
    if (soil.zinc.status === "low") {
      measures.push({
        issue: "Low zinc",
        solution:
          "Confirm the laboratory method and crop requirement before applying zinc fertilizer.",
        priority: "medium"
      });
    }
  
    if (soil.iron.status === "low") {
      measures.push({
        issue: "Low iron",
        solution:
          "Confirm the extraction method and crop-specific iron requirement before applying an iron amendment.",
        priority: "medium"
      });
    }
  
    if (soil.boron.status === "low") {
      measures.push({
        issue: "Low boron",
        solution:
          "Confirm the laboratory method and crop requirement before applying boron because the safe application range is narrow.",
        priority: "medium"
      });
    }
  
    return measures;
  }
  
  // =========================================================
  // FERTILIZER GUIDANCE
  // =========================================================
  
  function buildFertilizerRecommendation(soil) {
    const priorities = [];
  
    if (soil.nitrogen.status === "low") {
      priorities.push("Nitrogen");
    }
  
    if (soil.phosphorus.status === "low") {
      priorities.push("Phosphorus");
    }
  
    if (soil.potassium.status === "low") {
      priorities.push("Potassium");
    }
  
    let plan = "";
  
    if (priorities.length > 0) {
      plan =
        `Priority nutrients from the report: ${priorities.join(
          ", "
        )}. Exact fertilizer quantity should be calculated only after selecting the crop and applying the relevant state/local recommended dose. Avoid using a blanket NPK ratio.`;
    } else {
      plan =
        "The report does not show a low N, P or K value under the general reference bands used by FarmAI. Avoid blanket NPK application and match fertilizer use to the selected crop's soil-test-based recommendation.";
    }
  
    const organicOptions = [];
  
    if (
      soil.organicCarbon.status === "low"
    ) {
      organicOptions.push(
        "Compost",
        "Farmyard manure",
        "Crop-residue incorporation"
      );
    } else {
      organicOptions.push(
        "Compost",
        "Farmyard manure"
      );
    }
  
    return {
      plan,
      npkRatio:
        "Crop-specific — no blanket NPK ratio",
      organicOptions,
      applicationSchedule:
        "Use the selected crop's recommended nutrient dose and timing. Split nitrogen applications where the crop recommendation calls for it."
    };
  }
  
  // =========================================================
  // OVERALL RATING
  // =========================================================
  
  function calculateOverallRating(soil) {
    let issues = 0;
  
    const issueStatuses = [
      soil.nitrogen.status,
      soil.phosphorus.status,
      soil.potassium.status,
      soil.organicCarbon.status,
      soil.sulphur.status,
      soil.zinc.status,
      soil.iron.status,
      soil.manganese.status,
      soil.copper.status,
      soil.boron.status
    ];
  
    for (const status of issueStatuses) {
      if (status === "low") {
        issues++;
      }
    }
  
    if (
      soil.pH.status === "acidic" ||
      soil.pH.status === "alkaline"
    ) {
      issues++;
    }
  
    if (
      soil.electricalConductivity.status === "medium" ||
      soil.electricalConductivity.status === "high"
    ) {
      issues++;
    }
  
    if (issues === 0) {
      return "excellent";
    }
  
    if (issues <= 2) {
      return "good";
    }
  
    if (issues <= 4) {
      return "moderate";
    }
  
    return "poor";
  }
  
  // =========================================================
  // SUMMARY
  // =========================================================
  
  function buildSummary(soil, rating) {
    const findings = [];
  
    if (soil.pH.value !== null) {
      findings.push(
        `pH is ${soil.pH.value} (${soil.pH.status})`
      );
    }
  
    if (soil.nitrogen.value !== null) {
      findings.push(
        `nitrogen is ${soil.nitrogen.status}`
      );
    }
  
    if (soil.phosphorus.value !== null) {
      findings.push(
        `phosphorus is ${soil.phosphorus.status}`
      );
    }
  
    if (soil.potassium.value !== null) {
      findings.push(
        `potassium is ${soil.potassium.status}`
      );
    }
  
    if (soil.organicCarbon.value !== null) {
      findings.push(
        `organic carbon is ${soil.organicCarbon.status}`
      );
    }
  
    if (findings.length === 0) {
      return "The report was received, but no reliable agricultural soil parameters could be extracted.";
    }
  
    return (
      `Based on the extracted laboratory values, the soil is rated ${rating}. ` +
      findings.join("; ") +
      ". These results should be interpreted together with the crop, location, soil-testing method and local agronomic recommendations."
    );
  }
  
  // =========================================================
  // MAIN ANALYSIS
  // =========================================================
  
  function analyzeSoilReport({
    text,
    extractionMethod = "text"
  }) {
    const reportType = detectReportType(text);
  
    const soilParameters =
      extractSoilParameters(text);
  
    const soilType =
      detectSoilType(text);
  
    const detectedFieldCount =
      getDetectedFieldCount(
        soilParameters
      );
  
    const extractionConfidence =
      getExtractionConfidence(
        soilParameters,
        extractionMethod
      );
  
    // -------------------------------------------------------
    // NON-AGRICULTURAL REPORT
    // -------------------------------------------------------
  
    if (reportType.type === "geotechnical") {
      return {
        reportType: "geotechnical",
        reportTypeConfidence:
          reportType.confidence,
  
        soilParameters,
  
        extraction: {
          method: extractionMethod,
          confidence:
            extractionConfidence,
          fieldsDetected:
            detectedFieldCount,
          warnings: [
            "This document appears to be a geotechnical/construction soil report.",
            "Agricultural crop and fertilizer recommendations were intentionally not generated."
          ]
        },
  
        analysis: {
          soilHealthSummary:
            "This report appears to be intended for construction/geotechnical testing rather than agricultural soil fertility management.",
          soilType:
            soilType !== "Not reported"
              ? soilType
              : "Not reported",
          overallRating: "moderate",
          suitableCrops: [],
          fertilizerRecommendation: {
            plan:
              "Not applicable for this report type.",
            npkRatio:
              "Not applicable",
            organicOptions: [],
            applicationSchedule:
              "Not applicable"
          },
          correctionMeasures: [
            {
              issue:
                "Agricultural analysis not applicable",
              solution:
                "Upload an agricultural soil-test report containing parameters such as N, P, K, pH, EC and organic carbon.",
              priority: "low"
            }
          ],
          seasonalAdvice:
            "This report does not provide enough agricultural soil-fertility information for crop or fertilizer advice."
        }
      };
    }
  
    // -------------------------------------------------------
    // UNKNOWN REPORT
    // -------------------------------------------------------
  
    if (
      reportType.type === "unknown" &&
      detectedFieldCount < 2
    ) {
      return {
        reportType: "unknown",
        reportTypeConfidence:
          reportType.confidence,
  
        soilParameters,
  
        extraction: {
          method: extractionMethod,
          confidence:
            extractionConfidence,
          fieldsDetected:
            detectedFieldCount,
          warnings: [
            "The document could not be confidently identified as an agricultural soil report.",
            "Please verify that the uploaded document is a soil laboratory report."
          ]
        },
  
        analysis: {
          soilHealthSummary:
            "FarmAI could not confidently identify enough agricultural soil parameters in this document.",
          soilType: "Not reported",
          overallRating: "moderate",
          suitableCrops: [],
          fertilizerRecommendation: {
            plan:
              "Not enough verified soil information for a fertilizer recommendation.",
            npkRatio:
              "Not available",
            organicOptions: [],
            applicationSchedule:
              "Not available"
          },
          correctionMeasures: [
            {
              issue:
                "Insufficient soil-test information",
              solution:
                "Upload a clear soil laboratory report containing measured soil parameters.",
              priority: "high"
            }
          ],
          seasonalAdvice:
            "No seasonal crop recommendation was generated because the report could not be reliably interpreted."
        }
      };
    }
  
    // -------------------------------------------------------
    // AGRICULTURAL ANALYSIS
    // -------------------------------------------------------
  
    const overallRating =
      calculateOverallRating(
        soilParameters
      );
  
    const suitableCrops =
      calculateCropSuitability(
        soilParameters,
        "agricultural"
      );
  
    const fertilizerRecommendation =
      buildFertilizerRecommendation(
        soilParameters
      );
  
    const correctionMeasures =
      buildCorrectionMeasures(
        soilParameters
      );
  
    const seasonalAdvice =
      "For the next crop, use this soil test together with the crop, season, irrigation availability and local/state recommendation. Avoid blanket fertilizer application when the report already shows high nutrient status.";
  
    const warnings = [];
  
    if (soilParameters.pH.value === null) {
      warnings.push(
        "pH was not detected in the report."
      );
    }
  
    if (
      soilParameters.nitrogen.value === null ||
      soilParameters.phosphorus.value === null ||
      soilParameters.potassium.value === null
    ) {
      warnings.push(
        "One or more NPK values were not detected."
      );
    }
  
    if (
      extractionMethod === "ocr"
    ) {
      warnings.push(
        "Values were obtained using OCR. Verify important numbers against the original report before acting on them."
      );
    }
  
    return {
      reportType: "agricultural",
      reportTypeConfidence:
        reportType.confidence,
  
      soilParameters,
  
      extraction: {
        method: extractionMethod,
        confidence:
          extractionConfidence,
        fieldsDetected:
          detectedFieldCount,
        warnings
      },
  
      analysis: {
        soilHealthSummary:
          buildSummary(
            soilParameters,
            overallRating
          ),
  
        soilType,
  
        overallRating,
  
        suitableCrops,
  
        fertilizerRecommendation,
  
        correctionMeasures,
  
        seasonalAdvice
      }
    };
  }
  
  module.exports = {
    createEmptySoilParameters,
    detectReportType,
    extractSoilParameters,
    analyzeSoilReport
  };