"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import "./register.css"; // Import CSS

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

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
    preferredLanguage: "",
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

  return (
    <div className="register-page">
      <div className="register-card">
        <h2 className="register-title">🌱 Farm AI Registration</h2>
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? "active" : ""}`}>1</div>
          <div className={`progress-step ${step >= 2 ? "active" : ""}`}>2</div>
          <div className={`progress-step ${step >= 3 ? "active" : ""}`}>3</div>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {/* Step 1: Personal */}
          {step === 1 && (
            <div className="form-section">
              <input
                name="fullName"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <input
                name="email"
                placeholder="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
              <input
                name="password"
                placeholder="Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button type="button" className="next-btn" onClick={handleNext}>
                Next →
              </button>
            </div>
          )}

          {/* Step 2: Farm */}
          {step === 2 && (
            <div className="form-section">
              <input
                name="farmName"
                placeholder="Farm Name"
                value={formData.farmName}
                onChange={handleChange}
              />
              <input
                name="farmSize"
                placeholder="Farm Size (in acres)"
                type="number"
                value={formData.farmSize}
                onChange={handleChange}
              />
              <input
                name="farmLocation"
                placeholder="Farm Location"
                value={formData.farmLocation}
                onChange={handleChange}
              />
              <input
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
              />
              <input
                name="district"
                placeholder="District"
                value={formData.district}
                onChange={handleChange}
              />
              <input
                name="pincode"
                placeholder="Pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
              <input
                name="primaryCrops"
                placeholder="Primary Crops"
                value={formData.primaryCrops}
                onChange={handleChange}
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
              <input
                name="farmingExperience"
                placeholder="Farming Experience (years)"
                value={formData.farmingExperience}
                onChange={handleChange}
              />
              <input
                name="farmingType"
                placeholder="Farming Type"
                value={formData.farmingType}
                onChange={handleChange}
              />
              <input
                name="irrigationType"
                placeholder="Irrigation Type"
                value={formData.irrigationType}
                onChange={handleChange}
              />
              <input
                name="preferredLanguage"
                placeholder="Preferred Language"
                value={formData.preferredLanguage}
                onChange={handleChange}
              />
              <input
                name="communicationPreference"
                placeholder="Communication Preference"
                value={formData.communicationPreference}
                onChange={handleChange}
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
