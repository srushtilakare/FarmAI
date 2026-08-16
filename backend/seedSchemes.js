const mongoose = require("mongoose");
require("dotenv").config();

// Ensure this path points to your model file
const Scheme = require("./models/GovernmentScheme");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Clear existing data to ensure a fresh start
    await Scheme.deleteMany({});
    console.log("🗑️ Existing schemes cleared");

    const schemes = [
      {
        schemeName: "PM Kisan Samman Nidhi (PM-KISAN)",
        ministry: "Ministry of Agriculture and Farmers Welfare",
        description: "A central sector scheme providing income support to all landholding farmers' families to help with agricultural expenses and domestic needs.",
        schemeType: "subsidy",
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal"],
        eligibility: ["All landholding farmer families", "Valid Aadhaar card", "Bank account linked with Aadhaar"],
        benefits: "Financial benefit of ₹6,000 per year, transferred in three equal installments of ₹2,000 every four months.",
        howToApply: "Register online at pmkisan.gov.in via the 'Farmers Corner' or visit a Common Service Center (CSC).",
        applicationLink: "https://pmkisan.gov.in/",
        active: true
      },
      {
        schemeName: "Kisan Credit Card (KCC)",
        ministry: "Ministry of Agriculture",
        description: "Provides timely credit support to farmers for cultivation, post-harvest expenses, and maintenance of farm assets.",
        schemeType: "loan",
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal", "large"],
        eligibility: ["Individual farmers who are owner-cultivators", "Tenant farmers", "Sharecroppers", "Self Help Groups"],
        benefits: "Access to institutional credit at a low interest rate (approx 4% with timely repayment). Includes ATM-enabled debit card.",
        howToApply: "Visit any commercial bank, Cooperative bank, or Regional Rural Bank with land documents and ID proof.",
        applicationLink: "",
        active: true
      },
      {
        schemeName: "PM Fasal Bima Yojana (PMFBY)",
        ministry: "Ministry of Agriculture",
        description: "A crop insurance scheme providing financial support to farmers suffering crop loss/damage arising out of unforeseen events.",
        schemeType: "insurance",
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal", "large"],
        eligibility: ["All farmers growing notified crops in notified areas", "Includes tenant farmers and sharecroppers"],
        benefits: "Comprehensive insurance cover against crop failure. Low premium rates: 2% for Kharif and 1.5% for Rabi crops.",
        howToApply: "Apply online via pmfby.gov.in or through local banks and insurance agents.",
        applicationLink: "https://pmfby.gov.in/",
        active: true
      },
      {
        schemeName: "PM KUSUM Yojana",
        ministry: "Ministry of New and Renewable Energy",
        description: "Aims to provide energy security to farmers by installing solar pumps and grid-connected solar power plants.",
        schemeType: "equipment",
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal"],
        eligibility: ["Individual farmers", "Water User Associations", "FPOs"],
        benefits: "60% subsidy for solar pumps (30% Central + 30% State). 30% loan option available, farmer pays only 10%.",
        howToApply: "Apply through the official State Nodal Agencies (SNA) of the respective state renewable energy department.",
        applicationLink: "",
        active: true
      },
      {
        schemeName: "Agri-Clinic and Agri-Business Centres (ACABC)",
        ministry: "Ministry of Agriculture",
        description: "Promotes entrepreneurship among agriculture graduates to provide professional extension services to farmers.",
        schemeType: "training",
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal", "large"],
        eligibility: ["Graduates or Diploma holders in Agriculture and allied subjects", "Unemployed agri-professionals"],
        benefits: "45 days of free residential training and startup loan support with composite subsidies.",
        howToApply: "Register online at agriclinics.net for training programs conducted by MANAGE.",
        applicationLink: "https://www.agriclinics.net/",
        active: true
      },
      {
        schemeName: "PM Kisan Maandhan Yojana (PM-KMY)",
        ministry: "Ministry of Agriculture and Farmers Welfare",
        description: "A voluntary and contributory pension scheme for all small and marginal farmers to provide social security in their old age.",
        schemeType: "pension", // Note: Ensure 'pension' is in your Model's enum
        state: "all",
        category: ["all"],
        farmerType: ["small", "marginal", "large"],
        eligibility: [
          "All farmers aged between 18 to 40 years",
          "Must not be covered under any other statutory social security schemes",
          "Possess cultivable land up to 2 hectares"
        ],
        benefits: "A guaranteed minimum monthly pension of ₹3,000 after attaining the age of 60 years.",
        howToApply: "Apply online through the Common Service Center (CSC) or visit the nearest Life Insurance Corporation (LIC) office.",
        applicationLink: "https://maandhan.in/",
        active: true
      }
    ];

    await Scheme.insertMany(schemes);

    console.log("✅ All Diverse Schemes inserted successfully!");
    process.exit();

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();