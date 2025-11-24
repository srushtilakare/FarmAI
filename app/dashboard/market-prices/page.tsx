"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  ArrowLeft,
  Star,
  StarOff,
  BarChart2,
  Activity,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  BarElement
);

// ⭐ Bright Theme 4 colors
const COLORS = [
  "#ff7f7f", // red
  "#7fb3ff", // blue
  "#7fffac", // mint
  "#ffa07f", // orange
  "#e07fff", // purple
];

// ⭐ Static districts for Maharashtra
const DISTRICTS = [
  "Pune",
  "Nashik",
  "Ahmednagar",
  "Kolhapur",
  "Satara",
  "Sangli",
  "Solapur",
  "Aurangabad",
  "Beed",
  "Jalgaon",
  "Dhule",
  "Nandurbar",
  "Nagpur",
  "Wardha",
  "Amravati",
  "Yavatmal",
  "Akola",
  "Buldhana",
  "Osmanabad",
  "Latur",
  "Parbhani",
  "Hingoli",
  "Raigad",
  "Ratnagiri",
  "Sindhudurg",
];

// ⭐ Static crop list
const CROPS = [
  "Onion",
  "Tomato",
  "Potato",
  "Cotton",
  "Sugarcane",
  "Wheat",
  "Rice",
  "Soybean",
  "Tur",
  "Moong",
  "Urad",
  "Banana",
  "Pomegranate",
  "Grapes",
  "Chilli",
];

