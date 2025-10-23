const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String },       // optional
  password: { type: String },    // optional
  phone: { type: String, required: true, unique: true },
  preferredLanguage: { type: String, default: "en-US" },
  farmLocation: { type: String, required: true },
  state: { type: String, required: true },
  district: { type: String, required: true },
  pincode: { type: String },
  crops: { type: [String], required: true },
  farmingType: { type: String, required: true },
  profilePhoto: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
