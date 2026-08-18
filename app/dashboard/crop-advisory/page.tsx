"use client"

import { useEffect, useMemo, useState } from "react"
import jsPDF from "jspdf"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  Droplets,
  Download,
  Gauge,
  Leaf,
  Loader2,
  MapPin,
  Navigation,
  RefreshCw,
  Sprout,
  Sun,
  Thermometer,
  Wind,
  AlertTriangle,
  Tractor,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/i18n/LanguageContext"

const API_BASE = "http://localhost:5000"

type LocationSource = "registered" | "gps" | "manual"

type LocationData = {
  source: LocationSource
  displayName: string
  village: string
  district: string
  state: string
  pincode: string
  latitude: number | null
  longitude: number | null
}

type WeatherDay = {
  date: string
  temp_max: number
  temp_min: number
  precip_mm: number
  pop: number
  windspeed_max: number
  weathercode: number
}

type WeatherData = {
  location: {
    name: string
    latitude: number
    longitude: number
  }
  current: {
    temperature: number
    windspeed: number
    winddirection?: number
    weathercode?: number
    humidity?: number
    time?: string
  } | null
  daily: WeatherDay[]
  advisories?: {
    id: string
    severity: string
    message_en: string
  }[]
}

type SoilReport = {
  _id: string
  testDate?: string
  labName?: string
  processed?: boolean
  location?: {
    state?: string
    district?: string
    village?: string
  }
  soilParameters?: {
    nitrogen?: {
      value?: number
      unit?: string
      status?: string
    }
    phosphorus?: {
      value?: number
      unit?: string
      status?: string
    }
    potassium?: {
      value?: number
      unit?: string
      status?: string
    }
    pH?: {
      value?: number
      status?: string
    }
    electricalConductivity?: {
      value?: number
      unit?: string
      status?: string
    }
    organicCarbon?: {
      value?: number
      unit?: string
      status?: string
    }
  }
  aiAnalysis?: {
    soilType?: string
    overallRating?: string
    soilHealthSummary?: string
  }
}

type MarketRecord = {
  crop: string
  currentPrice: number
  previousPrice?: number | null
  change?: number | null
  market?: string
  district?: string
  state?: string
  date?: string
  unit?: string
}

type CropProfile = {
  name: string
  season: string[]
  preferredSoils: string[]
  waterRequirement: "Low" | "Medium" | "High" | "Very High"
  irrigation: string[]
  temperature: [number, number]
  weeklyRainfall: [number, number]
  preferredStates: string[]
  durationDays: number
  budget: "low" | "medium" | "high"
  risks: string[]
  practicalAdvice: string[]
}

type CropRecommendation = {
  crop: CropProfile
  score: number
  marketPrice: number | null
  marketUnit: string
  marketAvailable: boolean
  reasons: string[]
  risks: string[]
  advice: string[]
}

type AdvisoryResult = {
  recommendations: CropRecommendation[]
  weather: WeatherData
  soil: SoilReport | null
  location: LocationData
  season: string
  farmSize: string
  irrigationType: string
  budget: string
}

