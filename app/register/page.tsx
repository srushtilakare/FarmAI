"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import VoiceInput from "../../components/VoiceInput";
import "./register.css";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [language, setLanguage] = useState("en-US"); // default English

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    farmName: "",
    farmSize: "",
    farmLocation: "",
    state: "",
    district: "",
    pincode: "",
    primaryCrops: "",
    farmingExperience: "",
    farmingType: "",
    irrigationType: "",
    communicationPreference: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Registration failed");
      } else {
        alert("Registration successful! Please login.");
        router.push("/login");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Translation labels
  const translations: { [key: string]: { [key: string]: string } } = {
    fullName: { "en-US": "Full Name", "hi-IN": "पूरा नाम", "mr-IN": "पूर्ण नाव" },
    email: { "en-US": "Email", "hi-IN": "ईमेल", "mr-IN": "ईमेल" },
    phone: { "en-US": "Phone", "hi-IN": "फोन", "mr-IN": "फोन" },
    password: { "en-US": "Password", "hi-IN": "पासवर्ड", "mr-IN": "पासवर्ड" },
    farmName: { "en-US": "Farm Name", "hi-IN": "खेती का नाम", "mr-IN": "शेताचे नाव" },
    farmSize: { "en-US": "Farm Size (acres)", "hi-IN": "खेती का आकार (एकड़ में)", "mr-IN": "शेताचा आकार (एकरात)" },
    farmLocation: { "en-US": "Farm Location", "hi-IN": "खेती का स्थान", "mr-IN": "शेताचे ठिकाण" },
    state: { "en-US": "State", "hi-IN": "राज्य", "mr-IN": "राज्य" },
    district: { "en-US": "District", "hi-IN": "जिला", "mr-IN": "जिल्हा" },
    pincode: { "en-US": "Pincode", "hi-IN": "पिनकोड", "mr-IN": "पिनकोड" },
    primaryCrops: { "en-US": "Primary Crops", "hi-IN": "मुख्य फसलें", "mr-IN": "मुख्य पिके" },
    farmingExperience: { "en-US": "Farming Experience (years)", "hi-IN": "कृषि अनुभव (सालों में)", "mr-IN": "शेती अनुभव (वर्षात)" },
    farmingType: { "en-US": "Farming Type", "hi-IN": "कृषि प्रकार", "mr-IN": "शेती प्रकार" },
    irrigationType: { "en-US": "Irrigation Type", "hi-IN": "सिंचाई प्रकार", "mr-IN": "सिंचन प्रकार" },
    communicationPreference: { "en-US": "Communication Preference", "hi-IN": "संचार पसंद", "mr-IN": "संपर्क प्राधान्य" },
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">🌱 Farm AI Registration</h2>

        {/* Language Selector */}
        <div className="language-selector">
          <label>Select Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en-US">English</option>
            <option value="hi-IN">Hindi</option>
            <option value="mr-IN">Marathi</option>
          </select>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>1</div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>2</div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}>3</div>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="form-section">
              <VoiceInput
                labelKey="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <button type="button" className="next-btn" onClick={handleNext}>
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Farm Info */}
          {step === 2 && (
            <div className="form-section">
              <VoiceInput
                labelKey="farmName"
                name="farmName"
                value={formData.farmName}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="farmSize"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="farmLocation"
                name="farmLocation"
                value={formData.farmLocation}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="primaryCrops"
                name="primaryCrops"
                value={formData.primaryCrops}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <div className="step-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button type="button" className="next-btn" onClick={handleNext}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
            <div className="form-section">
              <VoiceInput
                labelKey="farmingExperience"
                name="farmingExperience"
                value={formData.farmingExperience}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="farmingType"
                name="farmingType"
                value={formData.farmingType}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="irrigationType"
                name="irrigationType"
                value={formData.irrigationType}
                onChange={handleChange}
                language={language}
                translations={translations}
              />
              <VoiceInput
                labelKey="communicationPreference"
                name="communicationPreference"
                value={formData.communicationPreference}
                onChange={handleChange}
                language={language}
                translations={translations}
              />

              <div className="step-actions">
                <button type="button" className="back-btn" onClick={handleBack}>
                  ← Back
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={loading}
                >
                  {loading ? "Registering..." : "Register"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
