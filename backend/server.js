const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

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
const authRoutes = require("./routes/auth");      // optional if you still want old registration
const otpRoutes = require("./routes/otp");        // OTP-based login/register
app.use("/api/auth", authRoutes);
app.use("/api/auth/otp", otpRoutes);             // OTP routes

// ----------------- Default route -----------------
app.get("/", (req, res) => {
  res.send("Backend is running...");
});

// ----------------- Start server -----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
