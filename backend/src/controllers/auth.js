import Farmer from "../models/Farmer.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if farmer exists
    const existingFarmer = await Farmer.findOne({ email });
    if (existingFarmer) return res.status(400).json({ msg: "Farmer already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newFarmer = new Farmer({ name, email, password: hashedPassword });
    await newFarmer.save();

    const token = jwt.sign({ id: newFarmer._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ token, farmer: newFarmer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const farmer = await Farmer.findOne({ email });
    if (!farmer) return res.status(400).json({ msg: "Farmer not found" });

    const isMatch = await bcrypt.compare(password, farmer.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: farmer._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({ token, farmer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
