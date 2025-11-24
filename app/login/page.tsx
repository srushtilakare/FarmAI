"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [number, setNumber] = useState(""); // Phone number
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const requestOtp = async () => {
    if (!number.trim()) {
      alert(t("pleaseEnterPhone"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || t("failedToSendOTP"));
      } else {
        alert(t("otpGenerated"));
        setStep(2);
      }
    } catch (err) {
      console.error("OTP request error:", err);
      alert(t("errorSendingOTP"));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async () => {
    if (!otp.trim()) {
      alert(t("pleaseEnterOTP"));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || t("otpVerificationFailed"));
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert(`🎉 ${t("loginSuccess")}`);
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("OTP verify error:", err);
      alert(t("errorVerifyingOTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page flex flex-col items-center mt-10">
      <h2 className="text-2xl font-semibold mb-4">🌱 {t("loginTitle")}</h2>

      {step === 1 && (
        <>
          <input
            type="text"
            placeholder={t("phoneNumber")}
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            inputMode="numeric"
            className="border px-3 py-2 rounded mb-3"
          />
          <button
            onClick={requestOtp}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? t("sending") : t("sendOTP")}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <input
            type="text"
            placeholder={t("enterOTP")}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border px-3 py-2 rounded mb-3"
          />
          <button
            onClick={verifyOtp}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading ? t("verifying") : t("verifyOTP")}
          </button>
        </>
      )}
    </div>
  );
}
