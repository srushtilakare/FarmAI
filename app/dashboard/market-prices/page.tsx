"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";

import {
  AlertCircle,
  ArrowLeft,
  Activity,
  BarChart2,
  MapPin,
  Mic,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n/LanguageContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

// =========================================================
// STATIC DISTRICTS
// =========================================================

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

// =========================================================
// STATIC CROPS
// =========================================================

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

// =========================================================
// TYPES
// =========================================================

type MarketPrice = {
  crop: string;
  variety: string;

  currentPrice: number | null;
  previousPrice: number | null;
  change: number | null;

  minPrice: number | null;
  maxPrice: number | null;
  modalPrice: number | null;

  market: string;
  district: string;
  state: string;

  date: string | null;
  unit: string;
};

type HeatItem = {
  district: string;
  avg: number | null;
  lowest: number | null;
  highest: number | null;
  marketCount: number;
  recordCount: number;
  latestDate: string | null;
};

type ComparisonSeriesItem = {
  date: string;
  avgPrice: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  recordCount?: number;
  markets?: string[];
};

type ComparisonSide = {
  commodity: string;
  market: string;
  requestedMarket?: string;

  series: ComparisonSeriesItem[];

  latestPrice: number | null;
  latestDate: string | null;

  previousPrice: number | null;
  change: number | null;

  highestPrice: number | null;
  lowestPrice: number | null;
  averagePrice: number | null;

  daysWithData: number;
};

type ComparisonResult = {
  crop1: ComparisonSide;
  crop2: ComparisonSide;

  meta?: {
    source?: string;
    state?: string;
    requestedDays?: number;
    comparisonReady?: boolean;
  };
};

// =========================================================
// HELPERS
// =========================================================

function safeNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatPrice(value: unknown): string {
  const number = safeNumber(value);

  if (number === null) {
    return "—";
  }

  return `₹${number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  )}`;
}

function formatDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "Date not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) =>
          String(value || "").trim()
        )
        .filter(Boolean)
    )
  ).sort((a, b) =>
    a.localeCompare(b)
  );
}

function changeClass(
  change: number | null
): string {
  if (change === null) {
    return "text-gray-500";
  }

  if (change > 0) {
    return "text-green-700";
  }

  if (change < 0) {
    return "text-red-700";
  }

  return "text-gray-600";
}

function changeIcon(
  change: number | null
) {
  if (change === null) {
    return (
      <Activity size={17} />
    );
  }

  if (change > 0) {
    return (
      <TrendingUp size={17} />
    );
  }

  if (change < 0) {
    return (
      <TrendingDown size={17} />
    );
  }

  return (
    <Activity size={17} />
  );
}

// =========================================================
// COMPONENT
// =========================================================