export default function MarketPricesPage() {
  const { t, language } = useLanguage();
  const [lang, setLang] = useState<"en" | "hi" | "mr">(language === "english" ? "en" : language === "hindi" ? "hi" : "mr");

  // Search & filters
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [crop, setCrop] = useState("all");

  // Data states
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Heatmap
  const [heatData, setHeatData] = useState<any[]>([]);
  const [heatLoading, setHeatLoading] = useState(false);

  // Comparison
  const [cmpCrop1, setCmpCrop1] = useState("Onion");
  const [cmpCrop2, setCmpCrop2] = useState("Tomato");
  const [cmpMarket1, setCmpMarket1] = useState("");
  const [cmpMarket2, setCmpMarket2] = useState("");
  const [cmpResult, setCmpResult] = useState<any>(null);

  // Advisory + Prediction
  const [advisory, setAdvisory] = useState<any>(null);
  const [predict, setPredict] = useState<any>(null);

  // Voice input
  const recRef = useRef<any>(null);
  const [listening, setListening] = useState(false);

  // =====================================================
  //  FETCH MARKET DATA
  // =====================================================

  async function fetchData() {
    setLoading(true);

    const params = new URLSearchParams();
    if (crop !== "all") params.append("crop", crop);
    if (district !== "all") params.append("district", district);

    try {
      const res = await fetch(`/api/market-prices?${params.toString()}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.log("Fetch error:", e);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  //  FETCH HEATMAP
  // =====================================================

  async function fetchHeat() {
    if (crop === "all") return;
    setHeatLoading(true);

    try {
      const res = await fetch(`/api/heatmap?crop=${crop}`);
      const json = await res.json();
      if (json.success) setHeatData(json.data);
    } catch (e) {
      console.log("Heatmap error:", e);
    }

    setHeatLoading(false);
  }

  useEffect(() => {
    fetchHeat();
  }, [crop]);

  // =====================================================
  //  VOICE RECOGNITION
  // =====================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;

    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.lang = lang === "en" ? "en-US" : lang === "hi" ? "hi-IN" : "mr-IN";
    rec.interimResults = false;

    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setSearch(text);
      setListening(false);
    };

    rec.onend = () => setListening(false);

    recRef.current = rec;
  }, [lang]);

  function startVoice() {
    if (!recRef.current) return alert("Voice not supported");
    recRef.current.start();
    setListening(true);
  }

  // =====================================================
  //  APPLY FILTERS
  // =====================================================

  const filtered = data.filter((item) => {
    const s = search.toLowerCase();
    if (
      s &&
      !item.crop.toLowerCase().includes(s) &&
      !item.market.toLowerCase().includes(s) &&
      !item.district.toLowerCase().includes(s)
    )
      return false;

    if (crop !== "all" && item.crop !== crop) return false;
    if (district !== "all" && item.district !== district) return false;

    return true;
  });
  // =====================================================
  //  FETCH COMPARISON DATA
  // =====================================================

  async function fetchComparison() {
    if (!cmpCrop1 || !cmpCrop2 || !cmpMarket1 || !cmpMarket2) return;
    try {
      const res = await fetch(
        `/api/compare?crop1=${cmpCrop1}&market1=${cmpMarket1}&crop2=${cmpCrop2}&market2=${cmpMarket2}`
      );
      const json = await res.json();
      if (json.success) setCmpResult(json.data);
    } catch (err) {
      console.log("Compare error:", err);
    }
  }

  // =====================================================
  //  FETCH ADVISORY
  // =====================================================

  async function fetchAdvisory() {
    if (filtered.length === 0) return;
    const cropToAnalyze = crop !== "all" ? crop : filtered[0]?.crop;
    const marketToAnalyze = district !== "all" ? district : filtered[0]?.market || "DELHI";

    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch(`/api/advisory?commodity=${cropToAnalyze}&market=${marketToAnalyze}`, {
        headers
      });
      const json = await res.json();
      if (json.success) setAdvisory(json.data);
    } catch (e) {
      console.log("Advisory err:", e);
    }
  }

  useEffect(() => {
    fetchAdvisory();
  }, [filtered]);

  // =====================================================
  //  FETCH PRICE PREDICTION
  // =====================================================

  async function fetchPrediction() {
    if (filtered.length === 0) return;
    const cropToAnalyze = crop !== "all" ? crop : filtered[0]?.crop;

    try {
      const res = await fetch(`/api/predict-sell?crop=${cropToAnalyze}`);
      const json = await res.json();
      if (json.success) setPredict(json.data);
    } catch (e) {
      console.log("Predict err:", e);
    }
  }

  useEffect(() => {
    fetchPrediction();
  }, [filtered]);

  // =====================================================
  //  UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#f7faff] p-6 space-y-10">

      {/* 🔙 Back Button */}
      <Button
        variant="outline"
        onClick={() => window.location.href = "/dashboard"}
        className="flex items-center gap-2 border-gray-300"
      >
        <ArrowLeft size={18} />
        {t("backToDashboard")}
      </Button>

      {/* 🌐 Language Switch */}
      <div className="flex gap-2">
        <Button
          variant={lang === "en" ? "default" : "outline"}
          onClick={() => setLang("en")}
        >
          English
        </Button>
        <Button
          variant={lang === "hi" ? "default" : "outline"}
          onClick={() => setLang("hi")}
        >
          हिन्दी
        </Button>
        <Button
          variant={lang === "mr" ? "default" : "outline"}
          onClick={() => setLang("mr")}
        >
          मराठी
        </Button>
      </div>

      {/* =====================================================
              🔍 SEARCH + FILTERS
      ===================================================== */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("searchMarketPrices")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Search Row */}
          <div className="flex gap-3 items-center">
            <Input
              placeholder={t("searchCropMarketDistrict")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white"
            />

            <Button
              variant={listening ? "default" : "outline"}
              onClick={startVoice}
              className="flex items-center gap-2"
            >
              <Mic className={listening ? "animate-pulse text-red-500" : ""} />
              {t("voice")}
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* District */}
            <Select value={district} onValueChange={setDistrict}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={t("selectDistrict")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allDistricts")}</SelectItem>
                {DISTRICTS.map((d, i) => (
                  <SelectItem key={i} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Crop */}
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder={t("selectCrop")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCrops")}</SelectItem>
                {CROPS.map((c, i) => (
                  <SelectItem key={i} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Apply */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={fetchData}
            >
              {t("applyFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =====================================================
              📊 HEATMAP SECTION
      ===================================================== */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("maharashtraPriceHeatmap")}</CardTitle>
        </CardHeader>

        <CardContent>
          {heatLoading ? (
            <p>{t("loadingHeatmap")}</p>
          ) : heatData.length === 0 ? (
            <p>{t("noHeatmapData")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {heatData.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-lg text-white text-center shadow"
                  style={{
                    backgroundColor:
                      d.avg > 3000
                        ? "#ff4d4d"
                        : d.avg > 1500
                        ? "#ffa64d"
                        : "#4da6ff",
                  }}
                >
                  <h3 className="font-semibold">{d.district}</h3>
                  <p className="text-lg font-bold">₹{d.avg}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
              📈 PRICE COMPARISON
      ===================================================== */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("cropMarketComparison")}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Crop 1 */}
            <div className="flex gap-2">
              <Select value={cmpCrop1} onValueChange={setCmpCrop1}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CROPS.map((c) => (
                    <SelectItem value={c} key={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder={t("market1")}
                value={cmpMarket1}
                onChange={(e) => setCmpMarket1(e.target.value)}
              />
            </div>

            {/* Crop 2 */}
            <div className="flex gap-2">
              <Select value={cmpCrop2} onValueChange={setCmpCrop2}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CROPS.map((c) => (
                    <SelectItem value={c} key={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder={t("market2")}
                value={cmpMarket2}
                onChange={(e) => setCmpMarket2(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={fetchComparison}
          >
            {t("compare")}
          </Button>

          {cmpResult && (
            <div className="mt-6">
              <Line
                data={{
                  labels: cmpResult.crop1.series.map((s: any) => s.date),
                  datasets: [
                    {
                      label: cmpCrop1,
                      data: cmpResult.crop1.series.map((s: any) => s.avgPrice),
                      borderColor: COLORS[0],
                    },
                    {
                      label: cmpCrop2,
                      data: cmpResult.crop2.series.map((s: any) => s.avgPrice),
                      borderColor: COLORS[1],
                    },
                  ],
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
              📘 MARKET ADVISORY
      ===================================================== */}
      {advisory && (
        <Card className="border-2 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t("cropAdvisory")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{advisory.message}</p>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
              🔮 SELL PRICE PREDICTION
      ===================================================== */}
      {predict && (
        <Card className="border-2 border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>{t("expectedPriceTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg">{predict.message}</p>
          </CardContent>
        </Card>
      )}
      {/* =====================================================
              📦 MARKET LIST (MAIN DATA DISPLAY)
      ===================================================== */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("availableMarketPrices")}</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>{t("loading")}</p>
          ) : filtered.length === 0 ? (
            <p>{t("noDataForFilters")}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filtered.map((item, i) => (
                <Card
                  key={i}
                  className="border shadow-sm hover:shadow-md transition p-4 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{item.crop}</h3>
                      <Badge variant="outline" className="mt-1">
                        {item.variety}
                      </Badge>

                      <p className="mt-2 text-gray-600">
                        <strong>{t("market")}:</strong> {item.market}
                      </p>
                      <p className="text-gray-600">
                        <strong>{t("district")}:</strong> {item.district}
                      </p>

                      <p className="text-gray-500 text-sm">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-700">
                        ₹{item.currentPrice}
                      </p>

                      <p className="text-sm text-gray-500">{item.unit}</p>

                      {item.change !== null && (
                        <div
                          className={`flex items-center justify-end mt-1 gap-1 ${
                            item.change > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {item.change > 0 ? (
                            <BarChart2 size={18} />
                          ) : (
                            <Activity size={18} />
                          )}
                          <span>{item.change.toFixed(1)}%</span>
                        </div>
                      )}

                      {item.previousPrice !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                          {t("previous")}: ₹{item.previousPrice}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* =====================================================
              ⭐ INSIGHTS (TOP GAINERS + DECLINERS)
      ===================================================== */}
      <Card className="border-2 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>{t("marketInsights")}</CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6">

          {/* Top Gainers */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-700">
              📈 {t("priceGainers")}
            </h3>
            <div className="space-y-2">
              {filtered
                .filter((i) => i.change > 0)
                .sort((a, b) => b.change - a.change)
                .slice(0, 3)
                .map((i, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-green-100"
                  >
                    <span>{i.crop}</span>
                    <span className="font-bold text-green-700">
                      +{i.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Top Decliners */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-700">
              📉 {t("priceDecliners")}
            </h3>
            <div className="space-y-2">
              {filtered
                .filter((i) => i.change < 0)
                .sort((a, b) => a.change - b.change)
                .slice(0, 3)
                .map((i, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-100"
                  >
                    <span>{i.crop}</span>
                    <span className="font-bold text-red-700">
                      {i.change.toFixed(1)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
