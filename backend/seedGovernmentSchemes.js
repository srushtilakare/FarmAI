const mongoose = require('mongoose');
const GovernmentScheme = require('./models/GovernmentScheme');
require('dotenv').config();

// Comprehensive list of REAL Indian Government Agricultural Schemes
const realSchemes = [
  // Central Schemes - Universal
  {
    schemeName: "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Under this scheme, income support of Rs. 6,000 per year is provided to all landholding farmers' families across the country in three equal installments of Rs. 2,000 each every four months.",
    schemeType: "income_support",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: [
      "Must be a landholding farmer family",
      "Name should be in land records",
      "Aadhar card mandatory",
      "Bank account linked with Aadhar"
    ],
    benefits: "Rs. 6,000 per year in three installments of Rs. 2,000 each",
    documentsRequired: ["Aadhar Card", "Bank Account Details", "Land Ownership Documents"],
    howToApply: "Apply online at pmkisan.gov.in or visit nearest Common Service Center (CSC) or contact local agriculture office",
    applicationLink: "https://pmkisan.gov.in/",
    active: true,
    priority: 10
  },
  
  {
    schemeName: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Crop insurance scheme providing insurance coverage and financial support to farmers in the event of crop failure or damage due to natural calamities, pests and diseases.",
    schemeType: "insurance",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: [
      "All farmers including sharecroppers and tenant farmers",
      "Coverage for notified crops in notified areas only",
      "Farmers must cultivate notified crops"
    ],
    benefits: "Maximum premium: 2% for Kharif crops, 1.5% for Rabi crops, 5% for horticulture/commercial crops. Rest paid by government.",
    documentsRequired: ["Aadhar Card", "Bank Account", "Land Records", "Sowing Certificate"],
    howToApply: "Apply through banks, insurance companies, or online at pmfby.gov.in within cut-off date",
    applicationLink: "https://pmfby.gov.in/",
    active: true,
    priority: 9
  },

  {
    schemeName: "Kisan Credit Card (KCC)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Provides adequate and timely credit support to farmers for their cultivation and other needs including consumption requirements, post-harvest expenses, produce marketing loan, working capital for maintenance of farm assets etc.",
    schemeType: "credit",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: [
      "Farmers - individual/joint borrowers who are owner cultivators",
      "Tenant farmers, oral lessees & share croppers",
      "Self Help Groups (SHGs) or Joint Liability Groups (JLGs)"
    ],
    benefits: "Credit limit based on cropping pattern and scale of finance. Interest subvention of 2%, additional 3% for prompt repayment",
    documentsRequired: ["Identity Proof", "Address Proof", "Land ownership proof/tenancy agreement"],
    howToApply: "Apply at nearest branch of commercial banks, RRBs, cooperative banks",
    applicationLink: "https://www.india.gov.in/spotlight/kisan-credit-card-kcc-scheme",
    active: true,
    priority: 9
  },

  {
    schemeName: "Pradhan Mantri Kisan Maan Dhan Yojana (PM-KMY)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Old age pension scheme for small and marginal farmers. Monthly pension of Rs. 3000 after attaining age of 60 years.",
    schemeType: "pension",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal"],
    gender: ["all"],
    eligibility: [
      "Small and Marginal Farmers (SMFs) having cultivable land upto 2 hectares",
      "Entry age between 18-40 years",
      "Not enrolled in EPFO/ESIC/NPS schemes"
    ],
    benefits: "Rs. 3,000 monthly pension after 60 years. Family pension of Rs. 1,500 in case of death",
    documentsRequired: ["Aadhar Card", "Bank Account with IFSC", "Land Records"],
    howToApply: "Enroll through CSCs or online at maandhan.in",
    applicationLink: "https://maandhan.in/",
    active: true,
    priority: 8
  },

  {
    schemeName: "Soil Health Card Scheme",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Provides soil health cards to farmers which carry crop-wise recommendations of nutrients and fertilizers required for individual farms to help farmers improve productivity through judicious use of inputs.",
    schemeType: "technical_assistance",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["All farmers are eligible"],
    benefits: "Free soil testing and recommendations for optimal fertilizer use",
    documentsRequired: ["Land records", "Aadhar Card"],
    howToApply: "Contact local agriculture department or visit soilhealth.dac.gov.in",
    applicationLink: "https://soilhealth.dac.gov.in/",
    active: true,
    priority: 7
  },

  {
    schemeName: "Paramparagat Krishi Vikas Yojana (PKVY)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Promotes organic farming through formation of farmers' groups and provides financial assistance of Rs. 50,000 per hectare for 3 years for cluster formation and organic adoption.",
    schemeType: "subsidy",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: [
      "Farmers practicing or willing to practice organic farming",
      "Willing to form clusters of minimum 50 acres"
    ],
    benefits: "Rs. 50,000/hectare over 3 years (Rs. 31,000 for organic inputs, Rs. 8,800 for certification, rest for training)",
    documentsRequired: ["Aadhar Card", "Land Documents", "Bank Account"],
    howToApply: "Apply through State Agriculture Department",
    applicationLink: "Contact State Agriculture Department",
    active: true,
    priority: 6
  },

  {
    schemeName: "National Agriculture Market (e-NAM)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Pan-India electronic trading portal for agricultural commodities. Provides better price discovery through transparent auction process and access to nationwide market.",
    schemeType: "marketing",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["All farmers can register and sell their produce"],
    benefits: "Access to more buyers, transparent pricing, online payment, reduced transaction costs",
    documentsRequired: ["Aadhar Card", "Bank Account", "Mobile Number"],
    howToApply: "Register at enam.gov.in or nearest e-NAM integrated mandi",
    applicationLink: "https://www.enam.gov.in/",
    active: true,
    priority: 8
  },

  // Women-specific schemes
  {
    schemeName: "Mahila Kisan Sashaktikaran Pariyojana (MKSP)",
    ministry: "Ministry of Rural Development",
    description: "Sub-component of DAY-NRLM focusing on women farmers. Provides training, infrastructure support and market linkages to women in agriculture.",
    schemeType: "skill_development",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal"],
    gender: ["female"],
    eligibility: [
      "Women farmers, especially small and marginal",
      "Women Self Help Groups (SHGs)"
    ],
    benefits: "Training in sustainable agriculture, livestock management, financial assistance for inputs and equipment",
    documentsRequired: ["Aadhar Card", "Land Documents if any", "SHG membership proof"],
    howToApply: "Contact District Rural Development Agency (DRDA) or State Rural Livelihood Mission",
    applicationLink: "Contact District Administration",
    active: true,
    priority: 7
  },

  // State Schemes - Example for Maharashtra
  {
    schemeName: "Jalyukt Shivar Abhiyan",
    ministry: "Government of Maharashtra",
    description: "Water conservation scheme providing assistance for deepening of nallahs, cement bunding, farm ponds, KT Weirs etc. to make villages water-sufficient.",
    schemeType: "infrastructure",
    state: "Maharashtra",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Farmers in Maharashtra with land holdings"],
    benefits: "Subsidy for water conservation structures. 100% for SC/ST farmers, 90% for small farmers, 75% for others",
    documentsRequired: ["Land Documents", "Aadhar Card", "Caste Certificate if applicable"],
    howToApply: "Apply through Gram Panchayat or District Collector office",
    applicationLink: "Contact District Collector Office, Maharashtra",
    active: true,
    priority: 7
  },

  {
    schemeName: "Shetkari Sanman Yojana",
    ministry: "Government of Maharashtra",
    description: "Direct cash transfer scheme for farmers in Maharashtra providing Rs. 6,000 per year in addition to PM-KISAN.",
    schemeType: "income_support",
    state: "Maharashtra",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Farmers residing in Maharashtra with cultivable land"],
    benefits: "Rs. 6,000 per year (in addition to PM-KISAN Rs. 6,000)",
    documentsRequired: ["Aadhar Card", "Land Records", "Bank Account"],
    howToApply: "Auto-enrollment for PM-KISAN beneficiaries. Others apply at taluka office",
    applicationLink: "Contact Taluka Agriculture Office",
    active: true,
    priority: 8
  },

  // SC/ST Schemes
  {
    schemeName: "National Scheduled Caste Finance and Development Corporation (NSFDC) Schemes",
    ministry: "Ministry of Social Justice & Empowerment",
    description: "Concessional finance schemes for SC entrepreneurs in agriculture, dairy, poultry, and other income-generating activities.",
    schemeType: "credit",
    state: "all",
    category: ["SC"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: [
      "Scheduled Caste individuals/families below Double Poverty Line",
      "Age: 18-55 years"
    ],
    benefits: "Loans at concessional interest rates (4-6%) for agriculture and allied activities",
    documentsRequired: ["Caste Certificate", "Aadhar Card", "Income Certificate", "Project Report"],
    howToApply: "Apply through State Channelizing Agency or NSFDC regional offices",
    applicationLink: "https://www.nsfdc.nic.in/",
    active: true,
    priority: 7
  },

  // Additional Central Schemes
  {
    schemeName: "Mission for Integrated Development of Horticulture (MIDH)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Promotes holistic growth of horticulture sector covering fruits, vegetables, root & tuber crops, mushrooms, spices, flowers, aromatic plants, cashew etc.",
    schemeType: "subsidy",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Farmers, SHGs, FPOs engaged in horticulture"],
    benefits: "40% subsidy for general farmers, 50% for SC/ST, Small & Marginal farmers for planting material, infrastructure",
    documentsRequired: ["Land Documents", "Aadhar Card", "Bank Account", "Caste Certificate if applicable"],
    howToApply: "Apply through State Horticulture Mission",
    applicationLink: "Contact State Horticulture Department",
    active: true,
    priority: 6
  },

  {
    schemeName: "Rashtriya Krishi Vikas Yojana (RKVY)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "State Plan Scheme that incentivizes states to increase public investment in agriculture and allied sectors with focus on infrastructure, productivity and value addition.",
    schemeType: "infrastructure",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Implemented through State Governments - varies by state projects"],
    benefits: "Funding for agriculture infrastructure, mechanization, seed production, marketing support",
    documentsRequired: ["Varies by specific component"],
    howToApply: "Contact State Agriculture Department for available components",
    applicationLink: "Contact State Agriculture Department",
    active: true,
    priority: 6
  },

  {
    schemeName: "Sub-Mission on Agricultural Mechanization (SMAM)",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    description: "Promotes agricultural mechanization through financial assistance for purchase of agricultural machinery and equipment.",
    schemeType: "subsidy",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Individual farmers, SHGs, FPOs"],
    benefits: "40-50% subsidy on purchase of tractors and equipment (higher for SC/ST, women, NE states)",
    documentsRequired: ["Land Documents", "Aadhar Card", "Bank Account", "Caste Certificate if applicable"],
    howToApply: "Apply online through State Agriculture Department portal or DBT Agriculture portal",
    applicationLink: "https://agrimachinery.nic.in/",
    active: true,
    priority: 7
  },

  {
    schemeName: "Pradhan Mantri Matsya Sampada Yojana (PMMSY)",
    ministry: "Ministry of Fisheries, Animal Husbandry and Dairying",
    description: "Comprehensive scheme for sustainable development of fisheries sector with focus on doubling fishermen income and ensuring food security.",
    schemeType: "subsidy",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Fishermen, fish farmers, fish workers, FPOs, entrepreneurs in fisheries sector"],
    benefits: "40-60% subsidy for infrastructure, credit facility, insurance support, skill development",
    documentsRequired: ["Identity Proof", "Bank Account", "Land/Water Body Documents", "SC/ST certificate if applicable"],
    howToApply: "Apply through State Fisheries Department or online portal",
    applicationLink: "https://pmmsy.dof.gov.in/",
    active: true,
    priority: 6
  },

  {
    schemeName: "National Livestock Mission",
    ministry: "Ministry of Fisheries, Animal Husbandry and Dairying",
    description: "Aims at sustainable development of livestock sector, focusing on availability of quality feed and fodder, risk management, breed improvement and strengthening of infrastructure.",
    schemeType: "subsidy",
    state: "all",
    category: ["all"],
    farmerType: ["small", "marginal", "large"],
    gender: ["all"],
    eligibility: ["Livestock farmers, cooperatives, FPOs, entrepreneurs"],
    benefits: "25-50% subsidy for dairy units, poultry, feed plants, breed improvement",
    documentsRequired: ["Aadhar Card", "Bank Account", "Land Documents", "Caste Certificate if applicable"],
    howToApply: "Apply through State Animal Husbandry Department",
    applicationLink: "Contact State Animal Husbandry Department",
    active: true,
    priority: 6
  }
];

async function seedSchemes() {
  try {
    // Connect to MongoDB Atlas (using same connection as server.js)
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmAI');

    console.log('📡 Connected to MongoDB Atlas');

    // Clear existing schemes
    await GovernmentScheme.deleteMany({});
    console.log('🗑️  Cleared existing schemes');

    // Insert new schemes
    await GovernmentScheme.insertMany(realSchemes);
    console.log(`✅ Successfully seeded ${realSchemes.length} government schemes!`);

    console.log('\n📊 Scheme Summary:');
    console.log(`   - Central Schemes: ${realSchemes.filter(s => s.state === 'all').length}`);
    console.log(`   - State Schemes: ${realSchemes.filter(s => s.state !== 'all').length}`);
    console.log(`   - Women-specific: ${realSchemes.filter(s => s.gender.includes('female') && s.gender.length === 1).length}`);
    console.log(`   - SC/ST specific: ${realSchemes.filter(s => s.category.includes('SC') || s.category.includes('ST')).length}`);

    mongoose.connection.close();
    console.log('\n✅ Database connection closed. Seeding complete!');
  } catch (error) {
    console.error('❌ Error seeding schemes:', error);
    process.exit(1);
  }
}

// Run the seeder
seedSchemes();

