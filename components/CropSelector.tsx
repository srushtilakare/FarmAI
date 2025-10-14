// components/CropSelector.tsx
"use client";
import React from "react";

const CROP_LIST = [
  { key: "wheat", label: "Wheat", emoji: "🌾" },
  { key: "rice", label: "Rice", emoji: "🌾" },
  { key: "maize", label: "Maize", emoji: "🌽" },
  { key: "sugarcane", label: "Sugarcane", emoji: "🌿" },
  { key: "cotton", label: "Cotton", emoji: "☁️" },
  { key: "vegetables", label: "Vegetables", emoji: "🥬" },
  { key: "fruits", label: "Fruits", emoji: "🍎" },
];

export default function CropSelector({
  selected,
  toggleCrop,
  lang,
}: {
  selected: string[];
  toggleCrop: (c: string) => void;
  lang?: string;
}) {
  return (
    <div className="crop-grid">
      {CROP_LIST.map((c) => {
        const active = selected.includes(c.key);
        return (
          <button
            key={c.key}
            type="button"
            className={`crop-card ${active ? "active" : ""}`}
            onClick={() => toggleCrop(c.key)}
          >
            <div className="emoji">{c.emoji}</div>
            <div className="crop-label">{c.label}</div>
          </button>
        );
      })}
    </div>
  );
}
