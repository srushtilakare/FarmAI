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
  .connect("mongodb://127.0.0.1:27017/farmAI", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/auth/otp", require("./routes/otp"));
app.use("/api/predict", require("./routes/predict"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/user", require("./routes/userRoutes"));
// Add at the end of your routes
app.use("/api/chatbot", require("./routes/chatbot"));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