const cropProfiles: CropProfile[] = [
  {
    name: "Tomato",
    season: ["kharif", "rabi"],
    preferredSoils: ["loamy", "sandy", "red", "alluvial"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood"],
    temperature: [18, 32],
    weeklyRainfall: [10, 80],
    preferredStates: ["MAHARASHTRA", "KARNATAKA", "ANDHRA PRADESH"],
    durationDays: 90,
    budget: "medium",
    risks: ["Early blight", "Late blight", "Fruit borer", "Excessive rain"],
    practicalAdvice: [
      "Avoid unnecessary spraying immediately before heavy rainfall.",
      "Use drainage in fields during periods of high rainfall.",
    ],
  },
  {
    name: "Onion",
    season: ["rabi", "kharif"],
    preferredSoils: ["loamy", "sandy", "alluvial"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood"],
    temperature: [13, 30],
    weeklyRainfall: [5, 50],
    preferredStates: ["MAHARASHTRA", "KARNATAKA", "GUJARAT"],
    durationDays: 120,
    budget: "medium",
    risks: ["Thrips", "Purple blotch", "Excess moisture near maturity"],
    practicalAdvice: [
      "Avoid excess irrigation close to harvest.",
      "Maintain good field drainage.",
    ],
  },
  {
    name: "Groundnut",
    season: ["kharif", "zaid"],
    preferredSoils: ["sandy", "loamy", "red"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood", "rainfed"],
    temperature: [20, 35],
    weeklyRainfall: [10, 70],
    preferredStates: ["MAHARASHTRA", "GUJARAT", "ANDHRA PRADESH"],
    durationDays: 110,
    budget: "low",
    risks: [
      "Waterlogging",
      "Leaf spot",
      "Aflatoxin risk under poor storage conditions",
    ],
    practicalAdvice: [
      "Avoid prolonged waterlogging.",
      "Monitor moisture carefully during pod formation.",
    ],
  },
  {
    name: "Soybean",
    season: ["kharif"],
    preferredSoils: ["loamy", "black", "red"],
    waterRequirement: "Medium",
    irrigation: ["rainfed", "drip", "sprinkler"],
    temperature: [20, 32],
    weeklyRainfall: [15, 90],
    preferredStates: ["MAHARASHTRA", "MADHYA PRADESH", "RAJASTHAN"],
    durationDays: 100,
    budget: "low",
    risks: ["Stem fly", "Defoliators", "Excess water"],
    practicalAdvice: [
      "Avoid standing water in the field.",
      "Monitor the crop closely during flowering and pod formation.",
    ],
  },
  {
    name: "Maize",
    season: ["kharif", "rabi", "zaid"],
    preferredSoils: ["loamy", "alluvial", "red", "black"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood", "rainfed"],
    temperature: [18, 35],
    weeklyRainfall: [10, 80],
    preferredStates: ["MAHARASHTRA", "KARNATAKA", "BIHAR"],
    durationDays: 100,
    budget: "medium",
    risks: ["Fall armyworm", "Stem borer", "Water stress"],
    practicalAdvice: [
      "Maintain adequate moisture during tasseling and silking.",
      "Monitor for fall armyworm during early crop growth.",
    ],
  },
  {
    name: "Cotton",
    season: ["kharif"],
    preferredSoils: ["black", "loamy", "alluvial"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood", "rainfed"],
    temperature: [21, 35],
    weeklyRainfall: [10, 80],
    preferredStates: ["MAHARASHTRA", "GUJARAT", "TELANGANA"],
    durationDays: 150,
    budget: "high",
    risks: ["Bollworm", "Pink bollworm", "Excessive rainfall"],
    practicalAdvice: [
      "Avoid excessive nitrogen application.",
      "Monitor flowering and boll formation stages carefully.",
    ],
  },
  {
    name: "Rice",
    season: ["kharif"],
    preferredSoils: ["clay", "loamy", "alluvial"],
    waterRequirement: "Very High",
    irrigation: ["flood", "rainfed"],
    temperature: [20, 35],
    weeklyRainfall: [30, 150],
    preferredStates: ["MAHARASHTRA", "WEST BENGAL", "ODISHA"],
    durationDays: 120,
    budget: "high",
    risks: ["Blast", "Stem borer", "Excessive water stress"],
    practicalAdvice: [
      "Maintain suitable water availability during critical growth stages.",
      "Avoid unnecessary pesticide spraying immediately before heavy rainfall.",
    ],
  },
  {
    name: "Wheat",
    season: ["rabi"],
    preferredSoils: ["loamy", "alluvial", "black"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood"],
    temperature: [10, 25],
    weeklyRainfall: [0, 30],
    preferredStates: ["MAHARASHTRA", "PUNJAB", "MADHYA PRADESH"],
    durationDays: 120,
    budget: "medium",
    risks: ["Rust", "Aphids", "Heat during grain filling"],
    practicalAdvice: [
      "Provide irrigation at critical growth stages.",
      "Avoid excessive irrigation near maturity.",
    ],
  },
  {
    name: "Potato",
    season: ["rabi"],
    preferredSoils: ["loamy", "sandy", "alluvial"],
    waterRequirement: "Medium",
    irrigation: ["drip", "sprinkler", "flood"],
    temperature: [15, 25],
    weeklyRainfall: [5, 40],
    preferredStates: ["MAHARASHTRA", "UTTAR PRADESH", "WEST BENGAL"],
    durationDays: 90,
    budget: "medium",
    risks: ["Late blight", "Early blight", "Tuber rot"],
    practicalAdvice: [
      "Avoid excessive moisture around tubers.",
      "Monitor for late blight during humid weather.",
    ],
  },
  {
    name: "Sugarcane",
    season: ["year-round"],
    preferredSoils: ["loamy", "black", "alluvial"],
    waterRequirement: "Very High",
    irrigation: ["drip", "flood", "sprinkler"],
    temperature: [20, 35],
    weeklyRainfall: [20, 120],
    preferredStates: ["MAHARASHTRA", "UTTAR PRADESH", "KARNATAKA"],
    durationDays: 365,
    budget: "high",
    risks: ["Red rot", "Early shoot borer", "Water stress"],
    practicalAdvice: [
      "Ensure reliable irrigation because of the long crop duration.",
      "Use drainage during periods of excessive rainfall.",
    ],
  },
]

function getSeasonFromDate(date: Date) {
  const month = date.getMonth() + 1

  if (month >= 6 && month <= 10) return "kharif"
  if (month === 11 || month === 12 || month === 1 || month === 2) return "rabi"
  if (month >= 3 && month <= 5) return "zaid"

  return "year-round"
}

function formatSeason(season: string) {
  if (season === "kharif") return "Kharif"
  if (season === "rabi") return "Rabi"
  if (season === "zaid") return "Zaid"
  return "Year-round"
}

function formatLocation(location: LocationData) {
  const parts = [
    location.village,
    location.district,
    location.state,
  ].filter(Boolean)

  if (parts.length > 0) return parts.join(", ")

  return location.displayName || "Location unavailable"
}

function normalizeSoil(soil: string) {
  return soil.toLowerCase().trim()
}

function normalizeCropName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function getBudgetRank(budget: string) {
  if (budget === "low") return 1
  if (budget === "medium") return 2
  if (budget === "high") return 3
  return 2
}

function getCurrentDateString() {
  return new Date().toISOString().split("T")[0]
}

function formatDate(dateString?: string) {
  if (!dateString) return "N/A"

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleDateString("en-IN")
}

function weatherCodeText(code?: number) {
  if (code === undefined || code === null) return "Weather"

  if (code === 0) return "Clear"
  if (code >= 1 && code <= 3) return "Partly cloudy"
  if (code >= 45 && code <= 48) return "Fog"
  if (code >= 51 && code <= 57) return "Drizzle"
  if (code >= 61 && code <= 67) return "Rain"
  if (code >= 71 && code <= 77) return "Snow"
  if (code >= 80 && code <= 82) return "Rain showers"
  if (code >= 95) return "Thunderstorm"

  return "Variable"
}

function buildLocationFromAddress(
  source: LocationSource,
  latitude: number | null,
  longitude: number | null,
  address: any,
  fallbackName = ""
): LocationData {
  const village =
    address?.village ||
    address?.town ||
    address?.city ||
    address?.municipality ||
    address?.suburb ||
    ""

  const district =
    address?.state_district ||
    address?.district ||
    address?.county ||
    ""

  const state = address?.state || ""

  const pincode = address?.postcode || ""

  const displayParts = [village, district, state].filter(Boolean)

  return {
    source,
    displayName: displayParts.join(", ") || fallbackName || "Selected location",
    village,
    district,
    state,
    pincode,
    latitude,
    longitude,
  }
}

export default function CropAdvisoryPage() {
  const { t } = useLanguage()

  const [locationSource, setLocationSource] =
    useState<LocationSource>("registered")

  const [location, setLocation] = useState<LocationData>({
    source: "registered",
    displayName: "",
    village: "",
    district: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
  })

  const [manualLocation, setManualLocation] = useState("")

  const [soilType, setSoilType] = useState("sandy")
  const [season, setSeason] = useState("auto")
  const [farmSize, setFarmSize] = useState("")
  const [irrigationType, setIrrigationType] = useState("flood")
  const [budget, setBudget] = useState("medium")

  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [registeredLoaded, setRegisteredLoaded] = useState(false)
  const [registeredLocation, setRegisteredLocation] =
    useState<LocationData | null>(null)

  const [advisory, setAdvisory] = useState<AdvisoryResult | null>(null)
  const [error, setError] = useState("")

  const selectedSeason =
    season === "auto"
      ? getSeasonFromDate(new Date())
      : season

  /*
   * ---------------------------------------------------------
   * LOAD REGISTERED FARM LOCATION
   * ---------------------------------------------------------
   */
  useEffect(() => {
    loadRegisteredLocation()
  }, [])

  async function loadRegisteredLocation() {
    try {
      setRegisteredLoaded(false)

      const token = localStorage.getItem("token")

      let profile: any = null

      if (token) {
        try {
          const response = await fetch(`${API_BASE}/api/profile`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const json = await response.json()
            profile = json?.data || json?.user || json
          }
        } catch {
          // Continue to fallback
        }

        if (!profile) {
          try {
            const response = await fetch(`${API_BASE}/api/user/profile`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const json = await response.json()
              profile = json?.data || json?.user || json
            }
          } catch {
            // Continue to localStorage fallback
          }
        }
      }

      if (!profile) {
        const localUser =
          localStorage.getItem("user") ||
          localStorage.getItem("currentUser")

        if (localUser) {
          try {
            profile = JSON.parse(localUser)
          } catch {
            profile = null
          }
        }
      }

      if (profile) {
        const farmLocation =
          profile.farmLocation ||
          profile.location ||
          ""

        const village =
          profile.village ||
          ""

        const district =
          profile.district ||
          ""

        const state =
          profile.state ||
          ""

        const pincode =
          profile.pincode ||
          ""

        const latitude =
          Number(profile.latitude) || null

        const longitude =
          Number(profile.longitude) || null

        const registered: LocationData = {
          source: "registered",
          displayName:
            [village, district, state]
              .filter(Boolean)
              .join(", ") ||
            farmLocation ||
            "Registered Farm",

          village,
          district,
          state,
          pincode,
          latitude,
          longitude,
        }

        setRegisteredLocation(registered)

        if (locationSource === "registered") {
          setLocation(registered)
        }
      }
    } catch (err) {
      console.error("Failed to load registered location:", err)
    } finally {
      setRegisteredLoaded(true)
    }
  }

  /*
   * ---------------------------------------------------------
   * REVERSE GEOCODING
   * ---------------------------------------------------------
   */
  async function reverseGeocode(
    latitude: number,
    longitude: number,
    source: LocationSource
  ) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error("Unable to identify the selected location")
    }

    const data = await response.json()

    return buildLocationFromAddress(
      source,
      latitude,
      longitude,
      data.address,
      data.display_name
    )
  }

  /*
   * ---------------------------------------------------------
   * CURRENT GPS
   * ---------------------------------------------------------
   */
  async function useCurrentLocation() {
    setError("")

    if (!navigator.geolocation) {
      setError("GPS is not supported by this browser.")
      return
    }

    setIsGettingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude
          const longitude = position.coords.longitude

          const resolved = await reverseGeocode(
            latitude,
            longitude,
            "gps"
          )

          setLocationSource("gps")
          setLocation(resolved)
        } catch (err: any) {
          console.error(err)

          setError(
            "GPS was detected, but the exact location name could not be identified."
          )

          setLocation({
            source: "gps",
            displayName: "Current GPS Location",
            village: "",
            district: "",
            state: "",
            pincode: "",
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        } finally {
          setIsGettingLocation(false)
        }
      },
      (err) => {
        console.error(err)

        setIsGettingLocation(false)

        if (err.code === 1) {
          setError(
            "Location permission was denied. Please allow location access in your browser."
          )
        } else {
          setError("Unable to get your current location.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    )
  }

  /*
   * ---------------------------------------------------------
   * MANUAL LOCATION
   * ---------------------------------------------------------
   */
  async function resolveManualLocation() {
    const query = manualLocation.trim()

    if (!query) {
      setError("Please enter a village, district or city.")
      return
    }

    setError("")
    setIsGettingLocation(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          query
        )}&limit=1&addressdetails=1`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      )

      if (!response.ok) {
        throw new Error("Location search failed")
      }

      const data = await response.json()

      if (!data?.length) {
        throw new Error("Location not found")
      }

      const result = data[0]

      const resolved = buildLocationFromAddress(
        "manual",
        Number(result.lat),
        Number(result.lon),
        result.address,
        result.display_name
      )

      setLocationSource("manual")
      setLocation(resolved)
    } catch (err) {
      console.error(err)
      setError(
        "Location could not be found. Try entering a village, district or city name."
      )
    } finally {
      setIsGettingLocation(false)
    }
  }

  /*
   * ---------------------------------------------------------
   * LOCATION SOURCE
   * ---------------------------------------------------------
   */
  function selectLocationSource(source: LocationSource) {
    setError("")
    setLocationSource(source)

    if (source === "registered") {
      if (registeredLocation) {
        setLocation(registeredLocation)
      }
      return
    }

    if (source === "gps") {
      useCurrentLocation()
      return
    }

    setLocation({
      source: "manual",
      displayName: "",
      village: "",
      district: "",
      state: "",
      pincode: "",
      latitude: null,
      longitude: null,
    })
  }

  /*
   * ---------------------------------------------------------
   * WEATHER
   * ---------------------------------------------------------
   */
  async function fetchWeather(): Promise<WeatherData> {
    if (
      location.latitude === null ||
      location.longitude === null
    ) {
      throw new Error(
        "Valid coordinates are required for weather analysis."
      )
    }

    const url =
      `${API_BASE}/api/backend-weather/weather` +
      `?lat=${location.latitude}` +
      `&lon=${location.longitude}` +
      `&days=7`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Unable to fetch weather information.")
    }

    const data = await response.json()

    if (data.status === "error") {
      throw new Error(
        data.message || "Weather service failed."
      )
    }

    /*
     * The existing backend returns current weather but not
     * current humidity. We fetch humidity directly from
     * Open-Meteo so the advisory can display it.
     */
    try {
      const humidityResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
      )

      if (humidityResponse.ok) {
        const humidityData = await humidityResponse.json()

        data.current = {
          ...(data.current || {}),
          temperature:
            humidityData.current?.temperature_2m ??
            data.current?.temperature ??
            0,

          humidity:
            humidityData.current?.relative_humidity_2m ??
            null,

          windspeed:
            humidityData.current?.wind_speed_10m ??
            data.current?.windspeed ??
            0,

          weathercode:
            humidityData.current?.weather_code ??
            data.current?.weathercode ??
            0,

          time:
            humidityData.current?.time ??
            data.current?.time,
        }
      }
    } catch {
      // Existing backend weather remains usable.
    }

    return data
  }

  /*
   * ---------------------------------------------------------
   * SOIL REPORT
   * ---------------------------------------------------------
   */
  async function fetchLatestSoilReport(): Promise<SoilReport | null> {
    const token = localStorage.getItem("token")

    if (!token) return null

    try {
      const response = await fetch(
        `${API_BASE}/api/soil-report/my-reports`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      const reports: SoilReport[] =
        data.reports || data.data || []

      const processedReports = reports
        .filter((report) => report.processed)
        .sort((a, b) => {
          const dateA = new Date(
            a.testDate || 0
          ).getTime()

          const dateB = new Date(
            b.testDate || 0
          ).getTime()

          return dateB - dateA
        })

      return processedReports[0] || null
    } catch (err) {
      console.error("Soil report fetch error:", err)
      return null
    }
  }

  /*
   * ---------------------------------------------------------
   * MARKET DATA
   * ---------------------------------------------------------
   */
  async function fetchMarketData(): Promise<MarketRecord[]> {
    /*
     * Current backend marketPrices route is limited to
     * Maharashtra. Therefore only use it for Maharashtra.
     */
    if (
      !location.state ||
      location.state.toUpperCase() !== "MAHARASHTRA"
    ) {
      return []
    }

    const district = location.district?.trim()

    if (!district) {
      return []
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/market-prices?district=${encodeURIComponent(
          district
        )}&crop=all`
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()

      return data.data || []
    } catch (err) {
      console.error("Market data error:", err)
      return []
    }
  }

  /*
   * ---------------------------------------------------------
   * CROP SCORING
   * ---------------------------------------------------------
   */
  function calculateCropRecommendation(
    crop: CropProfile,
    weather: WeatherData,
    soil: SoilReport | null,
    marketRecords: MarketRecord[]
  ): CropRecommendation {
    let score = 0
    const reasons: string[] = []
    const risks = [...crop.risks]
    const advice = [...crop.practicalAdvice]

    /*
     * 1. Season — 20 points
     */
    if (
      crop.season.includes(selectedSeason) ||
      crop.season.includes("year-round")
    ) {
      score += 20

      reasons.push(
        `${crop.name} is compatible with the ${formatSeason(
          selectedSeason
        )} season.`
      )
    } else {
      score += 4

      reasons.push(
        `${crop.name} is normally grown in ${crop.season
          .map(formatSeason)
          .join(" / ")}, not primarily in the selected ${formatSeason(
          selectedSeason
        )} season.`
      )
    }

    /*
     * 2. Soil — 20 points
     */
    const selectedSoil = normalizeSoil(soilType)

    const reportSoil =
      soil?.aiAnalysis?.soilType
        ? normalizeSoil(soil.aiAnalysis.soilType)
        : ""

    const soilMatches =
      crop.preferredSoils.includes(selectedSoil) ||
      (reportSoil &&
        crop.preferredSoils.some(
          (s) =>
            reportSoil.includes(s) ||
            s.includes(reportSoil)
        ))

    if (soilMatches) {
      score += 20

      reasons.push(
        `${selectedSoil} soil is suitable for ${crop.name}.`
      )
    } else {
      score += 7

      reasons.push(
        `${selectedSoil} soil is not the primary preferred soil for ${crop.name}.`
      )
    }

    /*
     * 3. Temperature — 15 points
     */
    const currentTemperature =
      weather.current?.temperature ?? null

    const forecastTemps =
      weather.daily?.map((d) => d.temp_max).filter(
        (v) => typeof v === "number"
      ) || []

    const averageTemperature =
      currentTemperature !== null
        ? currentTemperature
        : forecastTemps.length
        ? forecastTemps.reduce(
            (a, b) => a + b,
            0
          ) / forecastTemps.length
        : null

    if (averageTemperature !== null) {
      const [minTemp, maxTemp] = crop.temperature

      if (
        averageTemperature >= minTemp &&
        averageTemperature <= maxTemp
      ) {
        score += 15

        reasons.push(
          `The current/forecast temperature is within the preferred range for ${crop.name}.`
        )
      } else {
        score += 6

        reasons.push(
          `The forecast temperature is outside the preferred range for ${crop.name}.`
        )
      }
    } else {
      score += 7

      reasons.push(
        "Temperature information was limited during scoring."
      )
    }

    /*
     * 4. Rainfall — 10 points
     */
    const weeklyRainfall =
      weather.daily?.reduce(
        (sum, day) =>
          sum + (Number(day.precip_mm) || 0),
        0
      ) || 0

    const [rainMin, rainMax] =
      crop.weeklyRainfall

    if (
      weeklyRainfall >= rainMin &&
      weeklyRainfall <= rainMax
    ) {
      score += 10

      reasons.push(
        `The 7-day rainfall outlook is broadly suitable for ${crop.name}.`
      )
    } else if (weeklyRainfall < rainMin) {
      score += 6

      reasons.push(
        `Forecast rainfall may be lower than the preferred range for ${crop.name}; irrigation availability becomes important.`
      )
    } else {
      score += 5

      reasons.push(
        `Forecast rainfall is relatively high for ${crop.name}; drainage should be monitored.`
      )
    }

    /*
     * 5. Irrigation — 10 points
     */
    const irrigationCompatible =
      crop.irrigation.includes(irrigationType)

    if (irrigationCompatible) {
      score += 10

      reasons.push(
        `The ${formatIrrigation(
          irrigationType
        )} irrigation method is compatible with ${crop.name}.`
      )
    } else {
      score += 4

      reasons.push(
        `The selected irrigation method may not be ideal for ${crop.name}.`
      )
    }

    /*
     * 6. Region — 10 points
     */
    const stateUpper =
      location.state?.toUpperCase() || ""

    if (
      stateUpper &&
      crop.preferredStates.includes(stateUpper)
    ) {
      score += 10

      reasons.push(
        `${crop.name} is commonly cultivated in ${stateUpper}.`
      )
    } else {
      score += 6

      reasons.push(
        `Regional suitability data for ${crop.name} is limited for ${stateUpper || "the selected state"}.`
      )
    }

    /*
     * 7. Market — 10 points
     */
    const marketMatches = marketRecords.filter(
      (record) =>
        normalizeCropName(record.crop || "") ===
        normalizeCropName(crop.name)
    )

    let marketPrice: number | null = null
    let marketUnit = "Quintal"

    if (marketMatches.length > 0) {
      const validPrices = marketMatches
        .map((record) => Number(record.currentPrice))
        .filter((price) => price > 0)

      if (validPrices.length > 0) {
        marketPrice =
          validPrices.reduce(
            (a, b) => a + b,
            0
          ) / validPrices.length

        marketUnit =
          marketMatches[0].unit ||
          "Quintal"

        score += 10

        reasons.push(
          `Recent market data is available for ${crop.name}.`
        )
      } else {
        score += 5
      }
    } else {
      score += 5

      reasons.push(
        `Market data is currently unavailable for ${crop.name}.`
      )
    }

    /*
     * 8. Budget — 5 points
     */
    const farmerBudget = getBudgetRank(budget)
    const cropBudget = getBudgetRank(crop.budget)

    if (farmerBudget >= cropBudget) {
      score += 5

      reasons.push(
        `The selected budget is broadly suitable for ${crop.name}.`
      )
    } else {
      score += 2

      reasons.push(
        `${crop.name} may require a higher investment than the selected budget.`
      )
    }

    /*
     * Soil deficiencies from the latest report.
     */
    const nitrogen =
      soil?.soilParameters?.nitrogen?.value

    const phosphorus =
      soil?.soilParameters?.phosphorus?.value

    const potassium =
      soil?.soilParameters?.potassium?.value

    if (
      nitrogen !== undefined &&
      nitrogen !== null &&
      nitrogen < 50
    ) {
      risks.push("Low nitrogen in latest soil report")
    }

    if (
      phosphorus !== undefined &&
      phosphorus !== null &&
      phosphorus < 30
    ) {
      risks.push("Low phosphorus in latest soil report")
    }

    if (
      potassium !== undefined &&
      potassium !== null &&
      potassium < 120
    ) {
      risks.push("Low potassium in latest soil report")
    }

    /*
     * Weather warnings.
     */
    weather.daily?.forEach((day) => {
      if (
        day.pop >= 70 ||
        day.precip_mm >= 20
      ) {
        if (!risks.includes("Heavy rainfall")) {
          risks.push("Heavy rainfall")
        }
      }

      if (day.windspeed_max >= 40) {
        if (!risks.includes("Strong winds")) {
          risks.push("Strong winds")
        }
      }
    })

    /*
     * Limit score.
     */
    score = Math.max(
      0,
      Math.min(100, Math.round(score))
    )

    return {
      crop,
      score,
      marketPrice,
      marketUnit,
      marketAvailable: marketPrice !== null,
      reasons,
      risks: Array.from(new Set(risks)),
      advice: Array.from(new Set(advice)),
    }
  }

  function formatIrrigation(value: string) {
    const map: Record<string, string> = {
      drip: "drip",
      sprinkler: "sprinkler",
      flood: "flood",
      rainfed: "rainfed",
    }

    return map[value] || value
  }

  /*
   * ---------------------------------------------------------
   * ANALYZE
   * ---------------------------------------------------------
   */
  async function handleAnalyze() {
    setError("")

    if (
      !location.latitude ||
      !location.longitude
    ) {
      setError(
        "Please select a valid location first. Registered Farm must have saved coordinates, or use Current GPS / Manual Location."
      )
      return
    }

    if (!soilType) {
      setError("Please select the soil type.")
      return
    }

    setIsAnalyzing(true)
    setAdvisory(null)

    try {
      const [
        weather,
        soil,
        marketRecords,
      ] = await Promise.all([
        fetchWeather(),
        fetchLatestSoilReport(),
        fetchMarketData(),
      ])

      const recommendations =
        cropProfiles
          .map((crop) =>
            calculateCropRecommendation(
              crop,
              weather,
              soil,
              marketRecords
            )
          )
          .sort(
            (a, b) => b.score - a.score
          )

      const result: AdvisoryResult = {
        recommendations,
        weather,
        soil,
        location,
        season: selectedSeason,
        farmSize,
        irrigationType,
        budget,
      }

      setAdvisory(result)

      /*
       * Log activity.
       */
      try {
        const token =
          localStorage.getItem("token")

        if (token) {
          await fetch(
            `${API_BASE}/api/activities/log`,
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                activityType:
                  "crop-advisory",
                title:
                  `Crop Advisory - ${formatLocation(
                    location
                  )}`,
                description:
                  `Generated crop recommendations for ${formatLocation(
                    location
                  )}`,
                status: "completed",
                result:
                  recommendations.length > 0
                    ? `Top recommendation: ${recommendations[0].crop.name} (${recommendations[0].score}%)`
                    : "Recommendations generated",
                metadata: {
                  location:
                    formatLocation(location),
                  locationSource:
                    location.source,
                  state:
                    location.state,
                  district:
                    location.district,
                  season:
                    selectedSeason,
                  soilType,
                  farmSize,
                  irrigationType,
                  budget,
                  topCrop:
                    recommendations[0]
                      ?.crop.name || "",
                  topScore:
                    recommendations[0]
                      ?.score || 0,
                },
              }),
            }
          )
        }
      } catch (activityError) {
        console.warn(
          "Activity logging failed:",
          activityError
        )
      }
    } catch (err: any) {
      console.error(
        "Crop advisory error:",
        err
      )

      setError(
        err?.message ||
          "Unable to generate crop advisory."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  /*
   * ---------------------------------------------------------
   * PDF HELPERS
   * ---------------------------------------------------------
   */
  function pdfAddWrappedText(
    doc: jsPDF,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize = 10,
    lineHeight = 5
  ) {
    doc.setFontSize(fontSize)

    const lines = doc.splitTextToSize(
      text,
      maxWidth
    )

    doc.text(lines, x, y)

    return y + lines.length * lineHeight
  }

  function pdfEnsureSpace(
    doc: jsPDF,
    y: number,
    required = 20
  ) {
    if (y + required > 275) {
      doc.addPage()
      return 20
    }

    return y
  }

  function pdfSectionTitle(
    doc: jsPDF,
    title: string,
    y: number
  ) {
    y = pdfEnsureSpace(doc, y, 15)

    doc.setFontSize(15)
    doc.setFont("helvetica", "bold")
    doc.text(title, 15, y)

    doc.setLineWidth(0.5)
    doc.line(15, y + 3, 195, y + 3)

    return y + 12
  }

  /*
   * ---------------------------------------------------------
   * GENERATE PDF
   * ---------------------------------------------------------
   */
  async function downloadPdf() {
    if (!advisory) return

    setIsGeneratingPdf(true)

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = 210
      const margin = 15
      const contentWidth =
        pageWidth - margin * 2

      let y = 20

      /*
       * Header
       */
      doc.setFont("helvetica", "bold")
      doc.setFontSize(25)
      doc.text("FarmAI", margin, y)

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text(
        "Smart Crop Advisory Report",
        margin,
        y + 8
      )

      doc.setFontSize(9)
      doc.text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        margin,
        y + 15
      )

      doc.setLineWidth(0.8)
      doc.line(
        margin,
        y + 19,
        pageWidth - margin,
        y + 19
      )

      y += 30

      /*
       * Location
       */
      y = pdfSectionTitle(
        doc,
        "Advisory Location",
        y
      )

      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text(
        "Location:",
        margin,
        y
      )

      doc.setFont("helvetica", "normal")
      doc.text(
        formatLocation(advisory.location),
        45,
        y
      )

      y += 7

      doc.setFont("helvetica", "bold")
      doc.text(
        "Location Source:",
        margin,
        y
      )

      doc.setFont("helvetica", "normal")
      doc.text(
        advisory.location.source ===
          "registered"
          ? "Registered Farm"
          : advisory.location.source ===
            "gps"
          ? "Current GPS"
          : "Manual Selection",
        50,
        y
      )

      y += 7

      if (advisory.location.district) {
        doc.setFont("helvetica", "bold")
        doc.text(
          "District:",
          margin,
          y
        )

        doc.setFont("helvetica", "normal")
        doc.text(
          advisory.location.district,
          45,
          y
        )

        y += 7
      }

      if (advisory.location.state) {
        doc.setFont("helvetica", "bold")
        doc.text(
          "State:",
          margin,
          y
        )

        doc.setFont("helvetica", "normal")
        doc.text(
          advisory.location.state,
          45,
          y
        )

        y += 7
      }

      if (
        advisory.location.latitude !==
          null &&
        advisory.location.longitude !==
          null
      ) {
        doc.setFont("helvetica", "bold")
        doc.text(
          "Coordinates:",
          margin,
          y
        )

        doc.setFont("helvetica", "normal")
        doc.text(
          `${advisory.location.latitude.toFixed(
            6
          )}, ${advisory.location.longitude.toFixed(
            6
          )}`,
          45,
          y
        )

        y += 7
      }

      /*
       * Farm information
       */
      y += 4

      y = pdfSectionTitle(
        doc,
        "Farm Information",
        y
      )

      const farmRows = [
        [
          "Season",
          formatSeason(advisory.season),
        ],
        [
          "Soil Type",
          soilType,
        ],
        [
          "Farm Size",
          farmSize
            ? `${farmSize} acres`
            : "Not specified",
        ],
        [
          "Irrigation",
          formatIrrigation(
            irrigationType
          ),
        ],
        [
          "Budget",
          budget === "low"
            ? "Low"
            : budget === "medium"
            ? "₹50,000 – ₹1,00,000"
            : "High",
        ],
      ]

      doc.setFontSize(10)

      farmRows.forEach(([label, value]) => {
        y = pdfEnsureSpace(
          doc,
          y,
          10
        )

        doc.setFont(
          "helvetica",
          "bold"
        )
        doc.text(
          label,
          margin,
          y
        )

        doc.setFont(
          "helvetica",
          "normal"
        )
        doc.text(
          value,
          60,
          y
        )

        y += 6
      })

      /*
       * Weather
       */
      y += 5

      y = pdfSectionTitle(
        doc,
        "Weather Insights",
        y
      )

      const current =
        advisory.weather.current

      if (current) {
        const weatherText =
          `Temperature: ${
            current.temperature?.toFixed(1) ||
            "N/A"
          }°C   ` +
          `Humidity: ${
            current.humidity !== null &&
            current.humidity !== undefined
              ? `${current.humidity}%`
              : "N/A"
          }   ` +
          `Wind: ${
            current.windspeed?.toFixed(1) ||
            "N/A"
          } km/h`

        y = pdfAddWrappedText(
          doc,
          weatherText,
          margin,
          y,
          contentWidth,
          10,
          5
        )

        y += 5
      }

      doc.setFont(
        "helvetica",
        "bold"
      )
      doc.setFontSize(11)
      doc.text(
        "7-Day Forecast",
        margin,
        y
      )

      y += 7

      advisory.weather.daily
        .slice(0, 7)
        .forEach((day) => {
          y = pdfEnsureSpace(
            doc,
            y,
            12
          )

          const date =
            new Date(
              day.date
            ).toLocaleDateString(
              "en-IN",
              {
                day: "2-digit",
                month: "short",
              }
            )

          doc.setFont(
            "helvetica",
            "normal"
          )
          doc.setFontSize(9)

          doc.text(
            `${date}: ${day.temp_max}°C / ${day.temp_min}°C | ${day.precip_mm} mm rain | ${day.pop}% rain chance`,
            margin,
            y
          )

          y += 5
        })

      /*
       * Soil
       */
      y += 5

      y = pdfSectionTitle(
        doc,
        "Soil Information",
        y
      )

      if (advisory.soil) {
        const soil = advisory.soil

        y = pdfAddWrappedText(
          doc,
          `Latest processed soil report available. Test date: ${formatDate(
            soil.testDate
          )}.`,
          margin,
          y,
          contentWidth
        )

        y += 4

        const soilParams = [
          [
            "Nitrogen",
            soil.soilParameters?.nitrogen
              ?.value != null
              ? `${soil.soilParameters.nitrogen.value} ${soil.soilParameters.nitrogen.unit || ""}`
              : "N/A",
          ],
          [
            "Phosphorus",
            soil.soilParameters?.phosphorus
              ?.value != null
              ? `${soil.soilParameters.phosphorus.value} ${soil.soilParameters.phosphorus.unit || ""}`
              : "N/A",
          ],
          [
            "Potassium",
            soil.soilParameters?.potassium
              ?.value != null
              ? `${soil.soilParameters.potassium.value} ${soil.soilParameters.potassium.unit || ""}`
              : "N/A",
          ],
          [
            "pH",
            soil.soilParameters?.pH
              ?.value != null
              ? String(
                  soil.soilParameters.pH.value
                )
              : "N/A",
          ],
          [
            "Organic Carbon",
            soil.soilParameters?.organicCarbon
              ?.value != null
              ? `${soil.soilParameters.organicCarbon.value} ${soil.soilParameters.organicCarbon.unit || ""}`
              : "N/A",
          ],
        ]

        soilParams.forEach(
          ([label, value]) => {
            y = pdfEnsureSpace(
              doc,
              y,
              8
            )

            doc.setFont(
              "helvetica",
              "bold"
            )
            doc.text(
              label,
              margin,
              y
            )

            doc.setFont(
              "helvetica",
              "normal"
            )
            doc.text(
              value,
              55,
              y
            )

            y += 6
          }
        )
      } else {
        y = pdfAddWrappedText(
          doc,
          "No processed soil report was available at the time of analysis. The recommendation therefore uses the selected soil type.",
          margin,
          y,
          contentWidth
        )
      }

      /*
       * Top recommendation
       */
      y += 6

      y = pdfSectionTitle(
        doc,
        "Recommended Crops",
        y
      )

      advisory.recommendations.forEach(
        (recommendation, index) => {
          y = pdfEnsureSpace(
            doc,
            y,
            45
          )

          doc.setFont(
            "helvetica",
            "bold"
          )
          doc.setFontSize(14)

          doc.text(
            `${index + 1}. ${
              recommendation.crop.name
            } — ${
              recommendation.score
            }% suitability`,
            margin,
            y
          )

          y += 7

          doc.setFont(
            "helvetica",
            "normal"
          )
          doc.setFontSize(10)

          doc.text(
            `Season: ${recommendation.crop.season
              .map(formatSeason)
              .join(" / ")} | Duration: ${
              recommendation.crop
                .durationDays
            } days`,
            margin,
            y
          )

          y += 6

          doc.text(
            `Water requirement: ${recommendation.crop.waterRequirement}`,
            margin,
            y
          )

          y += 6

          if (
            recommendation.marketAvailable &&
            recommendation.marketPrice !==
              null
          ) {
            doc.text(
              `Market price: ₹${Math.round(
                recommendation.marketPrice
              )} / ${
                recommendation.marketUnit
              }`,
              margin,
              y
            )
          } else {
            doc.text(
              "Market price: Data unavailable",
              margin,
              y
            )
          }

          y += 8

          doc.setFont(
            "helvetica",
            "bold"
          )
          doc.text(
            "Why recommended:",
            margin,
            y
          )

          y += 5

          recommendation.reasons
            .slice(0, 7)
            .forEach((reason) => {
              y = pdfEnsureSpace(
                doc,
                y,
                8
              )

              y = pdfAddWrappedText(
                doc,
                `• ${reason}`,
                margin + 3,
                y,
                contentWidth - 3,
                9,
                4.5
              )
            })

          y += 3

          doc.setFont(
            "helvetica",
            "bold"
          )
          doc.text(
            "Practical advice:",
            margin,
            y
          )

          y += 5

          recommendation.advice
            .slice(0, 3)
            .forEach((advice) => {
              y = pdfEnsureSpace(
                doc,
                y,
                8
              )

              y = pdfAddWrappedText(
                doc,
                `• ${advice}`,
                margin + 3,
                y,
                contentWidth - 3,
                9,
                4.5
              )
            })

          y += 3

          doc.setFont(
            "helvetica",
            "bold"
          )
          doc.text(
            "Important risks:",
            margin,
            y
          )

          y += 5

          y = pdfAddWrappedText(
            doc,
            recommendation.risks.join(
              " • "
            ),
            margin + 3,
            y,
            contentWidth - 3,
            9,
            4.5
          )

          y += 8

          doc.line(
            margin,
            y,
            pageWidth - margin,
            y
          )

          y += 8
        }
      )

      /*
       * Disclaimer
       */
      y = pdfEnsureSpace(
        doc,
        y,
        40
      )

      y = pdfSectionTitle(
        doc,
        "Important Note",
        y
      )

      y = pdfAddWrappedText(
        doc,
        "This FarmAI recommendation is a decision-support result generated from the available location, weather, soil, season, irrigation, farm and market information. Weather and market values can change. Farmers should consider local agricultural conditions and consult a qualified agricultural expert before making major cultivation or financial decisions.",
        margin,
        y,
        contentWidth,
        9,
        4.5
      )

      y += 10

      doc.setFont(
        "helvetica",
        "bold"
      )
      doc.setFontSize(10)
      doc.text(
        "FarmAI — AI-Driven Smart Agriculture System",
        margin,
        y
      )

      /*
       * Footer on every page.
       */
      const totalPages =
        doc.getNumberOfPages()

      for (
        let page = 1;
        page <= totalPages;
        page++
      ) {
        doc.setPage(page)

        doc.setFont(
          "helvetica",
          "normal"
        )
        doc.setFontSize(8)

        doc.text(
          `FarmAI Crop Advisory | Page ${page} of ${totalPages}`,
          margin,
          290
        )
      }

      const safeLocation =
        formatLocation(
          advisory.location
        )
          .replace(
            /[^a-zA-Z0-9]+/g,
            "-"
          )
          .replace(
            /^-+|-+$/g,
            ""
          ) || "Location"

      const filename =
        `FarmAI-Crop-Advisory-${safeLocation}-${getCurrentDateString()}.pdf`

      doc.save(filename)
    } catch (err) {
      console.error(
        "PDF generation error:",
        err
      )

      setError(
        "Unable to generate the PDF. Please try again."
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const topRecommendation =
    advisory?.recommendations?.[0]

  const weeklyRainfall =
    advisory?.weather?.daily?.reduce(
      (sum, day) =>
        sum + (Number(day.precip_mm) || 0),
      0
    ) || 0

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Location Specific Crop Advisory
          </h1>

          <p className="text-muted-foreground mt-2">
            Get personalized crop recommendations using your location,
            soil, weather, irrigation, budget and farming conditions.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />

              <div>
                <p className="font-semibold">
                  Advisory problem
                </p>

                <p className="text-sm mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* LOCATION CARD */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Farm Location
            </CardTitle>

            <CardDescription>
              Choose the location that should be used for weather and
              crop suitability analysis.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              {/* REGISTERED */}
              <button
                type="button"
                onClick={() =>
                  selectLocationSource("registered")
                }
                className={`text-left rounded-lg border p-5 transition ${
                  locationSource === "registered"
                    ? "border-green-600 bg-green-50"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-700 mt-0.5" />

                  <div>
                    <p className="font-semibold">
                      Registered Farm
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      Use your saved farm location
                    </p>
                  </div>
                </div>
              </button>

              {/* GPS */}
              <button
                type="button"
                onClick={() =>
                  selectLocationSource("gps")
                }
                className={`text-left rounded-lg border p-5 transition ${
                  locationSource === "gps"
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Navigation className="h-5 w-5 mt-0.5" />

                  <div>
                    <p className="font-semibold">
                      Current Location
                    </p>

                    <p
                      className={`text-sm mt-1 ${
                        locationSource === "gps"
                          ? "text-white/90"
                          : "text-muted-foreground"
                      }`}
                    >
                      Use live GPS location
                    </p>
                  </div>
                </div>
              </button>

              {/* MANUAL */}
              <button
                type="button"
                onClick={() =>
                  selectLocationSource("manual")
                }
                className={`text-left rounded-lg border p-5 transition ${
                  locationSource === "manual"
                    ? "border-green-600 bg-green-50"
                    : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-green-700 mt-0.5" />

                  <div>
                    <p className="font-semibold">
                      Select Manually
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      Enter village, district or city
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* MANUAL LOCATION INPUT */}
            {locationSource === "manual" && (
              <div className="rounded-lg border border-border p-4 bg-muted/20">
                <Label>
                  Enter Location
                </Label>

                <div className="flex gap-3 mt-2">
                  <Input
                    value={manualLocation}
                    onChange={(e) =>
                      setManualLocation(
                        e.target.value
                      )
                    }
                    placeholder="Example: Kopargaon, Ahmednagar, Maharashtra"
                  />

                  <Button
                    type="button"
                    onClick={
                      resolveManualLocation
                    }
                    disabled={
                      isGettingLocation ||
                      !manualLocation.trim()
                    }
                  >
                    {isGettingLocation ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Find Location"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* SELECTED LOCATION */}
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-green-700 mt-1" />

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Selected location
                    </p>

                    <p className="text-xl font-semibold text-green-900 mt-1">
                      {formatLocation(
                        location
                      )}
                    </p>

                    {location.village && (
                      <p className="text-sm text-green-800 mt-1">
                        Village / Area:{" "}
                        {location.village}
                      </p>
                    )}

                    {location.district && (
                      <p className="text-sm text-green-800">
                        District:{" "}
                        {location.district}
                      </p>
                    )}

                    {location.state && (
                      <p className="text-sm text-green-800">
                        State:{" "}
                        {location.state}
                      </p>
                    )}

                    {location.latitude !==
                      null &&
                      location.longitude !==
                        null && (
                        <p className="text-xs text-muted-foreground mt-2">
                          GPS:{" "}
                          {location.latitude.toFixed(
                            5
                          )}
                          ,{" "}
                          {location.longitude.toFixed(
                            5
                          )}
                        </p>
                      )}
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className="shrink-0"
                >
                  {location.source ===
                  "registered"
                    ? "Registered Farm"
                    : location.source ===
                      "gps"
                    ? "Live GPS"
                    : "Manual"}
                </Badge>
              </div>
            </div>

            {!registeredLoaded && (
              <p className="text-sm text-muted-foreground">
                Loading registered farm location...
              </p>
            )}

            {isGettingLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Identifying location...
              </div>
            )}
          </CardContent>
        </Card>

        {/* FARM INFORMATION */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>
              Farm Information
            </CardTitle>

            <CardDescription>
              Provide details about your farm for personalized
              recommendations.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              {/* SOIL */}
              <div className="space-y-2">
                <Label>
                  Soil Type
                </Label>

                <Select
                  value={soilType}
                  onValueChange={setSoilType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="clay">
                      Clay Soil
                    </SelectItem>

                    <SelectItem value="loamy">
                      Loamy Soil
                    </SelectItem>

                    <SelectItem value="sandy">
                      Sandy Soil
                    </SelectItem>

                    <SelectItem value="black">
                      Black Soil
                    </SelectItem>

                    <SelectItem value="red">
                      Red Soil
                    </SelectItem>

                    <SelectItem value="alluvial">
                      Alluvial Soil
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SEASON */}
              <div className="space-y-2">
                <Label>
                  Planting Season
                </Label>

                <Select
                  value={season}
                  onValueChange={setSeason}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="auto">
                      Automatic - Based on Current Date
                    </SelectItem>

                    <SelectItem value="kharif">
                      Kharif
                    </SelectItem>

                    <SelectItem value="rabi">
                      Rabi
                    </SelectItem>

                    <SelectItem value="zaid">
                      Zaid
                    </SelectItem>
                  </SelectContent>
                </Select>

                {season === "auto" && (
                  <p className="text-xs text-muted-foreground">
                    Current season:{" "}
                    <strong>
                      {formatSeason(
                        selectedSeason
                      )}
                    </strong>
                  </p>
                )}
              </div>

              {/* FARM SIZE */}
              <div className="space-y-2">
                <Label>
                  Farm Size (acres)
                </Label>

                <Input
                  type="number"
                  min="0"
                  value={farmSize}
                  onChange={(e) =>
                    setFarmSize(
                      e.target.value
                    )
                  }
                  placeholder="Example: 15"
                />
              </div>

              {/* IRRIGATION */}
              <div className="space-y-2">
                <Label>
                  Irrigation Type
                </Label>

                <Select
                  value={irrigationType}
                  onValueChange={
                    setIrrigationType
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="drip">
                      Drip Irrigation
                    </SelectItem>

                    <SelectItem value="sprinkler">
                      Sprinkler
                    </SelectItem>

                    <SelectItem value="flood">
                      Flood Irrigation
                    </SelectItem>

                    <SelectItem value="rainfed">
                      Rainfed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* BUDGET */}
              <div className="space-y-2">
                <Label>
                  Budget Range (₹)
                </Label>

                <Select
                  value={budget}
                  onValueChange={setBudget}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="low">
                      Low Budget
                    </SelectItem>

                    <SelectItem value="medium">
                      ₹50,000 – ₹1,00,000
                    </SelectItem>

                    <SelectItem value="high">
                      High Budget
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ANALYZE */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAnalyze}
                disabled={
                  isAnalyzing ||
                  !location.latitude ||
                  !location.longitude
                }
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-base"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Weather, Soil & Market...
                  </>
                ) : (
                  <>
                    <Sprout className="h-5 w-5 mr-2" />
                    Get Recommendations
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* RESULTS */}
        {advisory && (
          <div className="space-y-6">
            {/* SUMMARY */}
            <Card className="border-green-200 bg-green-50/40">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />

                  <div>
                    <h2 className="text-2xl font-bold text-green-900">
                      Advisory Summary
                    </h2>

                    <p className="text-green-900 mt-2 text-base leading-7">
                      Based on your{" "}
                      <strong>
                        {formatSeason(
                          advisory.season
                        )}
                      </strong>{" "}
                      season,{" "}
                      <strong>
                        {formatLocation(
                          advisory.location
                        )}
                      </strong>
                      , available weather information,
                      soil information and farming conditions,{" "}
                      <strong>
                        {topRecommendation?.crop
                          .name}
                      </strong>{" "}
                      currently has the highest suitability score of{" "}
                      <strong>
                        {topRecommendation?.score}%
                      </strong>
                      .
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LOCATION RESULT */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Advisory Location
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="grid md:grid-cols-4 gap-5">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Location
                    </p>

                    <p className="font-semibold text-green-900 mt-1">
                      {advisory.location.village ||
                        advisory.location.displayName}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      District
                    </p>

                    <p className="font-semibold text-green-900 mt-1">
                      {advisory.location.district ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      State
                    </p>

                    <p className="font-semibold text-green-900 mt-1">
                      {advisory.location.state ||
                        "Not available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Source
                    </p>

                    <Badge
                      variant="outline"
                      className="mt-2"
                    >
                      {advisory.location
                        .source ===
                      "registered"
                        ? "Registered Farm"
                        : advisory.location
                            .source ===
                          "gps"
                        ? "Current GPS"
                        : "Manual Selection"}
                    </Badge>
                  </div>
                </div>

                {advisory.location.latitude !==
                  null &&
                  advisory.location.longitude !==
                    null && (
                    <p className="text-xs text-muted-foreground mt-5">
                      Coordinates:{" "}
                      {advisory.location.latitude.toFixed(
                        6
                      )}
                      ,{" "}
                      {advisory.location.longitude.toFixed(
                        6
                      )}
                    </p>
                  )}
              </CardContent>
            </Card>

            {/* WEATHER */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  Weather Insights
                </CardTitle>

                <CardDescription>
                  Live weather and 7-day forecast for the selected
                  location.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-4 gap-5">
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-6 w-6 text-red-500" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Temperature
                      </p>

                      <p className="font-bold text-lg">
                        {advisory.weather.current
                          ?.temperature?.toFixed(
                            1
                          ) || "—"}
                        °C
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Droplets className="h-6 w-6 text-blue-500" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Humidity
                      </p>

                      <p className="font-bold text-lg">
                        {advisory.weather.current
                          ?.humidity ??
                          "—"}
                        {advisory.weather.current
                          ?.humidity !==
                          undefined
                          ? "%"
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <CloudRain className="h-6 w-6 text-blue-500" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        7-Day Rainfall
                      </p>

                      <p className="font-bold text-lg">
                        {weeklyRainfall.toFixed(
                          1
                        )}{" "}
                        mm
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Wind className="h-6 w-6 text-cyan-500" />

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Wind
                      </p>

                      <p className="font-bold text-lg">
                        {advisory.weather.current
                          ?.windspeed?.toFixed(
                            1
                          ) || "—"}{" "}
                        km/h
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    7-Day Forecast
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                    {advisory.weather.daily
                      .slice(0, 7)
                      .map((day) => (
                        <div
                          key={day.date}
                          className="rounded-lg border p-3"
                        >
                          <p className="font-medium text-sm">
                            {new Date(
                              day.date
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                              }
                            )}
                          </p>

                          <p className="text-xl font-bold mt-2">
                            {day.temp_max}°
                          </p>

                          <p className="text-xs text-muted-foreground">
                            Min {day.temp_min}°
                          </p>

                          <p className="text-xs mt-3">
                            🌧️{" "}
                            {day.precip_mm} mm
                          </p>

                          <p className="text-xs">
                            {day.pop}% rain
                          </p>

                          <p className="text-xs text-muted-foreground mt-1">
                            {weatherCodeText(
                              day.weathercode
                            )}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {advisory.weather.advisories &&
                  advisory.weather.advisories
                    .length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="font-semibold text-amber-900 mb-2">
                        Weather Advisories
                      </p>

                      <ul className="space-y-2">
                        {advisory.weather.advisories
                          .slice(0, 5)
                          .map((item) => (
                            <li
                              key={item.id}
                              className="text-sm text-amber-900"
                            >
                              •{" "}
                              {item.message_en}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* SOIL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-amber-500" />
                  Soil Information
                </CardTitle>
              </CardHeader>

              <CardContent>
                {advisory.soil ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />

                      <div>
                        <p className="font-semibold text-lg">
                          Soil data available
                        </p>

                        <p className="text-muted-foreground">
                          Based on your latest processed
                          soil report.
                        </p>

                        <p className="text-sm mt-3">
                          Soil test date:{" "}
                          <strong>
                            {formatDate(
                              advisory.soil
                                .testDate
                            )}
                          </strong>
                        </p>

                        {advisory.soil
                          .aiAnalysis
                          ?.soilType && (
                          <p className="text-sm mt-1">
                            Detected soil type:{" "}
                            <strong>
                              {
                                advisory.soil
                                  .aiAnalysis
                                  .soilType
                              }
                            </strong>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-5 gap-4">
                      <SoilValue
                        label="Nitrogen"
                        value={
                          advisory.soil
                            .soilParameters
                            ?.nitrogen
                            ?.value
                        }
                        unit={
                          advisory.soil
                            .soilParameters
                            ?.nitrogen
                            ?.unit
                        }
                      />

                      <SoilValue
                        label="Phosphorus"
                        value={
                          advisory.soil
                            .soilParameters
                            ?.phosphorus
                            ?.value
                        }
                        unit={
                          advisory.soil
                            .soilParameters
                            ?.phosphorus
                            ?.unit
                        }
                      />

                      <SoilValue
                        label="Potassium"
                        value={
                          advisory.soil
                            .soilParameters
                            ?.potassium
                            ?.value
                        }
                        unit={
                          advisory.soil
                            .soilParameters
                            ?.potassium
                            ?.unit
                        }
                      />

                      <SoilValue
                        label="pH"
                        value={
                          advisory.soil
                            .soilParameters
                            ?.pH
                            ?.value
                        }
                        unit=""
                      />

                      <SoilValue
                        label="Organic Carbon"
                        value={
                          advisory.soil
                            .soilParameters
                            ?.organicCarbon
                            ?.value
                        }
                        unit={
                          advisory.soil
                            .soilParameters
                            ?.organicCarbon
                            ?.unit
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-5">
                    <p className="font-semibold">
                      No processed soil report available
                    </p>

                    <p className="text-sm text-muted-foreground mt-1">
                      The recommendation is using the selected soil
                      type. Upload and process a soil report to make
                      future recommendations more personalized.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* RECOMMENDATIONS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  Recommended Crops
                </CardTitle>

                <CardDescription>
                  Crops are ranked using season, location, weather,
                  soil, irrigation, budget and available market data.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {advisory.recommendations.map(
                  (recommendation, index) => (
                    <CropRecommendationCard
                      key={
                        recommendation.crop
                          .name
                      }
                      recommendation={
                        recommendation
                      }
                      index={index}
                    />
                  )
                )}
              </CardContent>
            </Card>

            {/* PDF */}
            <Card className="border-green-200 bg-green-50/40">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="rounded-full bg-green-100 p-3">
                      <Download className="h-6 w-6 text-green-700" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-green-900">
                        Download Crop Advisory Report
                      </h3>

                      <p className="text-sm text-green-800 mt-1">
                        Save the complete recommendation as a
                        farmer-friendly PDF containing location,
                        weather, soil information, crop scores,
                        reasons, practical advice and risks.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* FINAL NOTE */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />

                <div>
                  <p className="font-semibold text-amber-900">
                    Important
                  </p>

                  <p className="text-sm text-amber-900 mt-1">
                    This recommendation is a decision-support
                    result based on the available FarmAI data.
                    Weather and market conditions can change.
                    Farmers should consider local conditions and
                    consult an agricultural expert before making
                    major cultivation or financial decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

/*
 * ---------------------------------------------------------
 * SOIL VALUE COMPONENT
 * ---------------------------------------------------------
 */
function SoilValue({
  label,
  value,
  unit,
}: {
  label: string
  value?: number
  unit?: string
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="font-semibold text-lg mt-1">
        {value !== undefined &&
        value !== null
          ? value
          : "N/A"}{" "}
        {value !== undefined &&
        value !== null
          ? unit
          : ""}
      </p>
    </div>
  )
}

/*
 * ---------------------------------------------------------
 * CROP RECOMMENDATION CARD
 * ---------------------------------------------------------
 */
function CropRecommendationCard({
  recommendation,
  index,
}: {
  recommendation: CropRecommendation
  index: number
}) {
  const score =
    recommendation.score

  const scoreLabel =
    score >= 80
      ? "Highly Suitable"
      : score >= 70
      ? "Suitable"
      : score >= 60
      ? "Moderately Suitable"
      : "Less Suitable"

  return (
    <div className="rounded-xl border border-border p-6">
      {/* TOP */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-green-100 p-3">
            <Sprout className="h-6 w-6 text-green-700" />
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-bold">
                {recommendation.crop.name}
              </h3>

              {index === 0 && (
                <Badge className="bg-green-600">
                  Best Match
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mt-1">
              Expected duration:{" "}
              {recommendation.crop
                .durationDays}{" "}
              days
            </p>
          </div>
        </div>

        <Badge
          className={
            score >= 80
              ? "bg-green-600 text-white"
              : score >= 70
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }
        >
          {score}% {scoreLabel}
        </Badge>
      </div>

      {/* DETAILS */}
      <div className="grid md:grid-cols-4 gap-5 mt-7">
        <div>
          <p className="text-sm text-muted-foreground">
            Season
          </p>

          <p className="font-semibold text-green-900 mt-1">
            {recommendation.crop.season
              .map(formatSeason)
              .join(" / ")}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Water Requirement
          </p>

          <p className="font-semibold text-green-900 mt-1">
            {recommendation.crop
              .waterRequirement}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Preferred Soil
          </p>

          <p className="font-semibold text-green-900 mt-1">
            {recommendation.crop
              .preferredSoils
              .map(
                (soil) =>
                  soil.charAt(0).toUpperCase() +
                  soil.slice(1)
              )
              .join(", ")}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">
            Market
          </p>

          <p className="font-semibold text-green-900 mt-1">
            {recommendation.marketAvailable &&
            recommendation.marketPrice !==
              null
              ? `₹${Math.round(
                  recommendation.marketPrice
                )} / ${
                  recommendation.marketUnit
                }`
              : "Data Unavailable"}
          </p>
        </div>
      </div>

      {/* REASONS */}
      <div className="mt-7">
        <h4 className="text-lg font-semibold">
          Why this crop was recommended
        </h4>

        <div className="space-y-3 mt-3">
          {recommendation.reasons.map(
            (reason, reasonIndex) => (
              <div
                key={reasonIndex}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />

                <p className="text-sm md:text-base">
                  {reason}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* PRACTICAL ADVICE */}
      <div className="mt-7 rounded-lg border border-green-200 bg-green-50 p-5">
        <h4 className="text-lg font-semibold text-green-900">
          Practical Advice
        </h4>

        <div className="space-y-3 mt-3">
          {recommendation.advice.map(
            (advice, adviceIndex) => (
              <div
                key={adviceIndex}
                className="flex items-start gap-3"
              >
                <Leaf className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />

                <p className="text-sm text-green-900">
                  {advice}
                </p>
              </div>
            )
          )}
        </div>
      </div>

      {/* RISKS */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold">
          Important Risks
        </h4>

        <div className="flex flex-wrap gap-2 mt-3">
          {recommendation.risks.map(
            (risk, riskIndex) => (
              <Badge
                key={riskIndex}
                variant="outline"
                className="border-amber-400 text-amber-700"
              >
                {risk}
              </Badge>
            )
          )}
        </div>
      </div>
    </div>
  )
}