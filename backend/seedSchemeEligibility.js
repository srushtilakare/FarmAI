// backend/seedSchemeEligibility.js

require("dotenv").config();

const mongoose = require("mongoose");
const GovernmentScheme = require("./models/GovernmentScheme");

// =========================================================
// CONNECT TO DATABASE
// =========================================================

async function connectDB() {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGO_URL;

    if (!mongoUri) {
      throw new Error(
        "MongoDB connection string not found in backend/.env"
      );
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
}

// =========================================================
// UPDATE SCHEME
// =========================================================

async function updateScheme(
  schemeName,
  eligibilityRules,
  humanReadableEligibility
) {
  try {
    // Exact name matching.
    // This safely handles scheme names containing
    // parentheses such as (PM-KISAN), (KCC), etc.
    const scheme = await GovernmentScheme.findOne({
      schemeName: schemeName,
    });

    if (!scheme) {
      console.log(`❌ Scheme not found: ${schemeName}`);
      return;
    }

    // -------------------------------------------------------
    // IMPORTANT:
    // Structured eligibility rules go into eligibilityRules.
    // Human-readable eligibility remains in eligibility.
    // -------------------------------------------------------

    scheme.eligibilityRules = eligibilityRules;

    if (
      Array.isArray(humanReadableEligibility) &&
      humanReadableEligibility.length > 0
    ) {
      scheme.eligibility = humanReadableEligibility;
    }

    await scheme.save();

    console.log(`✅ Updated: ${schemeName}`);
  } catch (error) {
    console.error(
      `❌ Error updating ${schemeName}:`,
      error.message
    );
  }
}

// =========================================================
// MAIN
// =========================================================

async function seedEligibilityRules() {
  await connectDB();

  try {
    // =======================================================
    // 1. PM KISAN MAANDHAN YOJANA
    // =======================================================

    await updateScheme(
      "PM Kisan Maandhan Yojana (PM-KMY)",

      {
        minAge: 18,
        maxAge: 40,

        maxLandHolding: 2,
        landUnit: "hectare",

        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: [
          "small",
          "marginal",
        ],

        aadhaarRequired: true,

        bankAccountRequired: true,

        pmKisanRequired: false,
      },

      [
        "Age should be between 18 and 40 years.",
        "Farmer should be a small or marginal farmer.",
        "Land holding should not exceed 2 hectares.",
        "Aadhaar is required.",
        "A bank account is required."
      ]
    );

    // =======================================================
    // 2. PM KISAN SAMMAN NIDHI
    // =======================================================

    await updateScheme(
      "PM Kisan Samman Nidhi (PM-KISAN)",

      {
        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: [
          "small",
          "marginal",
          "medium",
          "large",
        ],

        aadhaarRequired: true,

        bankAccountRequired: true,
      },

      [
        "Farmer should be eligible agricultural landholder.",
        "Aadhaar is required.",
        "A bank account is required.",
        "Scheme eligibility is subject to applicable government exclusion rules."
      ]
    );

    // =======================================================
    // 3. PM FASAL BIMA YOJANA
    // =======================================================

    await updateScheme(
      "PM Fasal Bima Yojana (PMFBY)",

      {
        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: [
          "small",
          "marginal",
          "medium",
          "large",
        ],
      },

      [
        "Farmers cultivating notified crops in notified areas may be eligible.",
        "Small, marginal, medium and large farmers may be covered subject to scheme conditions.",
        "The crop and area must be covered under the applicable notification."
      ]
    );

    // =======================================================
    // 4. KISAN CREDIT CARD
    // =======================================================

    await updateScheme(
      "Kisan Credit Card (KCC)",

      {
        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: [
          "small",
          "marginal",
          "medium",
          "large",
        ],

        bankAccountRequired: true,
      },

      [
        "Farmers engaged in agricultural activities may be eligible.",
        "Small, marginal, medium and large farmers may apply subject to lender conditions.",
        "A bank account is required.",
        "Final eligibility and credit limit are determined by the lending institution."
      ]
    );

    // =======================================================
    // 5. PM KUSUM
    // =======================================================

    await updateScheme(
      "PM KUSUM Yojana",

      {
        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: [
          "small",
          "marginal",
          "medium",
          "large",
        ],
      },

      [
        "Farmers may be eligible subject to the applicable PM-KUSUM component.",
        "Small, marginal, medium and large farmers may be eligible.",
        "Eligibility may depend on the component, state guidelines and available allocation."
      ]
    );

    // =======================================================
    // 6. AGRI-CLINIC AND AGRI-BUSINESS CENTRES
    // =======================================================

    await updateScheme(
      "Agri-Clinic and Agri-Business Centres (ACABC)",

      {
        requiredGender: ["all"],

        requiredCategory: ["all"],

        requiredFarmerType: ["all"],
      },

      [
        "Eligibility depends on the applicant's educational qualification and applicable ACABC guidelines.",
        "Applicants should satisfy the prescribed training and eligibility requirements.",
        "Final eligibility is subject to the applicable government guidelines."
      ]
    );

    // =======================================================
    // COMPLETED
    // =======================================================

    console.log(
      "\n======================================"
    );

    console.log(
      "Eligibility rules update completed."
    );

    console.log(
      "======================================\n"
    );
  } catch (error) {
    console.error(
      "Eligibility seed error:",
      error
    );
  } finally {
    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed."
    );
  }
}

// =========================================================
// RUN
// =========================================================

seedEligibilityRules();