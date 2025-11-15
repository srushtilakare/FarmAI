// backend/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmAI", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Routes (core)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth/otp", require("./routes/otp"));
app.use("/api/predict", require("./routes/predict"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/chatbot", require("./routes/chatbot"));
// add near other app.use(...) lines
app.use("/api/compare", require("./routes/compare"));
app.use("/api/heatmap", require("./routes/heatmap"));
app.use("/api/advisory", require("./routes/advisory"));
app.use("/api/predict-sell", require("./routes/predictSell"));


// Existing features
app.use("/api/backend-weather", require("./routes/weather"));
app.use("/api/market-prices", require("./routes/marketPrices"));

// New dynamic & helper endpoints
app.use("/api/locations", require("./routes/locations")); // states/districts/crops
app.use("/api/history", require("./routes/history"));     // 7-day history
app.use("/api/favorites", require("./routes/favorites")); // favorite crops

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
