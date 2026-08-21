// backend/server.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());
app.use(express.json());

// =========================================================
// MONGODB CONNECTION
// =========================================================

mongoose
  .connect(
    process.env.MONGO_URI ||
      "mongodb://127.0.0.1:27017/farmAI",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) =>
    console.error(
      "❌ MongoDB connection error:",
      err.message
    )
  );

// =========================================================
// ROUTES - CORE
// =========================================================

app.use(
  "/api/auth",
  require("./routes/auth")
);

app.use(
  "/api/auth/otp",
  require("./routes/otp")
);

app.use(
  "/api/predict",
  require("./routes/predict")
);

app.use(
  "/api/profile",
  require("./routes/profile")
);

app.use(
  "/api/user",
  require("./routes/userRoutes")
);

app.use(
  "/api/chatbot",
  require("./routes/chatbot")
);

app.use(
  "/api/compare",
  require("./routes/compare")
);

app.use(
  "/api/heatmap",
  require("./routes/heatmap")
);

app.use(
  "/api/advisory",
  require("./routes/advisory")
);

app.use(
  "/api/crop-advisory",
  require("./routes/cropAdvisory")
);

app.use(
  "/api/predict-sell",
  require("./routes/predictSell")
);

// =========================================================
// EXISTING FEATURES
// =========================================================

app.use(
  "/api/backend-weather",
  require("./routes/weather")
);

app.use(
  "/api/market-prices",
  require("./routes/marketPrices")
);

// =========================================================
// DYNAMIC & HELPER ENDPOINTS
// =========================================================

app.use(
  "/api/locations",
  require("./routes/locations")
);

app.use(
  "/api/history",
  require("./routes/history")
);

app.use(
  "/api/favorites",
  require("./routes/favorites")
);

app.use(
  "/api/disease-info",
  require("./routes/diseaseInfo")
);

// =========================================================
// SMART FARMING SYSTEM
// =========================================================

app.use(
  "/api/crop-calendar",
  require("./routes/cropCalendar")
);

app.use(
  "/api/forum",
  require("./routes/forum")
);

app.use(
  "/api/schemes",
  require("./routes/schemes")
);

app.use(
  "/api/soil-report",
  require("./routes/soilReport")
);

app.use(
  "/api/news",
  require("./routes/agriNews")
);

app.use(
  "/api/gamification",
  require("./routes/gamification")
);

app.use(
  "/api/activities",
  require("./routes/activities").router
);

// =========================================================
// SERVE UPLOADED FILES
// =========================================================
//
// All uploaded files are stored inside:
// backend/uploads/
//
// Using an absolute path makes this reliable even when
// the backend is started from a different working directory.
//
// Forum images are available at:
// http://localhost:5000/uploads/forum/<filename>
//
// Profile images are available at:
// http://localhost:5000/uploads/<filename>
//

const uploadsDirectory = path.join(
  __dirname,
  "uploads"
);

app.use(
  "/uploads",
  express.static(uploadsDirectory)
);

// =========================================================
// BASIC SERVER HEALTH CHECK
// =========================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FarmAI backend server is running"
  });
});

// =========================================================
// START SERVER
// =========================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});