"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// SHADCN TOAST (Restored)
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [number, setNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // ⭐ Timer State (Restored from old code)
  const [timer, setTimer] = useState(120);

  // ⭐ Keyboard "Enter" Support (Restored)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (step === 1) requestOtp();
        if (step === 2) verifyOtp();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, number, otp]);

  // ⭐ Timer Countdown Effect (Restored)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // STEP 1 — REQUEST OTP (Logic preserved, UI updated to Old Look)
  const requestOtp = async () => {
    if (!number.trim()) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "त्रुटी",
          description: data.message || "OTP पाठवता आला नाही.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "OTP पाठवला",
          description: "आपल्या मोबाईलवर OTP पाठवण्यात आला आहे.",
          className: "bg-green-600 text-white border-none",
        });
        setTimer(120); 
        setStep(2);
      }
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

  // STEP 2 — VERIFY OTP (Logic preserved, UI updated to Old Look)
  const verifyOtp = async () => {
    if (timer === 0) {
      toast({
        title: "OTP कालबाह्य",
        description: "कृपया 'Resend OTP' क्लिक करून नवीन OTP मिळवा.",
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

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number, otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "OTP चुकीचा",
          description: "कृपया बरोबर OTP प्रविष्ट करा.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "लॉगिन सफल 🎉",
          description: "आपले लॉगिन यशस्वी झाले.",
          className: "bg-green-600 text-white border-none",
        });

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        setTimeout(() => router.push("/dashboard"), 700);
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-green-100 to-green-200">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8 border border-green-300">

        {/* LOGO & TITLE */}
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-3xl font-bold text-green-700 mt-2">Farm AI Login</h2>
          <p className="text-sm text-gray-600 mt-1">Smart Farming for Maharashtra</p>
        </div>

        {/* MARATHI INFORMATION BOX (Restored) */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-6 text-center text-sm text-gray-800">
          📌 <b>नोंदणीवेळी वापरलेलाच मोबाईल क्रमांक येथे टाका.</b>
        </div>

        {/* STEP 1 — PHONE NUMBER */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">मोबाईल क्रमांक</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="उदा. 9876543210"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
            <Button
              onClick={requestOtp}
              disabled={loading}
              className="w-full bg-green-600 text-white py-6 rounded-lg text-lg hover:bg-green-700 transition-colors"
            >
              {loading ? "पाठवत आहे..." : "OTP पाठवा"}
            </Button>
          </div>
        )}

        {/* STEP 2 — OTP */}
        {step === 2 && (
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">OTP टाका</label>
            <input
              type="text"
              placeholder="६ अंकी OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
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

            {/* ⭐ TIMER SECTION (Restored) */}
            <div className="text-center mt-4">
              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  OTP वैध आहे: <span className="font-bold text-red-600 text-base">{formatTime(timer)}</span>
                </p>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-sm text-red-500 font-medium mb-1">OTP कालबाह्य झाला आहे.</p>
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
              onClick={() => { setStep(1); setTimer(0); }}
              className="w-full text-green-700 text-sm mt-1 hover:underline"
            >
              चुकीचा क्रमांक? परत बदला
            </button>
          </div>
        )}
      </div>
    </div>
  );
}