export default function MarketPricesPage() {
  const { t, language } =
    useLanguage();

  // =======================================================
  // LANGUAGE
  // =======================================================

  const [lang, setLang] =
    useState<"en" | "hi" | "mr">(
      language === "hindi"
        ? "hi"
        : language === "marathi"
        ? "mr"
        : "en"
    );

  useEffect(() => {
    setLang(
      language === "hindi"
        ? "hi"
        : language === "marathi"
        ? "mr"
        : "en"
    );
  }, [language]);

  // =======================================================
  // MAIN FILTERS
  // =======================================================

  const [search, setSearch] =
    useState("");

  const [district, setDistrict] =
    useState("all");

  const [crop, setCrop] =
    useState("all");

  const [userDistrict, setUserDistrict] =
    useState<string | null>(null);

  // =======================================================
  // MAIN DATA
  // =======================================================

  const [data, setData] =
    useState<MarketPrice[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [dataError, setDataError] =
    useState<string | null>(null);

  // =======================================================
  // HEATMAP
  // =======================================================

  const [heatData, setHeatData] =
    useState<HeatItem[]>([]);

  const [heatLoading, setHeatLoading] =
    useState(false);

  const [heatError, setHeatError] =
    useState<string | null>(null);

  // =======================================================
  // COMPARISON
  // =======================================================

  const [cmpCrop1, setCmpCrop1] =
    useState("Onion");

  const [cmpCrop2, setCmpCrop2] =
    useState("Tomato");

  const [cmpMarket1, setCmpMarket1] =
    useState("");

  const [cmpMarket2, setCmpMarket2] =
    useState("");

  const [cmpMarkets1, setCmpMarkets1] =
    useState<string[]>([]);

  const [cmpMarkets2, setCmpMarkets2] =
    useState<string[]>([]);

  const [cmpMarketsLoading1, setCmpMarketsLoading1] =
    useState(false);

  const [cmpMarketsLoading2, setCmpMarketsLoading2] =
    useState(false);

  const [cmpResult, setCmpResult] =
    useState<ComparisonResult | null>(
      null
    );

  const [cmpLoading, setCmpLoading] =
    useState(false);

  const [cmpError, setCmpError] =
    useState<string | null>(null);

  // =======================================================
  // VOICE
  // =======================================================

  const recognitionRef =
    useRef<any>(null);

  const [listening, setListening] =
    useState(false);

  // =======================================================
  // FETCH USER
  // =======================================================

  const fetchUserLocation =
    useCallback(async () => {
      try {
        const token =
          localStorage.getItem(
            "token"
          );

        if (!token) {
          return;
        }

        const response =
          await fetch("/api/user", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

        if (!response.ok) {
          return;
        }

        const json =
          await response.json();

        const resolvedDistrict =
          json?.district ||
          json?.user?.district ||
          json?.data?.district ||
          null;

        if (resolvedDistrict) {
          setUserDistrict(
            resolvedDistrict
          );

          setDistrict(
            resolvedDistrict
          );
        }
      } catch (error) {
        console.error(
          "Failed to fetch user:",
          error
        );
      }
    }, []);

  useEffect(() => {
    fetchUserLocation();
  }, [fetchUserLocation]);

  // =======================================================
  // FETCH MARKET DATA
  // =======================================================

  const fetchData =
    useCallback(async () => {
      setLoading(true);
      setDataError(null);

      try {
        const params =
          new URLSearchParams();

        if (crop !== "all") {
          params.set(
            "crop",
            crop
          );
        }

        if (district !== "all") {
          params.set(
            "district",
            district
          );
        }

        const response =
          await fetch(
            `/api/market-prices?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.message ||
              "Unable to load market prices."
          );
        }

        setData(
          Array.isArray(json.data)
            ? json.data
            : []
        );
      } catch (error: any) {
        console.error(
          "Market prices error:",
          error
        );

        setData([]);

        setDataError(
          error?.message ||
            "Unable to load market prices."
        );
      } finally {
        setLoading(false);
      }
    }, [crop, district]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // =======================================================
  // FETCH HEATMAP
  // =======================================================

  const fetchHeat =
    useCallback(async () => {
      if (crop === "all") {
        setHeatData([]);
        setHeatError(null);
        return;
      }

      setHeatLoading(true);
      setHeatError(null);

      try {
        const response =
          await fetch(
            `/api/heatmap?crop=${encodeURIComponent(
              crop
            )}`,
            {
              cache: "no-store",
            }
          );

        const json =
          await response.json();

        if (
          !response.ok ||
          !json.success
        ) {
          throw new Error(
            json.message ||
              "Unable to load heatmap."
          );
        }

        setHeatData(
          Array.isArray(json.data)
            ? json.data
            : []
        );
      } catch (error: any) {
        console.error(
          "Heatmap error:",
          error
        );

        setHeatData([]);

        setHeatError(
          error?.message ||
            "Unable to load heatmap."
        );
      } finally {
        setHeatLoading(false);
      }
    }, [crop]);

  useEffect(() => {
    fetchHeat();
  }, [fetchHeat]);

  // =======================================================
  // VOICE SEARCH
  // =======================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const SpeechRecognition =
      (window as any)
        .SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      recognitionRef.current =
        null;
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.continuous =
      false;

    recognition.interimResults =
      false;

    recognition.lang =
      lang === "hi"
        ? "hi-IN"
        : lang === "mr"
        ? "mr-IN"
        : "en-IN";

    recognition.onresult =
      (event: any) => {
        const transcript =
          event?.results?.[0]?.[0]
            ?.transcript || "";

        setSearch(transcript);
        setListening(false);
      };

    recognition.onerror =
      () => {
        setListening(false);
      };

    recognition.onend =
      () => {
        setListening(false);
      };

    recognitionRef.current =
      recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore cleanup error.
      }
    };
  }, [lang]);

  function startVoiceSearch() {
    if (!recognitionRef.current) {
      alert(
        "Voice search is not supported in this browser."
      );

      return;
    }

    try {
      setListening(true);
      recognitionRef.current.start();
    } catch {
      setListening(false);
    }
  }

  // =======================================================
  // GET LATEST RECORD PER
  // CROP + MARKET + VARIETY
  //
  // This prevents old duplicate records from flooding
  // the visible market-price section.
  // =======================================================

  const latestRecords =
    useMemo(() => {
      const map =
        new Map<
          string,
          MarketPrice
        >();

      for (const item of data) {
        const key = [
          normalizeText(
            item.crop
          ),
          normalizeText(
            item.market
          ),
          normalizeText(
            item.variety
          ),
        ].join("|");

        const existing =
          map.get(key);

        if (!existing) {
          map.set(
            key,
            item
          );
          continue;
        }

        const currentDate =
          item.date
            ? new Date(
                item.date
              ).getTime()
            : 0;

        const existingDate =
          existing.date
            ? new Date(
                existing.date
              ).getTime()
            : 0;

        if (
          currentDate >
          existingDate
        ) {
          map.set(
            key,
            item
          );
        }
      }

      return Array.from(
        map.values()
      );
    }, [data]);

  // =======================================================
  // FILTER DATA
  // =======================================================

  const filtered =
    useMemo(() => {
      const query =
        normalizeText(search);

      return latestRecords.filter(
        (item) => {
          if (query) {
            const searchable = [
              item.crop,
              item.market,
              item.district,
              item.variety,
            ]
              .map(normalizeText)
              .join(" ");

            if (
              !searchable.includes(
                query
              )
            ) {
              return false;
            }
          }

          if (
            crop !== "all" &&
            normalizeText(
              item.crop
            ) !==
              normalizeText(crop)
          ) {
            return false;
          }

          if (
            district !== "all" &&
            normalizeText(
              item.district
            ) !==
              normalizeText(district)
          ) {
            return false;
          }

          return true;
        }
      );
    }, [
      latestRecords,
      search,
      crop,
      district,
    ]);

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary =
    useMemo(() => {
      const prices =
        filtered
          .map((item) =>
            safeNumber(
              item.currentPrice
            )
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (!prices.length) {
        return {
          average: null,
          lowest: null,
          highest: null,
        };
      }

      return {
        average:
          prices.reduce(
            (sum, price) =>
              sum + price,
            0
          ) / prices.length,

        lowest:
          Math.min(...prices),

        highest:
          Math.max(...prices),
      };
    }, [filtered]);

  // =======================================================
  // AVAILABLE MARKETS
  // =======================================================

  const availableMarkets =
    useMemo(
      () =>
        uniqueStrings(
          filtered.map(
            (item) =>
              item.market
          )
        ),
      [filtered]
    );

  // =======================================================
  // PERSONALIZED MARKET INSIGHT
  //
  // Only compare markets for the same crop.
  // =======================================================

  const personalizedMarket =
    useMemo(() => {
      if (
        crop === "all" ||
        !userDistrict
      ) {
        return null;
      }

      const records =
        latestRecords.filter(
          (item) =>
            normalizeText(
              item.crop
            ) ===
              normalizeText(
                crop
              ) &&
            normalizeText(
              item.district
            ) ===
              normalizeText(
                userDistrict
              ) &&
            safeNumber(
              item.currentPrice
            ) !== null
        );

      if (!records.length) {
        return null;
      }

      return [...records].sort(
        (a, b) =>
          Number(
            b.currentPrice
          ) -
          Number(
            a.currentPrice
          )
      )[0];
    }, [
      crop,
      userDistrict,
      latestRecords,
    ]);

  // =======================================================
  // GAINERS
  // =======================================================

  const gainers =
    useMemo(() => {
      return filtered
        .filter(
          (item) =>
            item.change !== null &&
            Number(
              item.change
            ) > 0
        )
        .sort(
          (a, b) =>
            Number(b.change) -
            Number(a.change)
        )
        .slice(0, 3);
    }, [filtered]);

  // =======================================================
  // DECLINERS
  // =======================================================

  const decliners =
    useMemo(() => {
      return filtered
        .filter(
          (item) =>
            item.change !== null &&
            Number(
              item.change
            ) < 0
        )
        .sort(
          (a, b) =>
            Number(a.change) -
            Number(b.change)
        )
        .slice(0, 3);
    }, [filtered]);

  // =======================================================
  // FETCH COMPARISON MARKET OPTIONS
  // =======================================================

  async function fetchComparisonMarkets(
    selectedCrop: string,
    side: 1 | 2
  ) {
    if (!selectedCrop) {
      return;
    }

    if (side === 1) {
      setCmpMarketsLoading1(
        true
      );
    } else {
      setCmpMarketsLoading2(
        true
      );
    }

    try {
      const params =
        new URLSearchParams();

      params.set(
        "crop",
        selectedCrop
      );

      if (district !== "all") {
        params.set(
          "district",
          district
        );
      }

      const response =
        await fetch(
          `/api/market-prices?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "Unable to load markets."
        );
      }

      const records =
        Array.isArray(json.data)
          ? json.data
          : [];

      const markets =
        uniqueStrings(
          records.map(
            (item: MarketPrice) =>
              item.market
          )
        );

      if (side === 1) {
        setCmpMarkets1(
          markets
        );

        setCmpMarket1(
          (current) => {
            if (
              current &&
              markets.includes(
                current
              )
            ) {
              return current;
            }

            return markets[0] || "";
          }
        );
      } else {
        setCmpMarkets2(
          markets
        );

        setCmpMarket2(
          (current) => {
            if (
              current &&
              markets.includes(
                current
              )
            ) {
              return current;
            }

            return markets[0] || "";
          }
        );
      }
    } catch (error) {
      console.error(
        "Comparison market error:",
        error
      );

      if (side === 1) {
        setCmpMarkets1([]);
        setCmpMarket1("");
      } else {
        setCmpMarkets2([]);
        setCmpMarket2("");
      }
    } finally {
      if (side === 1) {
        setCmpMarketsLoading1(
          false
        );
      } else {
        setCmpMarketsLoading2(
          false
        );
      }
    }
  }

  useEffect(() => {
    fetchComparisonMarkets(
      cmpCrop1,
      1
    );
  }, [cmpCrop1, district]);

  useEffect(() => {
    fetchComparisonMarkets(
      cmpCrop2,
      2
    );
  }, [cmpCrop2, district]);

  // =======================================================
  // FETCH COMPARISON
  // =======================================================

  async function fetchComparison() {
    if (
      !cmpCrop1 ||
      !cmpMarket1 ||
      !cmpCrop2 ||
      !cmpMarket2
    ) {
      setCmpError(
        "Please select both crops and markets."
      );

      return;
    }

    setCmpLoading(true);
    setCmpError(null);
    setCmpResult(null);

    try {
      const params =
        new URLSearchParams();

      params.set(
        "crop1",
        cmpCrop1
      );

      params.set(
        "market1",
        cmpMarket1
      );

      params.set(
        "crop2",
        cmpCrop2
      );

      params.set(
        "market2",
        cmpMarket2
      );

      const response =
        await fetch(
          `/api/compare?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

      const json =
        await response.json();

      if (
        !response.ok ||
        !json.success
      ) {
        throw new Error(
          json.message ||
            "Unable to compare prices."
        );
      }

      setCmpResult(
        json.data || null
      );
    } catch (error: any) {
      console.error(
        "Comparison error:",
        error
      );

      setCmpError(
        error?.message ||
          "Unable to load comparison."
      );
    } finally {
      setCmpLoading(false);
    }
  }

  // =======================================================
  // COMPARISON CHART
  // =======================================================

  const comparisonChart =
    useMemo(() => {
      if (!cmpResult) {
        return null;
      }

      const series1 =
        cmpResult.crop1
          ?.series || [];

      const series2 =
        cmpResult.crop2
          ?.series || [];

      const dates =
        uniqueStrings([
          ...series1.map(
            (item) =>
              item.date
          ),
          ...series2.map(
            (item) =>
              item.date
          ),
        ]).sort();

      if (!dates.length) {
        return null;
      }

      const map1 =
        new Map(
          series1.map(
            (item) => [
              item.date,
              item.avgPrice,
            ]
          )
        );

      const map2 =
        new Map(
          series2.map(
            (item) => [
              item.date,
              item.avgPrice,
            ]
          )
        );

      return {
        labels: dates.map(
          (date) =>
            formatDate(date)
        ),

        datasets: [
          {
            label: `${cmpResult.crop1.commodity} - ${cmpResult.crop1.market}`,

            data: dates.map(
              (date) =>
                map1.get(
                  date
                ) ?? null
            ),

            borderColor:
              "#dc2626",

            backgroundColor:
              "rgba(220,38,38,0.08)",

            tension: 0.3,

            fill: true,

            spanGaps: true,
          },

          {
            label: `${cmpResult.crop2.commodity} - ${cmpResult.crop2.market}`,

            data: dates.map(
              (date) =>
                map2.get(
                  date
                ) ?? null
            ),

            borderColor:
              "#2563eb",

            backgroundColor:
              "rgba(37,99,235,0.08)",

            tension: 0.3,

            fill: true,

            spanGaps: true,
          },
        ],
      };
    }, [cmpResult]);

  // =======================================================
  // HEATMAP PRICE RANGE
  // =======================================================

  const heatRange =
    useMemo(() => {
      const values =
        heatData
          .map((item) =>
            safeNumber(
              item.avg
            )
          )
          .filter(
            (
              value
            ): value is number =>
              value !== null
          );

      if (!values.length) {
        return {
          min: 0,
          max: 0,
        };
      }

      return {
        min: Math.min(
          ...values
        ),
        max: Math.max(
          ...values
        ),
      };
    }, [heatData]);

  function getHeatBackground(
    value: number | null
  ) {
    if (
      value === null ||
      heatRange.max ===
        heatRange.min
    ) {
      return "#60a5fa";
    }

    const ratio =
      (value -
        heatRange.min) /
      (heatRange.max -
        heatRange.min);

    if (ratio >= 0.66) {
      return "#16a34a";
    }

    if (ratio >= 0.33) {
      return "#f59e0b";
    }

    return "#ef4444";
  }

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="min-h-screen bg-[#f7faff] p-6 space-y-10">

      {/* ===================================================
          BACK
      =================================================== */}

      <Button
        variant="outline"
        onClick={() => {
          window.location.href =
            "/dashboard";
        }}
        className="flex items-center gap-2"
      >
        <ArrowLeft size={18} />
        {t("backToDashboard")}
      </Button>

      {/* ===================================================
          LANGUAGE
      =================================================== */}

      <div className="flex gap-2 flex-wrap">

        <Button
          variant={
            lang === "en"
              ? "default"
              : "outline"
          }
          onClick={() =>
            setLang("en")
          }
        >
          English
        </Button>

        <Button
          variant={
            lang === "hi"
              ? "default"
              : "outline"
          }
          onClick={() =>
            setLang("hi")
          }
        >
          हिन्दी
        </Button>

        <Button
          variant={
            lang === "mr"
              ? "default"
              : "outline"
          }
          onClick={() =>
            setLang("mr")
          }
        >
          मराठी
        </Button>

      </div>

      {/* ===================================================
          FILTERS
      =================================================== */}

      <Card className="border-2 border-gray-200 shadow-sm">

        <CardHeader>

          <CardTitle>
            {t(
              "searchMarketPrices"
            )}
          </CardTitle>

          {userDistrict && (
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm">

              <MapPin size={17} />

              <span>
                Showing prices for your
                location:{" "}
                <strong>
                  {userDistrict}
                </strong>
              </span>

            </div>
          )}

        </CardHeader>

        <CardContent className="space-y-6">

          {/* SEARCH */}

          <div className="flex gap-3">

            <Input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder={t(
                "searchCropMarketDistrict"
              )}
              className="bg-white"
            />

            <Button
              variant={
                listening
                  ? "default"
                  : "outline"
              }
              onClick={
                startVoiceSearch
              }
            >
              <Mic
                size={18}
                className={
                  listening
                    ? "animate-pulse"
                    : ""
                }
              />

              <span className="ml-2">
                {t("voice")}
              </span>
            </Button>

          </div>

          {/* FILTER ROW */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Select
              value={district}
              onValueChange={
                setDistrict
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue
                  placeholder={t(
                    "selectDistrict"
                  )}
                />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  {t(
                    "allDistricts"
                  )}
                </SelectItem>

                {DISTRICTS.map(
                  (item) => (
                    <SelectItem
                      value={item}
                      key={item}
                    >
                      {item}
                    </SelectItem>
                  )
                )}

              </SelectContent>
            </Select>

            <Select
              value={crop}
              onValueChange={
                setCrop
              }
            >
              <SelectTrigger className="bg-white">
                <SelectValue
                  placeholder={t(
                    "selectCrop"
                  )}
                />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="all">
                  {t("allCrops")}
                </SelectItem>

                {CROPS.map(
                  (item) => (
                    <SelectItem
                      value={item}
                      key={item}
                    >
                      {item}
                    </SelectItem>
                  )
                )}

              </SelectContent>
            </Select>

            <Button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  {t("loading")}
                </span>
              ) : (
                t("applyFilters")
              )}
            </Button>

          </div>

        </CardContent>
      </Card>

      {/* ===================================================
          ERROR
      =================================================== */}

      {dataError && (
        <Card className="border-red-200 bg-red-50">

          <CardContent className="p-4">

            <div className="flex items-center gap-3 text-red-700">

              <AlertCircle />

              <div className="flex-1">

                <p className="font-semibold">
                  Unable to load market
                  prices
                </p>

                <p className="text-sm mt-1">
                  {dataError}
                </p>

              </div>

              <Button
                variant="outline"
                onClick={
                  fetchData
                }
              >
                Retry
              </Button>

            </div>

          </CardContent>
        </Card>
      )}

      {/* ===================================================
          SUMMARY
      =================================================== */}

      {!loading &&
        filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">
                  Markets found
                </p>

                <p className="text-2xl font-bold mt-1">
                  {
                    availableMarkets.length
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">
                  Average modal price
                </p>

                <p className="text-2xl font-bold mt-1 text-blue-700">
                  {formatPrice(
                    summary.average
                  )}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">
                  Latest available
                </p>

                <p className="text-xl font-bold mt-1">
                  {formatDate(
                    filtered[0]?.date
                  )}
                </p>
              </CardContent>
            </Card>

          </div>
        )}

      {/* ===================================================
          PERSONALIZED MARKET CARD
      =================================================== */}

      {personalizedMarket &&
        crop !== "all" && (
          <Card className="border-2 border-green-200 bg-green-50">

            <CardContent className="p-5">

              <div className="flex items-start gap-4">

                <div className="rounded-full bg-green-100 p-3">
                  <MapPin
                    className="text-green-700"
                    size={24}
                  />
                </div>

                <div className="flex-1">

                  <p className="text-sm font-medium text-green-700">
                    Personalized market
                    insight
                  </p>

                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    Highest available{" "}
                    {crop} modal price
                    in{" "}
                    {userDistrict ||
                      district}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">

                    <div>
                      <p className="text-xs text-gray-500">
                        Market
                      </p>

                      <p className="font-semibold">
                        {
                          personalizedMarket.market
                        }
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Modal price
                      </p>

                      <p className="text-xl font-bold text-green-700">
                        {formatPrice(
                          personalizedMarket.currentPrice
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500">
                        Latest available
                      </p>

                      <p className="font-semibold">
                        {formatDate(
                          personalizedMarket.date
                        )}
                      </p>
                    </div>

                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    This compares available
                    records for the selected
                    crop in your selected
                    district. It is not a
                    guarantee of the price you
                    will receive.
                  </p>

                </div>

              </div>

            </CardContent>
          </Card>
        )}

      {/* ===================================================
          HEATMAP
      =================================================== */}

      <Card className="border-2 border-gray-200 shadow-sm">

        <CardHeader>

          <CardTitle>
            {t(
              "maharashtraPriceHeatmap"
            )}
          </CardTitle>

          {crop !== "all" && (
            <p className="text-sm text-gray-500">
              Latest available modal-price
              observations for{" "}
              <strong>
                {crop}
              </strong>
            </p>
          )}

        </CardHeader>

        <CardContent>

          {crop === "all" ? (
            <div className="p-5 rounded-lg bg-blue-50 text-blue-700">
              Select a crop to view
              Maharashtra district price
              intensity.
            </div>
          ) : heatLoading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <RefreshCw
                size={18}
                className="animate-spin"
              />

              {t("loadingHeatmap")}
            </div>
          ) : heatError ? (
            <div className="p-4 rounded-lg bg-red-50 text-red-700">
              {heatError}
            </div>
          ) : heatData.length === 0 ? (
            <div className="p-5 rounded-lg bg-gray-50 text-gray-500">
              {t("noHeatmapData")}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

              {heatData.map(
                (item, index) => {
                  const avg =
                    safeNumber(
                      item.avg
                    );

                  return (
                    <div
                      key={`${item.district}-${index}`}
                      className="rounded-xl p-4 text-white shadow"
                      style={{
                        backgroundColor:
                          getHeatBackground(
                            avg
                          ),
                      }}
                    >

                      <h3 className="font-semibold">
                        {
                          item.district
                        }
                      </h3>

                      <p className="text-xl font-bold mt-1">
                        {formatPrice(
                          avg
                        )}
                      </p>

                      <p className="text-xs opacity-90 mt-2">
                        {item.marketCount}{" "}
                        markets
                      </p>

                      <p className="text-xs opacity-90">
                        Latest:{" "}
                        {formatDate(
                          item.latestDate
                        )}
                      </p>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </CardContent>
      </Card>

      {/* ===================================================
          COMPARISON
      =================================================== */}

      <Card className="border-2 border-gray-200 shadow-sm">

        <CardHeader>

          <div className="flex items-center gap-2">

            <BarChart2
              size={22}
              className="text-blue-600"
            />

            <CardTitle>
              {t(
                "cropMarketComparison"
              )}
            </CardTitle>

          </div>

          <p className="text-sm text-gray-500">
            Compare actual historical
            Agmarknet modal prices. The
            comparison uses the latest
            date available in the government
            dataset rather than assuming
            today's date.
          </p>

        </CardHeader>

        <CardContent className="space-y-6">

          {/* CROP / MARKET SELECTORS */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* FIRST */}

            <div className="space-y-3">

              <p className="font-semibold">
                First crop
              </p>

              <Select
                value={cmpCrop1}
                onValueChange={(value) => {
                  setCmpCrop1(value);
                  setCmpResult(null);
                  setCmpError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  {CROPS.map(
                    (item) => (
                      <SelectItem
                        key={item}
                        value={item}
                      >
                        {item}
                      </SelectItem>
                    )
                  )}

                </SelectContent>
              </Select>

              <Select
                value={cmpMarket1}
                onValueChange={(value) => {
                  setCmpMarket1(value);
                  setCmpResult(null);
                  setCmpError(null);
                }}
                disabled={
                  cmpMarketsLoading1 ||
                  cmpMarkets1.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      cmpMarketsLoading1
                        ? "Loading markets..."
                        : "Select market"
                    }
                  />
                </SelectTrigger>

                <SelectContent>

                  {cmpMarkets1.map(
                    (market) => (
                      <SelectItem
                        key={market}
                        value={market}
                      >
                        {market}
                      </SelectItem>
                    )
                  )}

                </SelectContent>
              </Select>

            </div>

            {/* SECOND */}

            <div className="space-y-3">

              <p className="font-semibold">
                Second crop
              </p>

              <Select
                value={cmpCrop2}
                onValueChange={(value) => {
                  setCmpCrop2(value);
                  setCmpResult(null);
                  setCmpError(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  {CROPS.map(
                    (item) => (
                      <SelectItem
                        key={item}
                        value={item}
                      >
                        {item}
                      </SelectItem>
                    )
                  )}

                </SelectContent>
              </Select>

              <Select
                value={cmpMarket2}
                onValueChange={(value) => {
                  setCmpMarket2(value);
                  setCmpResult(null);
                  setCmpError(null);
                }}
                disabled={
                  cmpMarketsLoading2 ||
                  cmpMarkets2.length === 0
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      cmpMarketsLoading2
                        ? "Loading markets..."
                        : "Select market"
                    }
                  />
                </SelectTrigger>

                <SelectContent>

                  {cmpMarkets2.map(
                    (market) => (
                      <SelectItem
                        key={market}
                        value={market}
                      >
                        {market}
                      </SelectItem>
                    )
                  )}

                </SelectContent>
              </Select>

            </div>

          </div>

          {/* COMPARE */}

          <Button
            onClick={
              fetchComparison
            }
            disabled={
              cmpLoading ||
              !cmpMarket1 ||
              !cmpMarket2
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {cmpLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
                Loading...
              </span>
            ) : (
              t("compare")
            )}
          </Button>

          {/* ERROR */}

          {cmpError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex gap-3">

              <AlertCircle
                size={20}
              />

              <span>
                {cmpError}
              </span>

            </div>
          )}

          {/* =================================================
              COMPARISON RESULTS
          ================================================= */}

          {cmpResult && (
            <div className="space-y-6">

              {/* RESULT CARDS */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* CROP 1 */}

                <Card className="border-red-200 bg-red-50">

                  <CardContent className="p-5">

                    <div className="flex justify-between">

                      <div>
                        <h3 className="text-xl font-bold text-red-700">
                          {
                            cmpResult.crop1
                              .commodity
                          }
                        </h3>

                        <p className="text-gray-600 mt-1">
                          {
                            cmpResult.crop1
                              .market
                          }
                        </p>
                      </div>

                      <TrendingUp
                        className="text-red-600"
                      />

                    </div>

                    <p className="text-3xl font-bold mt-5">
                      {formatPrice(
                        cmpResult.crop1
                          .latestPrice
                      )}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Latest available:{" "}
                      {formatDate(
                        cmpResult.crop1
                          .latestDate
                      )}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-5">

                      <div>
                        <p className="text-xs text-gray-500">
                          30-day high
                        </p>

                        <p className="font-bold">
                          {formatPrice(
                            cmpResult.crop1
                              .highestPrice
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          30-day low
                        </p>

                        <p className="font-bold">
                          {formatPrice(
                            cmpResult.crop1
                              .lowestPrice
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="mt-4">

                      <p className="text-sm text-gray-600">
                        <strong>
                          {
                            cmpResult.crop1
                              .daysWithData
                          }
                        </strong>{" "}
                        days with available
                        data
                      </p>

                      {cmpResult.crop1
                        .change !== null && (
                        <p
                          className={`font-semibold mt-2 ${changeClass(
                            cmpResult.crop1
                              .change
                          )}`}
                        >
                          {cmpResult.crop1
                            .change > 0
                            ? "+"
                            : ""}
                          {
                            cmpResult.crop1
                              .change
                          }
                          % vs previous
                          available day
                        </p>
                      )}

                    </div>

                  </CardContent>
                </Card>

                {/* CROP 2 */}

                <Card className="border-blue-200 bg-blue-50">

                  <CardContent className="p-5">

                    <div className="flex justify-between">

                      <div>
                        <h3 className="text-xl font-bold text-blue-700">
                          {
                            cmpResult.crop2
                              .commodity
                          }
                        </h3>

                        <p className="text-gray-600 mt-1">
                          {
                            cmpResult.crop2
                              .market
                          }
                        </p>
                      </div>

                      <TrendingUp
                        className="text-blue-600"
                      />

                    </div>

                    <p className="text-3xl font-bold mt-5">
                      {formatPrice(
                        cmpResult.crop2
                          .latestPrice
                      )}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      Latest available:{" "}
                      {formatDate(
                        cmpResult.crop2
                          .latestDate
                      )}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mt-5">

                      <div>
                        <p className="text-xs text-gray-500">
                          30-day high
                        </p>

                        <p className="font-bold">
                          {formatPrice(
                            cmpResult.crop2
                              .highestPrice
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">
                          30-day low
                        </p>

                        <p className="font-bold">
                          {formatPrice(
                            cmpResult.crop2
                              .lowestPrice
                          )}
                        </p>
                      </div>

                    </div>

                    <div className="mt-4">

                      <p className="text-sm text-gray-600">
                        <strong>
                          {
                            cmpResult.crop2
                              .daysWithData
                          }
                        </strong>{" "}
                        days with available
                        data
                      </p>

                      {cmpResult.crop2
                        .change !== null && (
                        <p
                          className={`font-semibold mt-2 ${changeClass(
                            cmpResult.crop2
                              .change
                          )}`}
                        >
                          {cmpResult.crop2
                            .change > 0
                            ? "+"
                            : ""}
                          {
                            cmpResult.crop2
                              .change
                          }
                          % vs previous
                          available day
                        </p>
                      )}

                    </div>

                  </CardContent>
                </Card>

              </div>

              {/* =================================================
                  IMPORTANT DATA STATUS
              ================================================= */}

              {(cmpResult.crop1
                .daysWithData === 0 ||
                cmpResult.crop2
                  .daysWithData === 0) && (
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">

                  <div className="flex gap-3 text-amber-800">

                    <AlertCircle
                      className="mt-0.5"
                    />

                    <div>

                      <p className="font-semibold">
                        Historical data is
                        unavailable for one
                        or both selections.
                      </p>

                      <p className="text-sm mt-1">
                        The selected market
                        may not have enough
                        historical records in
                        the government dataset.
                        Try another market.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* =================================================
                  CHART
              ================================================= */}

              {comparisonChart && (
                <div>

                  <h3 className="font-semibold mb-3">
                    30-day historical price
                    trend
                  </h3>

                  <div className="bg-white border rounded-xl p-4">

                    <Line
                      data={
                        comparisonChart
                      }
                      options={{
                        responsive: true,

                        interaction: {
                          mode: "index",
                          intersect: false,
                        },

                        plugins: {
                          legend: {
                            position:
                              "top",
                          },

                          tooltip: {
                            callbacks: {
                              label:
                                (
                                  context: any
                                ) => {
                                  const value =
                                    context
                                      ?.parsed
                                      ?.y;

                                  return `${context.dataset.label}: ${formatPrice(
                                    value
                                  )}`;
                                },
                            },
                          },
                        },

                        scales: {
                          y: {
                            beginAtZero:
                              false,

                            ticks: {
                              callback:
                                (
                                  value: any
                                ) =>
                                  `₹${Number(
                                    value
                                  ).toLocaleString(
                                    "en-IN"
                                  )}`,
                            },
                          },
                        },
                      }}
                    />

                  </div>

                </div>
              )}

            </div>
          )}

        </CardContent>
      </Card>

      {/* ===================================================
          AVAILABLE MARKET PRICES
      =================================================== */}

      <Card className="border-2 border-gray-200 shadow-sm">

        <CardHeader>

          <CardTitle>
            {t(
              "availableMarketPrices"
            )}
          </CardTitle>

          <p className="text-sm text-gray-500">
            Showing the latest available
            record for each crop, market
            and variety combination.
          </p>

        </CardHeader>

        <CardContent>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">

              <RefreshCw
                size={18}
                className="animate-spin"
              />

              {t("loading")}

            </div>
          ) : filtered.length ===
            0 ? (
            <div className="p-6 rounded-lg bg-gray-50 text-center">

              <AlertCircle
                size={28}
                className="mx-auto text-gray-400 mb-2"
              />

              <p className="font-semibold text-gray-700">
                {t(
                  "noDataForFilters"
                )}
              </p>

              <p className="text-sm text-gray-500 mt-1">
                Try another crop,
                district or search
                term.
              </p>

            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">

              {filtered.map(
                (item, index) => {
                  const change =
                    safeNumber(
                      item.change
                    );

                  return (
                    <Card
                      key={`${item.crop}-${item.market}-${item.variety}-${item.date}-${index}`}
                      className="border shadow-sm hover:shadow-md transition p-4"
                    >

                      <div className="flex justify-between gap-4">

                        <div className="min-w-0">

                          <h3 className="text-xl font-bold">
                            {item.crop}
                          </h3>

                          <Badge
                            variant="outline"
                            className="mt-1"
                          >
                            {
                              item.variety ||
                              "Local"
                            }
                          </Badge>

                          <p className="mt-3 text-gray-600">
                            <strong>
                              Market:
                            </strong>{" "}
                            {item.market}
                          </p>

                          <p className="text-gray-600">
                            <strong>
                              District:
                            </strong>{" "}
                            {item.district}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(
                              item.date
                            )}
                          </p>

                        </div>

                        <div className="text-right shrink-0">

                          <p className="text-2xl font-bold text-blue-700">
                            {formatPrice(
                              item.currentPrice
                            )}
                          </p>

                          <p className="text-sm text-gray-500">
                            Modal price
                          </p>

                          <p className="text-xs text-gray-400">
                            {item.unit ||
                              "Quintal"}
                          </p>

                          {change !==
                            null && (
                            <div
                              className={`flex justify-end items-center gap-1 mt-2 ${changeClass(
                                change
                              )}`}
                            >

                              {changeIcon(
                                change
                              )}

                              <span className="font-semibold">
                                {change >
                                0
                                  ? "+"
                                  : ""}
                                {change.toFixed(
                                  1
                                )}
                                %
                              </span>

                            </div>
                          )}

                        </div>

                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t">

                        <div>
                          <p className="text-xs text-gray-500">
                            Min
                          </p>

                          <p className="font-semibold text-green-700">
                            {formatPrice(
                              item.minPrice
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Modal
                          </p>

                          <p className="font-semibold text-blue-700">
                            {formatPrice(
                              item.modalPrice ??
                                item.currentPrice
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Max
                          </p>

                          <p className="font-semibold text-green-700">
                            {formatPrice(
                              item.maxPrice
                            )}
                          </p>
                        </div>

                      </div>

                      {item.previousPrice !==
                        null &&
                        item.previousPrice !==
                          undefined && (
                          <p className="text-xs text-gray-500 mt-3">
                            Previous available
                            modal price:{" "}
                            <strong>
                              {formatPrice(
                                item.previousPrice
                              )}
                            </strong>
                          </p>
                        )}

                    </Card>
                  );
                }
              )}

            </div>
          )}

        </CardContent>
      </Card>

      {/* ===================================================
          MARKET INSIGHTS
          THIS SECTION NOW ALWAYS HAS USEFUL CONTENT
      =================================================== */}

      <Card className="border-2 border-gray-200 shadow-sm">

        <CardHeader>

          <div className="flex items-center justify-between gap-4">

            <div>

              <CardTitle className="flex items-center gap-2">
                <Activity
                  size={22}
                  className="text-green-700"
                />

                {t(
                  "marketInsights"
                )}
              </CardTitle>

              <p className="text-sm text-gray-500 mt-1">
                Insights are calculated
                from the latest available
                market records.
              </p>

            </div>

            <Badge variant="outline">
              Top 3
            </Badge>

          </div>

        </CardHeader>

        <CardContent>

          {/* =================================================
              CASE 1:
              MOVEMENT DATA EXISTS
          ================================================= */}

          {gainers.length > 0 ||
          decliners.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">

              {/* GAINERS */}

              <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                <h3 className="text-lg font-bold text-green-700 flex items-center gap-2 mb-4">

                  <TrendingUp
                    size={20}
                  />

                  {t(
                    "priceGainers"
                  )}

                </h3>

                {gainers.length ===
                0 ? (
                  <div className="p-4 rounded-lg bg-white text-sm text-gray-500">
                    No positive movement
                    is available in the
                    selected data.
                  </div>
                ) : (
                  <div className="space-y-3">

                    {gainers.map(
                      (
                        item,
                        index
                      ) => {
                        const change =
                          Number(
                            item.change
                          );

                        return (
                          <div
                            key={`${item.crop}-${item.market}-${index}`}
                            className="flex items-center justify-between gap-4 bg-white rounded-lg p-3 shadow-sm"
                          >

                            <div className="min-w-0">

                              <p className="font-semibold">
                                {
                                  item.crop
                                }
                              </p>

                              <p className="text-xs text-gray-500 truncate">
                                Market:{" "}
                                {
                                  item.market
                                }{" "}
                                | District:{" "}
                                {
                                  item.district
                                }
                              </p>

                            </div>

                            <div className="flex items-center gap-1 text-green-700 font-bold shrink-0">

                              <TrendingUp
                                size={17}
                              />

                              +
                              {change.toFixed(
                                1
                              )}
                              %

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

              {/* DECLINERS */}

              <div className="rounded-xl border border-red-200 bg-red-50 p-4">

                <h3 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">

                  <TrendingDown
                    size={20}
                  />

                  {t(
                    "priceDecliners"
                  )}

                </h3>

                {decliners.length ===
                0 ? (
                  <div className="p-4 rounded-lg bg-white text-sm text-gray-500">
                    No negative movement
                    is available in the
                    selected data.
                  </div>
                ) : (
                  <div className="space-y-3">

                    {decliners.map(
                      (
                        item,
                        index
                      ) => {
                        const change =
                          Number(
                            item.change
                          );

                        return (
                          <div
                            key={`${item.crop}-${item.market}-${index}`}
                            className="flex items-center justify-between gap-4 bg-white rounded-lg p-3 shadow-sm"
                          >

                            <div className="min-w-0">

                              <p className="font-semibold">
                                {
                                  item.crop
                                }
                              </p>

                              <p className="text-xs text-gray-500 truncate">
                                Market:{" "}
                                {
                                  item.market
                                }{" "}
                                | District:{" "}
                                {
                                  item.district
                                }
                              </p>

                            </div>

                            <div className="flex items-center gap-1 text-red-700 font-bold shrink-0">

                              <TrendingDown
                                size={17}
                              />

                              {change.toFixed(
                                1
                              )}
                              %

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

            </div>
          ) : (
            /* =================================================
               CASE 2:
               NO MOVEMENT DATA
               
               DON'T LEAVE THE USER WITH AN EMPTY SECTION.
            ================================================= */

            <div className="space-y-5">

              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">

                <div className="flex items-start gap-3">

                  <BarChart2
                    size={22}
                    className="text-blue-700 mt-0.5"
                  />

                  <div>

                    <p className="font-semibold text-blue-800">
                      Current market snapshot
                    </p>

                    <p className="text-sm text-blue-700 mt-1">
                      There is not enough
                      previous-day data to
                      calculate gainers and
                      decliners, so FarmAI is
                      showing the latest
                      available market
                      information instead.
                    </p>

                  </div>

                </div>

              </div>

              {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  <div className="rounded-xl bg-white border p-4">

                    <p className="text-sm text-gray-500">
                      Latest modal price
                    </p>

                    <p className="text-2xl font-bold text-blue-700 mt-1">
                      {formatPrice(
                        filtered[0]
                          ?.currentPrice
                      )}
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      {
                        filtered[0]
                          ?.crop
                      }{" "}
                      ·{" "}
                      {
                        filtered[0]
                          ?.market
                      }
                    </p>

                  </div>

                  <div className="rounded-xl bg-white border p-4">

                    <p className="text-sm text-gray-500">
                      Available range
                    </p>

                    <p className="text-lg font-bold mt-1">
                      {formatPrice(
                        summary.lowest
                      )}{" "}
                      –{" "}
                      {formatPrice(
                        summary.highest
                      )}
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      Across the selected
                      market records
                    </p>

                  </div>

                  <div className="rounded-xl bg-white border p-4">

                    <p className="text-sm text-gray-500">
                      Latest available date
                    </p>

                    <p className="text-lg font-bold mt-1">
                      {formatDate(
                        filtered[0]
                          ?.date
                      )}
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      Source: Agmarknet
                    </p>

                  </div>

                </div>
              ) : (
                <div className="p-5 rounded-lg bg-gray-50 text-gray-500">
                  Select a crop or district
                  to generate market insights.
                </div>
              )}

            </div>
          )}

          {/* =================================================
              FOOTNOTE
          ================================================= */}

          <div className="flex items-start gap-2 mt-5 pt-4 border-t text-xs text-gray-500">

            <AlertCircle
              size={15}
              className="mt-0.5 shrink-0"
            />

            <p>
              Insights are based on the
              currently selected crop,
              district and available
              government market-price
              records. A missing previous
              record means FarmAI will not
              invent a percentage change.
            </p>

          </div>

        </CardContent>
      </Card>

    </div>
  );
}