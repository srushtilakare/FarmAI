// ----------------- server.js -----------------
import farmiiRouter from "./farmii/chatbot.js";


const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");


// ----------------- Load environment variables -----------------
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ----------------- Initialize Express -----------------
const app = express();
app.use("/farmii", farmiiRouter);


// ----------------- Middleware -----------------
app.use(express.json());

// ✅ Global CORS middleware (no need for .options() anymore)
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ----------------- MongoDB Connection -----------------
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ----------------- Import Routes -----------------
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

// ----------------- Use Routes -----------------
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// ----------------- Default Route -----------------
app.get("/", (req, res) => {
  res.send("🌾 FarmAI Backend is running successfully ✅");
});

// ----------------- Global Error Handler -----------------
app.use((err, req, res, next) => {
  console.error("🔥 Global Error:", err.stack);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// ----------------- Start Server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});
