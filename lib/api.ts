// lib/api.ts
// Centralized API configuration for FarmAI frontend

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default API_BASE_URL;

