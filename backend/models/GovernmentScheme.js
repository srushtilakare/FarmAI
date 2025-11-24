const mongoose = require('mongoose');

const governmentSchemeSchema = new mongoose.Schema({
  schemeName: {
    type: String,
    required: true
  },
  ministry: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  schemeType: {
    type: String,
    enum: ['income_support', 'subsidy', 'credit', 'loan', 'insurance', 'pension', 'technical_assistance', 'marketing', 'skill_development', 'infrastructure', 'training', 'equipment', 'other'],
    default: 'subsidy'
  },
  state: {
    type: String, // Single state or 'all' for central schemes
    required: true,
    default: 'all'
  },
  category: {
    type: [String], // SC, ST, OBC, General, all
    default: ['all']
  },
  farmerType: {
    type: [String], // small, marginal, large
    default: ['small', 'marginal', 'large']
  },
  gender: {
    type: [String], // male, female, all
    default: ['all']
  },
  eligibility: {
    type: [String], // Array of eligibility criteria
    required: true
  },
  benefits: {
    type: String,
    required: true
  },
  documentsRequired: {
    type: [String], // Array of required documents
    default: []
  },
  howToApply: {
    type: String, // Application process description
    required: true
  },
  applicationLink: {
    type: String, // Official website/portal link
    default: ''
  },
  // Legacy fields for backward compatibility
  applicationProcess: String,
  requiredDocuments: [String],
  officialWebsite: String,
  contactInfo: {
    phone: String,
    email: String,
    address: String
  },
  deadline: Date,
  budgetAmount: String,
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
governmentSchemeSchema.index({ state: 1, active: 1 });
governmentSchemeSchema.index({ category: 1 });
governmentSchemeSchema.index({ schemeType: 1 });

module.exports = mongoose.model('GovernmentScheme', governmentSchemeSchema);

