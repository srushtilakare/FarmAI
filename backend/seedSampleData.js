// Sample Data Seeder for New Features
// Run with: node seedSampleData.js

const mongoose = require('mongoose');
require('dotenv').config();

const GovernmentScheme = require('./models/GovernmentScheme');
const AgriNews = require('./models/AgriNews');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/farmAI', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected for seeding'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Sample Government Schemes
const sampleSchemes = [
  {
    schemeName: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'Direct income support scheme providing financial assistance to all landholding farmers across the country.',
    state: ['all'],
    category: ['all'],
    farmerType: ['small', 'marginal', 'large'],
    gender: ['all'],
    benefits: 'Financial benefit of ₹6,000 per year transferred in three equal installments of ₹2,000 each directly to bank accounts of eligible farmers.',
    eligibility: 'All landholding farmers irrespective of the size of their land holdings. Institutional landholders and farmers who fall under excluded categories are not eligible.',
    applicationProcess: '1. Visit pmkisan.gov.in\n2. Click on "Farmers Corner"\n3. Select "New Farmer Registration"\n4. Enter Aadhaar number\n5. Fill registration form\n6. Submit required documents',
    requiredDocuments: ['Aadhaar Card', 'Bank Account Details', 'Land Ownership Documents', 'Mobile Number'],
    officialWebsite: 'https://pmkisan.gov.in',
    contactInfo: {
      phone: '011-23381092',
      email: 'pmkisan-ict@gov.in'
    },
    budgetAmount: '₹75,000 Crore annually',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    schemeType: 'subsidy',
    active: true
  },
  {
    schemeName: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities, pests, and diseases.',
    state: ['all'],
    category: ['all'],
    farmerType: ['all'],
    gender: ['all'],
    benefits: 'Insurance coverage for crop loss. Premium: Kharif 2%, Rabi 1.5%, Horticulture 5%. Balance premium paid by government. Sum insured based on average yield.',
    eligibility: 'All farmers including sharecroppers and tenant farmers growing notified crops in notified areas.',
    applicationProcess: 'Apply through banks, Common Service Centers, agriculture department offices, or online portal within the cut-off date before sowing season.',
    requiredDocuments: ['Farmer ID', 'Bank Account Details', 'Sowing Certificate', 'Land Records'],
    officialWebsite: 'https://pmfby.gov.in',
    contactInfo: {
      phone: '011-23382012',
      email: 'pmfby@gov.in'
    },
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    schemeType: 'insurance',
    active: true
  },
  {
    schemeName: 'Kisan Credit Card (KCC)',
    description: 'Credit facility for farmers to meet their agricultural and allied activities including purchase of inputs, maintenance, and post-harvest expenses.',
    state: ['all'],
    category: ['all'],
    farmerType: ['all'],
    gender: ['all'],
    benefits: 'Short-term credit up to ₹3 lakh at 7% interest rate (4% with prompt repayment). No collateral required up to ₹1.6 lakh. Accident insurance cover of ₹50,000.',
    eligibility: 'All farmers including tenant farmers, oral lessees, and sharecroppers. Self-Help Groups engaged in farming activities.',
    applicationProcess: 'Visit nearest bank branch with required documents. Fill KCC application form. Bank will assess and sanction credit limit based on land holding and cropping pattern.',
    requiredDocuments: ['Identity Proof', 'Address Proof', 'Land Documents', '2 Passport Photos', 'PAN Card'],
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    schemeType: 'loan',
    active: true
  },
  {
    schemeName: 'National Agriculture Market (e-NAM)',
    description: 'Pan-India electronic trading portal for agricultural commodities providing transparent and competitive price discovery.',
    state: ['all'],
    category: ['all'],
    farmerType: ['all'],
    gender: ['all'],
    benefits: 'Better price discovery through transparent auction process. Online payment. Reduction in transaction costs. Access to nationwide markets.',
    eligibility: 'All farmers can register and trade on e-NAM platform.',
    applicationProcess: 'Register on enam.gov.in portal with mobile number. Complete KYC verification. Link bank account for payments.',
    requiredDocuments: ['Aadhaar Card', 'Mobile Number', 'Bank Account Details'],
    officialWebsite: 'https://www.enam.gov.in',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    schemeType: 'other',
    active: true
  },
  {
    schemeName: 'Soil Health Card Scheme',
    description: 'Scheme to issue Soil Health Cards to farmers for improving productivity through judicious use of inputs.',
    state: ['all'],
    category: ['all'],
    farmerType: ['all'],
    gender: ['all'],
    benefits: 'Free soil testing every 2-3 years. Soil Health Card with nutrient status. Recommendations for appropriate dosage of nutrients. Improved soil health and productivity.',
    eligibility: 'All farmers including sharecroppers and tenant farmers.',
    applicationProcess: 'Contact local agriculture department or soil testing laboratory. Provide soil samples as per guidelines. Receive Soil Health Card within 30 days.',
    requiredDocuments: ['Farmer Registration', 'Land Details', 'Identity Proof'],
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    schemeType: 'other',
    active: true
  }
];

