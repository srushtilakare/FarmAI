const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },

  // Optional fields
  farmName: String,
  farmSize: Number,
  farmLocation: String,
  state: String,
  district: String,
  pincode: String,
  primaryCrops: String,
  farmingExperience: String,
  farmingType: String,
  irrigationType: String,
  preferredLanguage: String,
  communicationPreference: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
