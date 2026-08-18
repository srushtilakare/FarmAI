"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  ShieldCheck,
  LockKeyhole,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sprout,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const { toast } = useToast();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [number, setNumber] = useState("");
  const [otp, setOtp] = useState("");

  // 4 digit MPIN
  const [mpin, setMpin] = useState(["", "", "", ""]);

  /*
    STEP 1 = Enter mobile number
    STEP 2 = Choose login method
    STEP 3 = OTP login
    STEP 4 = MPIN login
  */
  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(false);

  // OTP timer
  const [timer, setTimer] = useState(120);

  // MPIN input references
  const mpinRefs = useRef<(HTMLInputElement | null)[]>([]);

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
        loginWithMpin();
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [step, number, otp, mpin, timer]);

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

    return () => {
      if (interval) clearInterval(interval);
    };
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
  // RESET MPIN
  // -----------------------------------------
  const resetMpin = () => {
    setMpin(["", "", "", ""]);

    setTimeout(() => {
      mpinRefs.current[0]?.focus();
    }, 50);
  };

  // -----------------------------------------
  // STEP 1 → LOGIN METHOD
  // -----------------------------------------
  const continueToLoginMethod = () => {
    const cleanedNumber = number.replace(/\D/g, "");

    if (!cleanedNumber) {
      toast({
        title: "⚠️ मोबाईल क्रमांक आवश्यक",
        description: "कृपया तुमचा मोबाईल क्रमांक प्रविष्ट करा.",
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
  // MPIN OPTION
  // -----------------------------------------
  const selectMpinLogin = () => {
    resetMpin();
    setStep(4);

    setTimeout(() => {
      mpinRefs.current[0]?.focus();
    }, 100);
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
        title: "⚠️ मोबाईल क्रमांक आवश्यक",
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
          title: "OTP पाठवता आला नाही",
          description:
            data.message || "कृपया पुन्हा प्रयत्न करा.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✓ OTP तयार आहे",
        description:
          "OTP backend terminal मध्ये दिसेल.",
        className:
          "bg-green-600 text-white border-none",
      });

      setOtp("");
      setTimer(120);
      setStep(3);
    } catch (err) {
      toast({
        title: "कनेक्शन समस्या",
        description:
          "सर्व्हरशी कनेक्ट होता आले नाही.",
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
        title: "OTP कालबाह्य झाला",
        description: "कृपया नवीन OTP मिळवा.",
        variant: "destructive",
      });
      return;
    }

    if (!otp.trim()) {
      toast({
        title: "OTP आवश्यक",
        description: "कृपया 6 अंकी OTP टाका.",
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
      const res = await fetch(
        `${API_URL}/api/auth/otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            number,
            otp: otp.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "OTP चुकीचा",
          description:
            data.message ||
            "कृपया योग्य OTP प्रविष्ट करा.",
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      toast({
        title: "✓ लॉगिन यशस्वी!",
        description:
          `स्वागत आहे, ${data.user?.fullName || "शेतकरी"}!`,
        className:
          "bg-green-600 text-white border-none",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch (err) {
      toast({
        title: "काहीतरी चूक झाली",
        description:
          "OTP पडताळताना समस्या आली.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // MPIN INPUT HANDLER
  // -----------------------------------------
  const handleMpinChange = (
    index: number,
    value: string
  ) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const updatedMpin = [...mpin];
    updatedMpin[index] = digit;

    setMpin(updatedMpin);

    // Automatically move forward
    if (digit && index < 3) {
      mpinRefs.current[index + 1]?.focus();
    }
  };

  // -----------------------------------------
  // MPIN BACKSPACE
  // -----------------------------------------
  const handleMpinKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Backspace" &&
      !mpin[index] &&
      index > 0
    ) {
      mpinRefs.current[index - 1]?.focus();
    }
  };

  // -----------------------------------------
  // MPIN PASTE
  // -----------------------------------------
  const handleMpinPaste = (
    e: React.ClipboardEvent<HTMLInputElement>
  ) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 4);

    if (!pasted) return;

    const digits = pasted.split("");

    const updatedMpin = ["", "", "", ""];

    digits.forEach((digit, index) => {
      updatedMpin[index] = digit;
    });

    setMpin(updatedMpin);

    const nextIndex = Math.min(
      pasted.length,
      3
    );

    setTimeout(() => {
      mpinRefs.current[nextIndex]?.focus();
    }, 50);
  };

  // -----------------------------------------
  // MPIN LOGIN
  // -----------------------------------------
  const loginWithMpin = async () => {
    const enteredMpin = mpin.join("");

    if (enteredMpin.length !== 4) {
      toast({
        title: "MPIN अपूर्ण आहे",
        description:
          "कृपया तुमचा 4 अंकी MPIN टाका.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * Backend will be changed to:
       * POST /api/auth/mpin/login
       */
      const res = await fetch(
        `${API_URL}/api/auth/mpin/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: number,
            mpin: enteredMpin,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast({
          title: "लॉगिन अयशस्वी",
          description:
            data.message ||
            "मोबाईल क्रमांक किंवा MPIN चुकीचा आहे.",
          variant: "destructive",
        });

        resetMpin();
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      toast({
        title: "✓ लॉगिन यशस्वी!",
        description:
          `स्वागत आहे, ${data.user?.fullName || "शेतकरी"}!`,
        className:
          "bg-green-600 text-white border-none",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 900);
    } catch (err) {
      toast({
        title: "कनेक्शन समस्या",
        description:
          "सर्व्हरशी कनेक्ट होता आले नाही.",
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
    resetMpin();
    setTimer(120);
  };

  // -----------------------------------------
  // BACK TO LOGIN METHOD
  // -----------------------------------------
  const goBackToMethod = () => {
    setStep(2);
    setOtp("");
    resetMpin();
    setTimer(120);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center px-4 py-8">

      {/* MAIN CARD */}
      <div className="w-full max-w-md">

        <div className="bg-white rounded-3xl shadow-xl border border-green-100 overflow-hidden">

          {/* TOP GREEN HEADER */}
          <div className="bg-gradient-to-br from-green-700 to-green-600 px-6 py-7 text-white text-center">

            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <Sprout className="w-8 h-8" />
              </div>
            </div>

            <h1 className="text-2xl font-bold">
              FarmAI
            </h1>

            <p className="text-green-100 text-sm mt-1">
              Smart Farming for Farmers
            </p>

          </div>

          {/* CONTENT */}
          <div className="p-6 sm:p-8">

            {/* INFORMATION BOX */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3.5 mb-6 flex gap-3 items-start">

              <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />

              <p className="text-sm text-green-800 leading-5">
                नोंदणीवेळी वापरलेलाच मोबाईल
                क्रमांक येथे टाका.
              </p>

            </div>

            {/* ========================================= */}
            {/* STEP 1 — MOBILE NUMBER */}
            {/* ========================================= */}

            {step === 1 && (
              <div className="space-y-5">

                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    लॉगिन करा
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    तुमचा मोबाईल क्रमांक प्रविष्ट करा.
                  </p>
                </div>

                <div className="space-y-2">

                  <label className="text-sm font-semibold text-gray-700">
                    मोबाईल क्रमांक
                  </label>

                  <div className="flex">

                    <div className="flex items-center justify-center px-3 border border-r-0 border-gray-300 rounded-l-xl bg-gray-50 text-gray-600 font-medium">
                      +91
                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="98765 43210"
                      value={number}
                      onChange={(e) => {
                        const value =
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10);

                        setNumber(value);
                      }}
                      maxLength={10}
                      className="w-full border border-gray-300 px-4 py-3.5 rounded-r-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-base"
                    />

                  </div>

                  <p className="text-xs text-gray-500">
                    10 अंकी मोबाईल क्रमांक प्रविष्ट करा.
                  </p>

                </div>

                <Button
                  onClick={continueToLoginMethod}
                  disabled={loading}
                  className="w-full h-12 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 transition-all shadow-md"
                >
                  पुढे जा
                </Button>

              </div>
            )}

            {/* ========================================= */}
            {/* STEP 2 — LOGIN METHOD */}
            {/* ========================================= */}

            {step === 2 && (
              <div className="space-y-5">

                <div className="text-center">

                  <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <Smartphone className="w-6 h-6 text-green-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-800">
                    लॉगिन पद्धत निवडा
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    +91 {number}
                  </p>

                  <button
                    type="button"
                    onClick={goBackToPhone}
                    className="text-green-700 text-xs font-medium mt-2 hover:underline"
                  >
                    चुकीचा क्रमांक? बदला
                  </button>

                </div>

                <div className="space-y-3">

                  {/* MPIN */}
                  <button
                    type="button"
                    onClick={selectMpinLogin}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-green-600 bg-green-600 text-white text-left hover:bg-green-700 transition-all shadow-sm disabled:opacity-60"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                        <LockKeyhole className="w-5 h-5" />
                      </div>

                      <div>
                        <p className="font-bold">
                          4 अंकी MPIN ने लॉगिन करा
                        </p>

                        <p className="text-xs text-green-100 mt-0.5">
                          तुमचा सोपा 4 अंकी MPIN वापरा
                        </p>
                      </div>

                    </div>

                  </button>

                  {/* OTP */}
                  <button
                    type="button"
                    onClick={selectOtpLogin}
                    disabled={loading}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white text-left hover:border-green-400 hover:bg-green-50 transition-all disabled:opacity-60"
                  >

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-green-600" />
                      </div>

                      <div>
                        <p className="font-bold text-gray-800">
                          OTP ने लॉगिन करा
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          मोबाईलवर मिळालेल्या OTP ने
                        </p>
                      </div>

                    </div>

                  </button>

                </div>

              </div>
            )}

            {/* ========================================= */}
            {/* STEP 3 — OTP */}
            {/* ========================================= */}

            {step === 3 && (
              <div className="space-y-5">

                <div className="text-center">

                  <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-800">
                    OTP पडताळणी
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    OTP पाठवला आहे
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    +91 {number}
                  </p>

                </div>

                <div className="space-y-2">

                  <label className="text-sm font-semibold text-gray-700">
                    6 अंकी OTP टाका
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);

                      setOtp(value);
                    }}
                    maxLength={6}
                    disabled={timer === 0}
                    className="w-full border border-gray-300 px-4 py-3.5 rounded-xl text-center text-xl tracking-[0.5em] font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-100"
                  />

                </div>

                <Button
                  onClick={verifyOtp}
                  disabled={
                    loading || timer === 0
                  }
                  className="w-full h-12 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 disabled:bg-gray-400 transition-all"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      तपासत आहे...
                    </>
                  ) : (
                    <>
                      OTP पडताळा
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="text-center">

                  {timer > 0 ? (
                    <p className="text-sm text-gray-500">
                      OTP वैध आहे{" "}
                      <span className="font-bold text-green-700">
                        {formatTime(timer)}
                      </span>
                    </p>
                  ) : (
                    <div>
                      <p className="text-sm text-red-500 font-medium">
                        OTP कालबाह्य झाला आहे.
                      </p>

                      <Button
                        variant="link"
                        onClick={requestOtp}
                        className="text-green-700 font-bold p-0 h-auto mt-1"
                      >
                        पुन्हा OTP पाठवा
                      </Button>
                    </div>
                  )}

                </div>

                <button
                  type="button"
                  onClick={goBackToMethod}
                  className="w-full flex items-center justify-center gap-1 text-green-700 text-sm font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  दुसरी लॉगिन पद्धत निवडा
                </button>

              </div>
            )}

            {/* ========================================= */}
            {/* STEP 4 — MPIN */}
            {/* ========================================= */}

            {step === 4 && (
              <div className="space-y-5">

                <div className="text-center">

                  <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center mb-3">
                    <LockKeyhole className="w-6 h-6 text-green-600" />
                  </div>

                  <h2 className="text-xl font-bold text-gray-800">
                    MPIN ने लॉगिन करा
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    तुमचा 4 अंकी MPIN टाका
                  </p>

                  <p className="font-semibold text-gray-800 mt-1">
                    +91 {number}
                  </p>

                </div>

                {/* MPIN BOXES */}
                <div className="flex justify-center gap-3 py-3">

                  {mpin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        mpinRefs.current[index] = el;
                      }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) =>
                        handleMpinChange(
                          index,
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleMpinKeyDown(index, e)
                      }
                      onPaste={handleMpinPaste}
                      className={`w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                        digit
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-300 bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      }`}
                      aria-label={`MPIN digit ${index + 1}`}
                    />
                  ))}

                </div>

                <p className="text-center text-xs text-gray-500">
                  तुमचा MPIN 4 अंकी आहे.
                </p>

                <Button
                  type="button"
                  onClick={loginWithMpin}
                  disabled={loading}
                  className="w-full h-12 bg-green-600 text-white rounded-xl text-base font-semibold hover:bg-green-700 transition-all shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      लॉगिन करत आहे...
                    </>
                  ) : (
                    "MPIN ने लॉगिन करा"
                  )}
                </Button>

                <button
                  type="button"
                  onClick={goBackToMethod}
                  className="w-full flex items-center justify-center gap-1 text-green-700 text-sm font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  दुसरी लॉगिन पद्धत निवडा
                </button>

              </div>
            )}

            {/* REGISTER LINK */}
            <div className="text-center mt-7 pt-5 border-t border-gray-100">

              <p className="text-sm text-gray-500">

                FarmAI वर नवीन आहात?{" "}

                <button
                  type="button"
                  onClick={() =>
                    router.push("/register")
                  }
                  className="text-green-700 font-bold hover:underline"
                >
                  नोंदणी करा
                </button>

              </p>

            </div>

          </div>
        </div>

        {/* SMALL FOOTER */}
        <p className="text-center text-xs text-gray-400 mt-4">
          सुरक्षित आणि सोपे डिजिटल शेती सहाय्य
        </p>

      </div>
    </div>
  );
}