// Sample Agriculture News
const sampleNews = [
  {
    title: 'IMD Predicts Normal Monsoon for Upcoming Kharif Season',
    content: 'The India Meteorological Department (IMD) has forecast normal monsoon rainfall for the upcoming Kharif season. This is expected to benefit farmers across the country, particularly those growing rice, cotton, soybean, and pulses. The rainfall is predicted to be around 96-104% of the Long Period Average (LPA). Farmers are advised to prepare for timely sowing operations. The forecast brings relief after concerns about El Niño conditions. Agricultural experts recommend that farmers plan their crop selection based on this forecast and ensure adequate preparation of fields.',
    category: 'weather',
    subCategory: 'Monsoon Forecast',
    relevantStates: [],
    relevantCrops: ['rice', 'cotton', 'soybean', 'pulses'],
    source: {
      name: 'India Meteorological Department',
      type: 'official'
    },
    publishDate: new Date(),
    priority: 'high',
    tags: ['monsoon', 'forecast', 'kharif', 'IMD'],
    active: true,
    verified: true
  },
  {
    title: 'Wheat Prices Show Upward Trend in Major Mandis',
    content: 'Wheat prices have shown a consistent upward trend in major agricultural markets across North India over the past week. The Modal Price increased by ₹50-75 per quintal in key mandis. This increase is attributed to reduced supplies and steady demand from flour mills. In Punjab and Haryana mandis, wheat is trading between ₹2,100-2,250 per quintal. Market analysts predict prices may remain firm in the coming weeks. Farmers holding stocks are advised to monitor market trends before selling. The government\'s procurement operations continue at MSP of ₹2,125 per quintal.',
    category: 'market',
    subCategory: 'Price Update',
    relevantStates: ['Punjab', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh'],
    relevantCrops: ['wheat'],
    source: {
      name: 'Agricultural Market Intelligence',
      type: 'research'
    },
    publishDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    tags: ['wheat', 'prices', 'mandi', 'market'],
    active: true,
    verified: true
  },
  {
    title: 'Alert: Fall Armyworm Detected in Maize Fields',
    content: 'Fall Armyworm (FAW) infestation has been detected in maize growing areas across several districts. This pest can cause significant damage to maize crops if not controlled early. Symptoms include irregular holes in leaves, presence of frass (insect waste), and damaged growing points. Farmers are advised to: 1) Scout fields regularly, especially early morning. 2) Remove and destroy egg masses and larvae. 3) Use recommended pesticides only after proper identification. 4) Adopt integrated pest management practices. 5) Contact local agriculture officers for assistance. Early detection and management are crucial to prevent crop loss. Biological control using Trichogramma parasitoids is also effective.',
    category: 'pest-alert',
    subCategory: 'Pest Warning',
    relevantStates: ['Karnataka', 'Maharashtra', 'Telangana', 'Tamil Nadu'],
    relevantCrops: ['maize', 'corn'],
    source: {
      name: 'Directorate of Plant Protection',
      type: 'official'
    },
    publishDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    priority: 'critical',
    tags: ['pest', 'maize', 'FAW', 'alert', 'crop-protection'],
    active: true,
    verified: true
  },
  {
    title: 'New Mobile App Launched for Direct Farmer-Buyer Connect',
    content: 'The Agriculture Ministry has launched a new mobile application to facilitate direct connection between farmers and buyers, eliminating middlemen. The app allows farmers to list their produce with quality specifications and expected prices. Buyers can browse available produce and place orders directly. Key features include: Real-time price information, secure payment gateway, logistics support, quality certification, and multilingual interface. Over 500 mandis are already onboarded. The app aims to ensure farmers get better prices while buyers get fresh produce. Registration is free for farmers. Training programs are being conducted across districts.',
    category: 'technology',
    subCategory: 'Digital Innovation',
    relevantStates: [],
    relevantCrops: [],
    source: {
      name: 'Ministry of Agriculture',
      type: 'official'
    },
    publishDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    tags: ['technology', 'mobile-app', 'digital', 'marketing'],
    active: true,
    verified: true
  },
  {
    title: 'Government Increases MSP for Kharif Crops 2024',
    content: 'The Cabinet Committee on Economic Affairs has approved the increase in Minimum Support Prices (MSP) for all Kharif crops for the 2024 season. The increases range from ₹105 to ₹200 per quintal across different crops. Paddy (common) MSP increased to ₹2,300/quintal, Cotton (medium staple) to ₹6,620/quintal, and Moong to ₹8,558/quintal. The decision aims to provide remunerative prices to farmers and encourage crop diversification. The increased MSP ensures at least 50% returns over cost of production. Procurement operations will begin as per the usual schedule. State governments have been directed to ensure smooth procurement.',
    category: 'government',
    subCategory: 'Policy Update',
    relevantStates: [],
    relevantCrops: ['paddy', 'cotton', 'moong', 'tur', 'urad'],
    source: {
      name: 'Press Information Bureau',
      type: 'official'
    },
    publishDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    priority: 'high',
    tags: ['MSP', 'government', 'kharif', 'policy'],
    active: true,
    verified: true
  },
  {
    title: 'Best Practices for Water Conservation in Agriculture',
    content: 'With water scarcity becoming a critical issue, adopting water conservation practices is essential for sustainable agriculture. Recommended practices include: 1) Drip and sprinkler irrigation - saves up to 60% water. 2) Mulching - reduces evaporation and maintains soil moisture. 3) Rainwater harvesting - captures and stores rainwater. 4) Crop rotation with less water-intensive crops. 5) Soil moisture monitoring - irrigate only when needed. 6) Laser land leveling - ensures uniform water distribution. 7) Growing drought-resistant varieties. Several states offer subsidies for micro-irrigation systems. Farmers can contact their local agriculture department for assistance and subsidy schemes.',
    category: 'crop-advisory',
    subCategory: 'Best Practices',
    relevantStates: [],
    relevantCrops: [],
    source: {
      name: 'Indian Council of Agricultural Research',
      type: 'research'
    },
    publishDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    tags: ['water-conservation', 'irrigation', 'sustainability', 'advisory'],
    active: true,
    verified: true
  }
];

// Seed function
async function seedData() {
  try {
    console.log('🌱 Starting to seed sample data...\n');

    // Seed Government Schemes
    console.log('📋 Seeding Government Schemes...');
    await GovernmentScheme.deleteMany({}); // Clear existing schemes
    const schemes = await GovernmentScheme.insertMany(sampleSchemes);
    console.log(`✅ Created ${schemes.length} government schemes\n`);

    // Seed Agri News
    console.log('📰 Seeding Agriculture News...');
    await AgriNews.deleteMany({}); // Clear existing news
    const news = await AgriNews.insertMany(sampleNews);
    console.log(`✅ Created ${news.length} news articles\n`);

    console.log('🎉 Sample data seeded successfully!');
    console.log('\nYou can now:');
    console.log('- Browse government schemes at /dashboard/schemes');
    console.log('- Read agriculture news at /dashboard/news');
    console.log('- Test other features like crop calendar and forum');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run seeder
seedData();

