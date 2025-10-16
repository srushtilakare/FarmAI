// ----------------- server.js -----------------
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables from .env or .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const app = express();
app.use(express.json());
app.use(cors());

// ----------------- Connect to MongoDB -----------------
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ----------------- Routes -----------------
const authRoutes = require("./routes/auth"); // optional old registration
const otpRoutes = require("./routes/otp");   // OTP login/register

app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpRoutes);        // OTP routes

// ----------------- Default route -----------------
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ----------------- Start server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
