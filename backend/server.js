import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Routes (we will create these next)
import authRoutes from "./src/routes/auth.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
