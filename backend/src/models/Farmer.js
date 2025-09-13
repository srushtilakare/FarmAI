import mongoose from "mongoose";

const farmerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: Number,
  gender: String,
  location: {
    village: String,
    district: String,
    state: String
  },
  farmSize: Number,
  crops: [String],
  preferredLanguage: { type: String, default: "English" },
  contactNumber: String,
}, { timestamps: true });

export default mongoose.model("Farmer", farmerSchema);
