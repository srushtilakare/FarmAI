"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = request OTP, 2 = verify OTP
  const [loading, setLoading] = useState(false);

  // Request OTP
  const requestOtp = async () => {
    if (!phone.trim()) {
      alert("Please enter phone number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to send OTP");
      } else {
        alert("OTP sent to your phone!");
        setStep(2);
      }
    } catch (err) {
      console.error("OTP request error:", err);
      alert("Something went wrong while sending OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert("Please enter OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "OTP verification failed");
      } else {
        // Store token & user
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Login successful!");
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      alert("Something went wrong while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h2>🌱 FarmAI Login</h2>

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button onClick={requestOtp} disabled={loading}>
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={verifyOtp} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </>
      )}
    </div>
  );
}
