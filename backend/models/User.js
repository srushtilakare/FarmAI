const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, default: "Farmer" }, // default for OTP users
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true }, // optional email
  preferredLanguage: { type: String, default: "en-US" },
  farmLocation: { type: String, default: "" },
  state: { type: String, default: "" },
  district: { type: String, default: "" },
  pincode: { type: String, default: "" },
  crops: { type: [String], default: [] },
  farmingType: { type: String, default: "traditional" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
