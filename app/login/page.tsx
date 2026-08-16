"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [number, setNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");

  /*
    STEP 1 = Enter mobile number
    STEP 2 = Choose login method
    STEP 3 = OTP login
    STEP 4 = Password login
  */
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  // OTP timer
  const [timer, setTimer] = useState(120);

  // -----------------------------------------
  // ENTER KEY SUPPORT
  // -----------------------------------------
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;

      if (step === 1) {
        continueToLoginMethod();
      } else if (step === 3) {
        verifyOtp();
      } else if (step === 4) {
        loginWithPassword();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [step, number, otp, password, timer]);

  // -----------------------------------------
  // OTP TIMER
  // -----------------------------------------
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (step === 3 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [step, timer]);

  // -----------------------------------------
  // FORMAT TIMER
  // -----------------------------------------
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // -----------------------------------------
  // STEP 1 → CHOOSE LOGIN METHOD
  // -----------------------------------------
  const continueToLoginMethod = () => {
    const cleanedNumber = number.replace(/\D/g, "");

    if (!cleanedNumber) {
      toast({
        title: "⚠️ सूचना",
        description: "कृपया मोबाईल क्रमांक प्रविष्ट करा.",
        variant: "destructive",
      });
      return;
    }

    if (cleanedNumber.length !== 10) {
      toast({
        title: "अवैध मोबाईल क्रमांक",
        description: "कृपया 10 अंकी मोबाईल क्रमांक प्रविष्ट करा.",
        variant: "destructive",
      });
      return;
    }

    setNumber(cleanedNumber);
    setStep(2);
  };

  // -----------------------------------------
  // PASSWORD OPTION
  // -----------------------------------------
  const selectPasswordLogin = () => {
    setPassword("");
    setStep(4);
  };

  // -----------------------------------------
  // OTP OPTION
  // -----------------------------------------
  const selectOtpLogin = () => {
    requestOtp();
  };

  // -----------------------------------------
  // REQUEST OTP
  // -----------------------------------------
  const requestOtp = async () => {
    const cleanedNumber = number.replace(/\D/g, "");

    if (!cleanedNumber) {
      toast({
        title: "⚠️ सूचना",
        description: "कृपया मोबाईल क्रमांक प्रविष्ट करा.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: cleanedNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "त्रुटी",
          description: data.message || "OTP पाठवता आला नाही.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "OTP पाठवला",
        description: "OTP तयार झाला आहे. Backend terminal तपासा.",
        className: "bg-green-600 text-white border-none",
      });

      setOtp("");
      setTimer(120);
      setStep(3);
    } catch (err) {
      toast({
        title: "त्रुटी",
        description: "OTP पाठवताना समस्या आली.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // VERIFY OTP
  // -----------------------------------------
  const verifyOtp = async () => {
    if (timer === 0) {
      toast({
        title: "OTP कालबाह्य",
        description: "कृपया नवीन OTP मिळवा.",
        variant: "destructive",
      });
      return;
    }

    if (!otp.trim()) {
      toast({
        title: "⚠️ सूचना",
        description: "कृपया OTP टाका.",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{6}$/.test(otp.trim())) {
      toast({
        title: "अवैध OTP",
        description: "कृपया 6 अंकी OTP प्रविष्ट करा.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number,
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "OTP चुकीचा",
          description:
            data.message || "कृपया बरोबर OTP प्रविष्ट करा.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "लॉगिन सफल 🎉",
        description: "आपले लॉगिन यशस्वी झाले.",
        className: "bg-green-600 text-white border-none",
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      toast({
        title: "त्रुटी",
        description: "OTP पडताळताना समस्या आली.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // PASSWORD LOGIN
  // -----------------------------------------
  const loginWithPassword = async () => {
    if (!password.trim()) {
      toast({
        title: "⚠️ सूचना",
        description: "कृपया पासवर्ड प्रविष्ट करा.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/password/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: number,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "लॉगिन अयशस्वी",
          description:
            data.message ||
            "मोबाईल क्रमांक किंवा पासवर्ड चुकीचा आहे.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "लॉगिन सफल 🎉",
        description: "आपले लॉगिन यशस्वी झाले.",
        className: "bg-green-600 text-white border-none",
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setTimeout(() => {
        router.push("/dashboard");
      }, 700);
    } catch (err) {
      toast({
        title: "त्रुटी",
        description: "लॉगिन करताना समस्या आली.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // BACK TO PHONE
  // -----------------------------------------
  const goBackToPhone = () => {
    setStep(1);
    setOtp("");
    setPassword("");
    setTimer(120);
  };

  // -----------------------------------------
  // BACK TO LOGIN METHOD
  // -----------------------------------------
  const goBackToMethod = () => {
    setStep(2);
    setOtp("");
    setPassword("");
    setTimer(120);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-100 to-green-200">

      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-green-300">

        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-6">

          <h2 className="text-3xl font-bold text-green-700 mt-2">
            Farm AI Login
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Smart Farming for Maharashtra
          </p>

        </div>

        {/* INFORMATION BOX */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-6 text-center text-sm text-gray-800">
          📌 <b>नोंदणीवेळी वापरलेलाच मोबाईल क्रमांक येथे टाका.</b>
        </div>

        {/* ========================================= */}
        {/* STEP 1 — MOBILE NUMBER */}
        {/* ========================================= */}

        {step === 1 && (
          <div className="space-y-4">

            <label className="text-sm font-medium text-gray-700">
              मोबाईल क्रमांक
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="उदा. 9876543210"
              value={number}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

                setNumber(value);
              }}
              maxLength={10}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />

            <Button
              onClick={continueToLoginMethod}
              disabled={loading}
              className="w-full bg-green-600 text-white py-6 rounded-lg text-lg hover:bg-green-700 transition-colors"
            >
              पुढे जा
            </Button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 2 — CHOOSE LOGIN METHOD */}
        {/* ========================================= */}

        {step === 2 && (
          <div className="space-y-4">

            <div className="text-center mb-5">

              <p className="text-sm text-gray-500">
                मोबाईल क्रमांक
              </p>

              <p className="text-lg font-semibold text-gray-800">
                +91 {number}
              </p>

              <button
                type="button"
                onClick={goBackToPhone}
                className="text-green-700 text-sm mt-1 hover:underline"
              >
                चुकीचा क्रमांक? परत बदला
              </button>

            </div>

            <p className="text-center text-sm font-semibold text-gray-700 mb-3">
              तुम्हाला कसे लॉगिन करायचे आहे?
            </p>

            {/* PASSWORD LOGIN */}
            <Button
              type="button"
              onClick={selectPasswordLogin}
              disabled={loading}
              className="w-full bg-green-600 text-white py-6 rounded-lg text-lg hover:bg-green-700 transition-colors"
            >
              🔐 पासवर्डने लॉगिन करा
            </Button>

            {/* OTP LOGIN */}
            <Button
              type="button"
              onClick={selectOtpLogin}
              disabled={loading}
              className="w-full bg-white text-green-700 border-2 border-green-600 py-6 rounded-lg text-lg hover:bg-green-50 transition-colors"
            >
              📱 OTP ने लॉगिन करा
            </Button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 3 — OTP */}
        {/* ========================================= */}

        {step === 3 && (
          <div className="space-y-4">

            <div className="text-center mb-4">

              <p className="text-sm text-gray-500">
                OTP पाठवला आहे
              </p>

              <p className="text-lg font-semibold text-gray-800">
                +91 {number}
              </p>

            </div>

            <label className="text-sm font-medium text-gray-700">
              OTP टाका
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="६ अंकी OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 6);

                setOtp(value);
              }}
              maxLength={6}
              disabled={timer === 0}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none disabled:bg-gray-100"
            />

            <Button
              onClick={verifyOtp}
              disabled={loading || timer === 0}
              className="w-full bg-green-600 text-white py-6 rounded-lg text-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "तपासत आहे..." : "OTP पडताळा"}
            </Button>

            {/* TIMER */}
            <div className="text-center mt-4">

              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  OTP वैध आहे:{" "}
                  <span className="font-bold text-red-600 text-base">
                    {formatTime(timer)}
                  </span>
                </p>
              ) : (
                <div className="flex flex-col items-center">

                  <p className="text-sm text-red-500 font-medium mb-1">
                    OTP कालबाह्य झाला आहे.
                  </p>

                  <Button
                    variant="link"
                    onClick={requestOtp}
                    className="text-green-700 font-bold p-0 h-auto"
                  >
                    Resend OTP (पुन्हा पाठवा)
                  </Button>

                </div>
              )}

            </div>

            <button
              type="button"
              onClick={goBackToMethod}
              className="w-full text-green-700 text-sm mt-1 hover:underline"
            >
              दुसरी लॉगिन पद्धत निवडा
            </button>

          </div>
        )}

        {/* ========================================= */}
        {/* STEP 4 — PASSWORD */}
        {/* ========================================= */}

        {step === 4 && (
          <div className="space-y-4">

            <div className="text-center mb-4">

              <p className="text-sm text-gray-500">
                मोबाईल क्रमांक
              </p>

              <p className="text-lg font-semibold text-gray-800">
                +91 {number}
              </p>

            </div>

            <label className="text-sm font-medium text-gray-700">
              पासवर्ड टाका
            </label>

            <input
              type="password"
              placeholder="आपला पासवर्ड प्रविष्ट करा"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />

            <Button
              type="button"
              onClick={loginWithPassword}
              disabled={loading}
              className="w-full bg-green-600 text-white py-6 rounded-lg text-lg hover:bg-green-700 transition-colors"
            >
              {loading
                ? "लॉगिन करत आहे..."
                : "पासवर्डने लॉगिन करा"}
            </Button>

            <button
              type="button"
              onClick={goBackToMethod}
              className="w-full text-green-700 text-sm mt-1 hover:underline"
            >
              दुसरी लॉगिन पद्धत निवडा
            </button>

          </div>
        )}

        {/* REGISTER LINK */}
        <div className="text-center mt-6 pt-5 border-t border-gray-200">

          <p className="text-sm text-gray-600">

            FarmAI वर नवीन आहात?{" "}

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-green-700 font-semibold hover:underline"
            >
              नोंदणी करा
            </button>

          </p>

        </div>

      </div>
    </div>
  );
}