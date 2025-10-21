const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    farmName: { type: String },
    farmLocation: { type: String },
    profilePhoto: { type: String }, // path to uploaded photo
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
