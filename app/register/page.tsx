"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CropSelector from "../../components/CropSelector";
import "./register.css";

type LocationInfo = {
  lat?: number;
  lon?: number;
  state?: string;
  district?: string;
  pincode?: string;
  display_name?: string;
};

const TRANSLATIONS: any = {
  "en-US": {
    title: "Register to FarmAI",
    subtitle: "Fast setup — takes 2 minutes",
    name: "Name",
    phone: "Phone number",
    language: "Language",
    detectLocation: "Use my current location",
    locationDetected: "Detected location",
    chooseCrops: "Choose your crops",
    farmingType: "Farming type",
    organic: "Organic",
    traditional: "Traditional",
    modern: "Modern",
    submit: "Register",
    success: "Registration successful!",
    errorLocation: "Couldn't auto-detect location, please enter manually.",
    fillAll: "All required fields must be filled",
  },
  "hi-IN": {
    title: "FarmAI में पंजीकरण",
    subtitle: "तेज़ सेटअप — 2 मिनट में पूरा करें",
    name: "नाम",
    phone: "फ़ोन नंबर",
    language: "भाषा",
    detectLocation: "मौजूदा स्थान उपयोग करें",
    locationDetected: "पहचाना गया स्थान",
    chooseCrops: "अपनी फसल चुनें",
    farmingType: "खेती का प्रकार",
    organic: "जैविक",
    traditional: "पारंपरिक",
    modern: "आधुनिक",
    submit: "पंजीकरण",
    success: "पंजीकरण सफल!",
    errorLocation: "स्थान नहीं पाया, कृपया मैन्युअल रूप से दर्ज करें।",
    fillAll: "कृपया सभी आवश्यक फ़ील्ड भरें",
  },
  "mr-IN": {
    title: "FarmAI मध्ये नोंदणी",
    subtitle: "जलद सेटअप — 2 मिनिटांत पूर्ण करा",
    name: "नाव",
    phone: "फोन नंबर",
    language: "भाषा",
    detectLocation: "माझे चालू स्थान वापरा",
    locationDetected: "ओळखलेले स्थान",
    chooseCrops: "आपली पिके निवडा",
    farmingType: "शेतीचा प्रकार",
    organic: "सेंद्रिय",
    traditional: "पारंपरिक",
    modern: "आधुनिक",
    submit: "नोंदणी",
    success: "नोंदणी यशस्वी!",
    errorLocation: "स्थान शोधले गेले नाही, कृपया मॅन्युअली भरा.",
    fillAll: "कृपया सर्व आवश्यक फील्ड भरा",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en-US" | "hi-IN" | "mr-IN">("en-US");
  const t = (k: string) => TRANSLATIONS[lang][k] ?? k;

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<LocationInfo>({});
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [farmingType, setFarmingType] = useState<"organic" | "traditional" | "modern">(
    "traditional"
  );
  const [loading, setLoading] = useState(false);

  // Detect user location
  async function detectLocation() {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError(t("errorLocation"));
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
          );
          const data = await res.json();
          const address = data.address || {};
          const loc: LocationInfo = {
            lat,
            lon,
            state: address.state || address.region || "",
            district: address.county || address.state_district || address.village || address.town || "",
            pincode: address.postcode || "",
            display_name: data.display_name || "",
          };
          setLocation(loc);
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setLocError(t("errorLocation"));
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocLoading(false);
        setLocError(t("errorLocation"));
      },
      { timeout: 15000 }
    );
  }

  function toggleCrop(crop: string) {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  }

  // Handle registration submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ✅ Validate required fields
    if (
      !name.trim() ||
      !phone.trim() ||
      !location.state ||
      !location.district ||
      selectedCrops.length === 0 ||
      !farmingType
    ) {
      alert(t("fillAll"));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: name,
        phone,
        preferredLanguage: lang,
        farmLocation: location.display_name || "",
        state: location.state || "",
        district: location.district || "",
        pincode: location.pincode || "",
        crops: selectedCrops, // keep as array
        farmingType,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Registration failed");
      } else {
        alert(t("success"));
        router.push("/login"); // Redirect to OTP login
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="simple-register">
      <div className="card">
        <h1 className="title">{t("title")}</h1>
        <p className="subtitle">{t("subtitle")}</p>

        {/* Language selector */}
        <div className="lang-row">
          <label>{t("language")}</label>
          <div className="lang-buttons">
            <button className={lang === "en-US" ? "active" : ""} type="button" onClick={() => setLang("en-US")}>English</button>
            <button className={lang === "hi-IN" ? "active" : ""} type="button" onClick={() => setLang("hi-IN")}>हिन्दी</button>
            <button className={lang === "mr-IN" ? "active" : ""} type="button" onClick={() => setLang("mr-IN")}>मराठी</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="label">{t("name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} />

          <label className="label">{t("phone")}</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} inputMode="numeric" />

          <div className="location-row">
            <button type="button" className="location-btn" onClick={detectLocation} disabled={locLoading}>
              {locLoading ? "Detecting…" : t("detectLocation")}
            </button>

            {location.display_name && (
              <div className="location-info">
                <strong>{t("locationDetected")}:</strong>
                <div>{location.display_name}</div>
                <div>{location.district} {location.state} {location.pincode}</div>
              </div>
            )}
            {locError && <div className="error">{locError}</div>}
          </div>

          <div className="crops-block">
            <label className="label">{t("chooseCrops")}</label>
            <CropSelector selected={selectedCrops} toggleCrop={toggleCrop} lang={lang} />
          </div>

          <div className="farming-type">
            <label className="label">{t("farmingType")}</label>
            <div className="farming-buttons">
              <button type="button" className={farmingType === "traditional" ? "active" : ""} onClick={() => setFarmingType("traditional")}>{t("traditional")}</button>
              <button type="button" className={farmingType === "modern" ? "active" : ""} onClick={() => setFarmingType("modern")}>{t("modern")}</button>
              <button type="button" className={farmingType === "organic" ? "active" : ""} onClick={() => setFarmingType("organic")}>{t("organic")}</button>
            </div>
          </div>

          <div className="submit-row">
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
