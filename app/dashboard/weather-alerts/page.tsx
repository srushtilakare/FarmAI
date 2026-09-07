"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Sun,
  Cloud,
  CloudRain,
  Zap,
  CloudSnow,
  Search,
  Calendar,
  Speaker,
} from "lucide-react";

/**
 * Slim Agriculture-first Weather Page (TypeScript-clean)
 *
 * - Uses NEXT_PUBLIC_API_URL (you set it to http://localhost:5000)
 * - Fetches profile from GET /api/profile/user with Authorization Bearer <token>
 * - Geocodes profile.farmLocation (Open-Meteo geocoding) -> calls Open-Meteo forecast
 * - Crop-specific advisories, "What to do today", language toggle, voice
 * - No charts (keeps file small and fast)
 *
 * GAMIFICATION:
 * - Every successful weather forecast fetch is logged through
 *   POST /api/activities/log
 * - Backend converts "weather-alert" into "weather_check"
 * - This updates UserScore.weatherChecks and weatherWatcher progress
 */

/* -------------------------
   Types
------------------------- */
type Daily = {
  date: string;
  temp_max: number;
  temp_min: number;
  precip_mm: number;
  pop: number;
  windspeed_max: number;
  weathercode: number;
};

type WeatherResponse = {
  status: "ok" | "error";
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  current?: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    time: string;
  } | null;
  daily: Daily[];
  advisories: {
    id: string;
    severity: "low" | "medium" | "high";
    message_en: string;
  }[];
};

/* -------------------------
   Translations & helpers
------------------------- */
const translations: Record<string, Record<string, string>> = {
  "en-US": {
    title: "FarmAI — Weather & Farm Advisory",
    subtitle: "Personalized weather & farming tasks for your fields",
    back: "Back to Dashboard",
    manual_placeholder: "Enter city or village (e.g., Pune)",
    fetch: "Fetch",
    save_location: "Save to profile",
    current_weather: "Today's Weather",
    seven_day: "7-Day Forecast",
    advisories: "Weather Advisories",
    tasks: "What to do today",
    no_data: "No weather data available",
    listen: "Listen",
  },
  "hi-IN": {
    title: "FarmAI — मौसम और खेती सलाह",
    subtitle: "आपके खेत के लिए निजी मौसम और कार्य",
    back: "डैशबोर्ड पर वापस",
    manual_placeholder: "शहर या गाँव दर्ज करें (जैसे: Pune)",
    fetch: "लाओ",
    save_location: "प्रोफ़ाइल में सहेजें",
    current_weather: "आज का मौसम",
    seven_day: "7-दिवसीय पूर्वानुमान",
    advisories: "मौसम चेतावनियाँ",
    tasks: "आज क्या करना है",
    no_data: "मौसम डेटा उपलब्ध नहीं",
    listen: "सुनें",
  },
  "mr-IN": {
    title: "FarmAI — हवामान आणि शेती सल्ला",
    subtitle: "आपल्या शेतासाठी वैयक्तिक हवामान व कार्य",
    back: "डॅशबोर्डवर परत जा",
    manual_placeholder: "शहर किंवा गाव प्रविष्ट करा (उदा.: Pune)",
    fetch: "मिळवा",
    save_location: "प्रोफाइलमध्ये जतन करा",
    current_weather: "आजचे हवामान",
    seven_day: "7-दिवसीय अंदाज",
    advisories: "हवामान सूचना",
    tasks: "आज काय करायचे",
    no_data: "हवामान डेटा उपलब्ध नाही",
    listen: "ऐका",
  },
};

const advisoryTranslateMap: Record<string, Record<string, string>> = {
  "High fungal risk": {
    "hi-IN": "उच्च फफूंदी का जोखिम",
    "mr-IN": "उच्च बुरशीचा धोका",
  },
  "Avoid spraying": {
    "hi-IN": "फवारने से बचें",
    "mr-IN": "फवारणी टाळा",
  },
  "Irrigate in morning": {
    "hi-IN": "सुबह सिंचाई करें",
    "mr-IN": "सकाळी पाणी द्या",
  },
  "Secure structures": {
    "hi-IN": "संरचनाओं को सुरक्षित करें",
    "mr-IN": "स्ट्रक्चर्स सुरक्षित करा",
  },
};

function translateAdvisory(text: string, locale: string) {
  if (locale === "en-US") return text;

  let out = text;

  Object.keys(advisoryTranslateMap).forEach((k) => {
    const tr = advisoryTranslateMap[k][locale];

    if (tr) {
      out = out.split(k).join(tr);
    }
  });

  return out;
}

function codeToType(code: number) {
  if (code === 0) return "clear";
  if (code >= 1 && code <= 3) return "partly";
  if (code >= 45 && code <= 48) return "fog";
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82)
  ) {
    return "rain";
  }
  if (code >= 95) return "storm";
  if (code >= 71 && code <= 77) return "snow";

  return "cloudy";
}

function weatherIcon(code: number) {
  const t = codeToType(code);

  switch (t) {
    case "clear":
      return <Sun className="h-10 w-10 text-yellow-400" />;

    case "partly":
      return <Sun className="h-8 w-8 text-yellow-400" />;

    case "rain":
      return <CloudRain className="h-8 w-8 text-sky-500" />;

    case "storm":
      return <Zap className="h-8 w-8 text-yellow-300" />;

    case "snow":
      return <CloudSnow className="h-8 w-8 text-slate-300" />;

    default:
      return <Cloud className="h-8 w-8 text-slate-400" />;
  }
}

/* -------------------------
   Environment
------------------------- */
const API_ROOT =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* -------------------------
   Component
------------------------- */
export default function WeatherAlertsPage(): JSX.Element {
  const [profile, setProfile] =
    useState<any | null>(null);

  const [weather, setWeather] =
    useState<WeatherResponse | null>(null);

  const [loading, setLoading] =
    useState<boolean>(true);

  const [cityInput, setCityInput] =
    useState<string>("");

  const [saveToProfile, setSaveToProfile] =
    useState<boolean>(false);

  const [locale, setLocale] =
    useState<string>(() =>
      typeof window !== "undefined"
        ? localStorage.getItem("locale") || "en-US"
        : "en-US"
    );

  const [speechPlaying, setSpeechPlaying] =
    useState<boolean>(false);

  const synthRef =
    useRef<SpeechSynthesis | null>(
      typeof window !== "undefined"
        ? window.speechSynthesis
        : null
    );

  const t =
    translations[locale] ??
    translations["en-US"];

  /* -------------------------
     Fetch profile from backend
     GET /api/profile/user
     ------------------------- */
  const fetchProfile =
    useCallback(async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        if (!token) {
          const local =
            typeof window !== "undefined"
              ? localStorage.getItem("user")
              : null;

          if (local) {
            const u = JSON.parse(local);

            setProfile(u);

            return u;
          }

          setProfile(null);

          return null;
        }

        const res =
          await fetch(
            `${API_ROOT}/api/profile/user`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!res.ok) {
          const local =
            typeof window !== "undefined"
              ? localStorage.getItem("user")
              : null;

          if (local) {
            const u = JSON.parse(local);

            setProfile(u);

            return u;
          }

          setProfile(null);

          return null;
        }

        const data =
          await res.json();

        setProfile(data);

        try {
          localStorage.setItem(
            "user",
            JSON.stringify(data)
          );
        } catch {}

        return data;
      } catch (err) {
        console.error(
          "fetchProfile error",
          err
        );

        const local =
          typeof window !== "undefined"
            ? localStorage.getItem("user")
            : null;

        if (local) {
          const u = JSON.parse(local);

          setProfile(u);

          return u;
        }

        setProfile(null);

        return null;
      }
    }, []);

  /* -------------------------
     Log successful weather check
     
     IMPORTANT:
     The weather page fetches Open-Meteo directly.
     Therefore backend/routes/weather.js is not reached
     for this page.

     We explicitly log the successful weather check
     through the centralized activities system.

     weather-alert
       -> activities.js
       -> weather_check
       -> UserScore.stats.weatherChecks
       -> weatherWatcher.current
       -> 3 points
  ------------------------- */
  const logWeatherCheck =
    useCallback(
      async (
        placeName: string,
        latitude: number,
        longitude: number
      ) => {
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;

          // No authenticated user = nothing to award.
          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_ROOT}/api/activities/log`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                body: JSON.stringify({
                  activityType:
                    "weather-alert",

                  title:
                    `Weather Check - ${placeName}`,

                  description:
                    `Checked weather forecast for ${placeName} (7 days)`,

                  status:
                    "completed",

                  result:
                    "Weather forecast loaded successfully",

                  metadata: {
                    action:
                      "weather_check",

                    location:
                      placeName,

                    latitude,

                    longitude,

                    source:
                      "open-meteo",
                  },
                }),
              }
            );

          if (!response.ok) {
            const errorData =
              await response
                .json()
                .catch(() => null);

            console.error(
              "Weather gamification logging failed:",
              response.status,
              errorData
            );

            return;
          }

          console.log(
            "🌦️ Weather check gamification activity logged successfully"
          );
        } catch (error) {
          /*
           * Gamification must never break
           * the weather feature.
           */
          console.error(
            "Weather gamification logging error:",
            error
          );
        }
      },
      []
    );

  /* -------------------------
     Geocode using Open-Meteo geocoding
  ------------------------- */
  async function geocodePlace(
    place: string
  ): Promise<{
    latitude: number;
    longitude: number;
    name?: string;
  } | null> {
    if (!place) return null;

    try {
      const q =
        encodeURIComponent(place);

      const url =
        `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=1&language=en&format=json`;

      const res =
        await fetch(url);

      if (!res.ok) {
        return null;
      }

      const j =
        await res.json();

      if (
        j &&
        Array.isArray(j.results) &&
        j.results.length > 0
      ) {
        const r =
          j.results[0];

        return {
          latitude:
            r.latitude,

          longitude:
            r.longitude,

          name:
            r.name +
            (r.country
              ? ", " + r.country
              : ""),
        };
      }

      return null;
    } catch (err) {
      console.error(
        "geocode error",
        err
      );

      return null;
    }
  }

  /* -------------------------
     Fetch Open-Meteo 7-day forecast
  ------------------------- */
  async function fetchOpenMeteo(
    lat: number,
    lon: number,
    placeName?: string
  ) {
    setLoading(true);

    try {
      const dailyParams = [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_mean",
        "windspeed_10m_max",
        "weathercode",
      ].join(",");

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=${dailyParams}&current_weather=true&timezone=auto&forecast_days=7`;

      const res =
        await fetch(url);

      if (!res.ok) {
        console.error(
          "Open-Meteo request failed:",
          res.status
        );

        setWeather(null);

        return null;
      }

      const j =
        await res.json();

      if (!j) {
        setWeather(null);

        return null;
      }

      const daily: Daily[] =
        (j.daily?.time || [])
          .map(
            (
              d: string,
              idx: number
            ) => ({
              date: d,

              temp_max:
                j.daily
                  ?.temperature_2m_max?.[
                  idx
                ] ?? 0,

              temp_min:
                j.daily
                  ?.temperature_2m_min?.[
                  idx
                ] ?? 0,

              precip_mm:
                j.daily
                  ?.precipitation_sum?.[
                  idx
                ] ?? 0,

              pop:
                j.daily
                  ?.precipitation_probability_mean?.[
                  idx
                ] ?? 0,

              windspeed_max:
                j.daily
                  ?.windspeed_10m_max?.[
                  idx
                ] ?? 0,

              weathercode:
                j.daily
                  ?.weathercode?.[
                  idx
                ] ?? 0,
            })
          );

      const current =
        j.current_weather
          ? {
              temperature:
                j.current_weather
                  .temperature,

              windspeed:
                j.current_weather
                  .windspeed,

              weathercode:
                j.current_weather
                  .weathercode,

              time:
                j.current_weather
                  .time,
            }
          : null;

      const advisories:
        WeatherResponse["advisories"] =
        [];

      const heavyRainDay =
        daily.find(
          (d) =>
            (d.pop ?? 0) >= 80 ||
            (d.precip_mm ?? 0) >= 20
        );

      if (heavyRainDay) {
        advisories.push({
          id: "heavy-rain",

          severity: "high",

          message_en:
            `Heavy rain likely on ${heavyRainDay.date}. Avoid field spraying.`,
        });
      }

      const hotDay =
        daily.find(
          (d) =>
            (d.temp_max ?? 0) >= 38
        );

      if (hotDay) {
        advisories.push({
          id: "heat-wave",

          severity: "medium",

          message_en:
            `High temperature (~${Math.round(
              hotDay.temp_max
            )}°C) expected on ${
              hotDay.date
            }. Consider irrigation.`,
        });
      }

      const windDay =
        daily.find(
          (d) =>
            (d.windspeed_max ?? 0) >=
            45
        );

      if (windDay) {
        advisories.push({
          id: "strong-wind",

          severity: "medium",

          message_en:
            `Strong winds forecasted on ${windDay.date}. Secure shade and avoid spraying.`,
        });
      }

      const totalRain =
        daily.reduce(
          (s, x) =>
            s +
            (x.precip_mm ?? 0),
          0
        );

      if (totalRain < 5) {
        advisories.push({
          id: "low-rain",

          severity: "medium",

          message_en:
            `Low rainfall expected this week (~${totalRain.toFixed(
              1
            )} mm). Plan irrigation.`,
        });
      }

      const resolvedPlaceName =
        placeName ||
        `${lat.toFixed(
          2
        )},${lon.toFixed(2)}`;

      const wr: WeatherResponse = {
        status: "ok",

        location: {
          name:
            resolvedPlaceName,

          latitude:
            lat,

          longitude:
            lon,
        },

        current,

        daily,

        advisories,
      };

      setWeather(wr);

      /*
       * IMPORTANT:
       * Only log after the weather request succeeded
       * and valid weather data was constructed.
       *
       * This means failed API requests do NOT increase
       * the Weather Watcher achievement.
       */
      await logWeatherCheck(
        resolvedPlaceName,
        lat,
        lon
      );

      return wr;
    } catch (err) {
      console.error(
        "fetchOpenMeteo error",
        err
      );

      setWeather(null);

      return null;
    } finally {
      setLoading(false);
    }
  }

  /* -------------------------
     Crop-specific advisory engine
  ------------------------- */
  function generateCropAdvisories(
    wr: WeatherResponse | null,
    userProfile: any
  ) {
    if (!wr || !userProfile) {
      return [];
    }

    const crops: string[] =
      Array.isArray(
        userProfile.crops
      )
        ? userProfile.crops.map(
            (c: string) =>
              String(c).toLowerCase()
          )
        : [];

    const advs: {
      id: string;
      severity:
        | "info"
        | "medium"
        | "high";
      text: string;
    }[] = [];

    const weekRain =
      wr.daily.reduce(
        (s, d) =>
          s +
          (d.precip_mm ?? 0),
        0
      );

    const maxTemp =
      Math.max(
        ...wr.daily.map(
          (d) =>
            d.temp_max ??
            -999
        )
      );

    const maxWind =
      Math.max(
        ...wr.daily.map(
          (d) =>
            d.windspeed_max ??
            0
        )
      );

    const anyHeavyRain =
      wr.daily.some(
        (d) =>
          (d.pop ?? 0) >=
            70 ||
          (d.precip_mm ?? 0) >=
            15
      );

    if (weekRain < 5) {
      advs.push({
        id: "irrigation-plan",

        severity: "medium",

        text:
          `Low rainfall this week (~${weekRain.toFixed(
            1
          )} mm). Schedule irrigation.`,
      });
    }

    if (maxTemp >= 35) {
      advs.push({
        id: "heat-alert",

        severity: "medium",

        text:
          `High temperatures (up to ${Math.round(
            maxTemp
          )}°C) expected. Water crops early morning or late evening.`,
      });
    }

    if (maxWind >= 40) {
      advs.push({
        id: "wind-alert",

        severity: "medium",

        text:
          `Strong winds (up to ${Math.round(
            maxWind
          )} km/h) forecasted. Avoid spraying and secure loose structures.`,
      });
    }

    crops.forEach((c) => {
      if (c.includes("tomato")) {
        if (anyHeavyRain) {
          advs.push({
            id: `tomato-rain-${Math.random()}`,

            severity: "high",

            text:
              `Tomato: Heavy rain expected — avoid pesticide/fertilizer spraying for 48 hours and check drainage to prevent fungal disease.`,
          });
        } else if (maxTemp >= 36) {
          advs.push({
            id: `tomato-heat-${Math.random()}`,

            severity: "medium",

            text:
              `Tomato: High temperatures — provide partial shade during hottest hours and water deeper in morning.`,
          });
        } else {
          advs.push({
            id: `tomato-ok-${Math.random()}`,

            severity: "info",

            text:
              `Tomato: Conditions are acceptable. Monitor for sudden rain.`,
          });
        }
      }

      if (c.includes("wheat")) {
        if (maxTemp >= 34) {
          advs.push({
            id: `wheat-heat-${Math.random()}`,

            severity: "medium",

            text:
              `Wheat: High temperature days — consider irrigation to avoid heat stress.`,
          });
        } else {
          advs.push({
            id: `wheat-ok-${Math.random()}`,

            severity: "info",

            text:
              `Wheat: Normal conditions — continue routine monitoring.`,
          });
        }
      }

      if (
        c.includes("rice") ||
        c.includes("paddy")
      ) {
        if (anyHeavyRain) {
          advs.push({
            id: `paddy-flood-${Math.random()}`,

            severity: "medium",

            text:
              `Paddy: Heavy rain expected — monitor bunds and drainage to avoid lodging or waterlogging.`,
          });
        } else {
          advs.push({
            id: `paddy-ok-${Math.random()}`,

            severity: "info",

            text:
              `Paddy: Rain pattern favorable — manage water levels accordingly.`,
          });
        }
      }

      if (c.includes("cotton")) {
        if (maxWind >= 40) {
          advs.push({
            id: `cotton-wind-${Math.random()}`,

            severity: "medium",

            text:
              `Cotton: Strong winds expected — avoid spraying and consider staking vulnerable plants.`,
          });
        }
      }

      if (
        [
          "onion",
          "potato",
          "maize",
          "sugarcane",
          "groundnut",
        ].some((x) =>
          c.includes(x)
        )
      ) {
        if (weekRain < 5) {
          advs.push({
            id: `${c}-irrigation-${Math.random()}`,

            severity: "medium",

            text:
              `${c.charAt(
                0
              ).toUpperCase()}${c.slice(
                1
              )}: Low rain this week — plan irrigation.`,
          });
        }
      }
    });

    return advs;
  }

  /* -------------------------
     On mount:
     load profile -> geocode -> fetch weather
  ------------------------- */
  useEffect(() => {
    (async () => {
      setLoading(true);

      const prof =
        await fetchProfile();

      let latlon: {
        lat: number;
        lon: number;
        name?: string;
      } | null = null;

      if (
        prof?.latitude &&
        prof?.longitude
      ) {
        latlon = {
          lat:
            prof.latitude,

          lon:
            prof.longitude,

          name:
            prof.farmLocation ||
            `${prof.state || ""}`,
        };
      } else if (
        prof?.farmLocation &&
        typeof prof.farmLocation ===
          "string" &&
        prof.farmLocation.trim() !==
          ""
      ) {
        const g =
          await geocodePlace(
            prof.farmLocation +
              (prof.state
                ? ` ${prof.state}`
                : "")
          );

        if (g) {
          latlon = {
            lat:
              g.latitude,

            lon:
              g.longitude,

            name:
              g.name ||
              prof.farmLocation,
          };
        }
      } else if (
        prof?.pincode
      ) {
        const g =
          await geocodePlace(
            String(
              prof.pincode
            )
          );

        if (g) {
          latlon = {
            lat:
              g.latitude,

            lon:
              g.longitude,

            name:
              g.name,
          };
        }
      }

      if (!latlon) {
        if (
          "geolocation" in
          navigator
        ) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              await fetchOpenMeteo(
                pos.coords.latitude,
                pos.coords.longitude,
                "Your location"
              );
            },
            async () => {
              const g =
                await geocodePlace(
                  "Pune"
                );

              if (g) {
                await fetchOpenMeteo(
                  g.latitude,
                  g.longitude,
                  g.name
                );
              } else {
                await fetchOpenMeteo(
                  18.5204,
                  73.8567,
                  "Pune"
                );
              }
            },
            {
              timeout: 8000,
            }
          );
        } else {
          const g =
            await geocodePlace(
              "Pune"
            );

          if (g) {
            await fetchOpenMeteo(
              g.latitude,
              g.longitude,
              g.name
            );
          } else {
            await fetchOpenMeteo(
              18.5204,
              73.8567,
              "Pune"
            );
          }
        }
      } else {
        await fetchOpenMeteo(
          latlon.lat,
          latlon.lon,
          latlon.name
        );
      }

      setLoading(false);
    })();
  }, [fetchProfile]);

  /* -------------------------
     Manual search
     ------------------------- */
  const handleManualFetch =
    useCallback(
      async (save = false) => {
        if (
          !cityInput.trim()
        ) {
          return;
        }

        setLoading(true);

        const geo =
          await geocodePlace(
            cityInput.trim()
          );

        if (!geo) {
          alert(
            "Location not found. Try a nearby town name or pincode."
          );

          setLoading(false);

          return;
        }

        await fetchOpenMeteo(
          geo.latitude,
          geo.longitude,
          geo.name
        );

        if (save) {
          try {
            const token =
              typeof window !==
              "undefined"
                ? localStorage.getItem(
                    "token"
                  )
                : null;

            if (token) {
              const form =
                new FormData();

              form.append(
                "farmLocation",
                cityInput.trim()
              );

              await fetch(
                `${API_ROOT}/api/profile/user`,
                {
                  method: "PUT",

                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },

                  body: form,
                }
              );

              await fetchProfile();
            } else {
              const local =
                typeof window !==
                "undefined"
                  ? localStorage.getItem(
                      "user"
                    )
                  : null;

              if (local) {
                const u =
                  JSON.parse(
                    local
                  );

                u.farmLocation =
                  cityInput.trim();

                localStorage.setItem(
                  "user",
                  JSON.stringify(u)
                );

                setProfile(u);
              }
            }
          } catch (err) {
            console.error(
              "save location error",
              err
            );
          }
        }

        setCityInput("");

        setSaveToProfile(false);

        setLoading(false);
      },
      [
        cityInput,
        fetchProfile,
      ]
    );

  /* -------------------------
     Voice readout
  ------------------------- */
  const speak =
    useCallback(() => {
      if (!weather) {
        return;
      }

      if (
        !(
          "speechSynthesis" in
          window
        )
      ) {
        alert(
          "Speech synthesis not supported in this browser."
        );

        return;
      }

      const lines: string[] =
        [];

      lines.push(
        locale === "en-US"
          ? `Weather for ${weather.location?.name}.`
          : locale === "hi-IN"
          ? `${weather.location?.name} के लिए मौसम।`
          : `${weather.location?.name} साठी हवामान.`
      );

      if (weather.current) {
        lines.push(
          locale === "en-US"
            ? `Current ${Math.round(
                weather.current
                  .temperature
              )} degree Celsius.`
            : locale === "hi-IN"
            ? `वर्तमान तापमान ${Math.round(
                weather.current
                  .temperature
              )} डिग्री सेल्सियस।`
            : `सध्याचे तापमान ${Math.round(
                weather.current
                  .temperature
              )} अंश.`
        );
      }

      (
        weather.advisories ??
        []
      )
        .slice(0, 2)
        .forEach((a) =>
          lines.push(
            locale === "en-US"
              ? a.message_en
              : translateAdvisory(
                  a.message_en,
                  locale
                )
          )
        );

      const cropAdvs =
        generateCropAdvisories(
          weather,
          profile
        ).slice(0, 3);

      cropAdvs.forEach((c) =>
        lines.push(c.text)
      );

      const utter =
        new SpeechSynthesisUtterance(
          lines.join(" ")
        );

      utter.lang =
        locale === "en-US"
          ? "en-US"
          : locale === "hi-IN"
          ? "hi-IN"
          : "mr-IN";

      utter.rate = 0.95;

      synthRef.current?.cancel();

      synthRef.current?.speak(
        utter
      );

      setSpeechPlaying(
        true
      );

      utter.onend = () =>
        setSpeechPlaying(false);
    }, [
      weather,
      locale,
      profile,
    ]);

  const stopSpeech =
    useCallback(() => {
      synthRef.current?.cancel();

      setSpeechPlaying(false);
    }, []);

  /* -------------------------
     Derived values
  ------------------------- */
  const dominant =
    useMemo(() => {
      if (!weather) {
        return "clear";
      }

      const code =
        weather.current
          ?.weathercode ??
        weather.daily?.[0]
          ?.weathercode ??
        0;

      return codeToType(
        code
      );
    }, [weather]);

  const cropAdvisories =
    useMemo(
      () =>
        generateCropAdvisories(
          weather,
          profile
        ),
      [weather, profile]
    );

  /* -------------------------
     Render
  ------------------------- */
  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${
          dominant === "rain"
            ? "bg-gradient-to-br from-sky-700 via-sky-600 to-slate-700"
            : dominant === "storm"
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700"
            : "bg-gradient-to-br from-blue-300 via-amber-200 to-white"
        }`}
        style={{
          zIndex: 0,
        }}
      />

      {/* Animated layers */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />

        <div
          className={`rain-layer ${
            dominant === "rain" ||
            dominant === "storm"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <div className="rain" />
          <div className="rain delay" />
        </div>

        <div
          className={`absolute bottom-0 left-0 right-0 h-28 ${
            dominant === "clear" &&
            weather &&
            weather.daily.some(
              (d) =>
                d.temp_max >= 35
            )
              ? "soil-shimmer"
              : ""
          }`}
        />
      </div>

      {/* Main container */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              {t.title}
            </h1>

            <p className="text-sm md:text-base text-slate-700 mt-1">
              {t.subtitle}
            </p>

            {profile && (
              <div className="mt-2 text-xs text-slate-600">
                Location:{" "}
                <strong>
                  {profile.farmLocation ||
                    `${profile.state || ""}${
                      profile.district
                        ? ", " +
                          profile.district
                        : ""
                    }`}
                </strong>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-md bg-white/90 p-1 flex gap-1">
              <button
                onClick={() =>
                  setLocale("en-US")
                }
                className={`px-3 py-1 rounded text-sm ${
                  locale === "en-US"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700"
                }`}
              >
                EN
              </button>

              <button
                onClick={() =>
                  setLocale("hi-IN")
                }
                className={`px-3 py-1 rounded text-sm ${
                  locale === "hi-IN"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700"
                }`}
              >
                हिंदी
              </button>

              <button
                onClick={() =>
                  setLocale("mr-IN")
                }
                className={`px-3 py-1 rounded text-sm ${
                  locale === "mr-IN"
                    ? "bg-slate-900 text-white"
                    : "text-slate-700"
                }`}
              >
                मराठी
              </button>
            </div>

            <Link href="/dashboard">
              <Button
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero + Forecast */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white shadow-sm border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                {t.current_weather}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-28 h-28 rounded-xl bg-slate-100 flex items-center justify-center">
                  {loading ? (
                    <div className="text-xl text-slate-600">
                      --°C
                    </div>
                  ) : weather?.current ? (
                    <div className="text-3xl font-bold">
                      {Math.round(
                        weather.current
                          .temperature
                      )}
                      °C
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      --°C
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="text-sm text-slate-700">
                    {weather
                      ?.location
                      ?.name ??
                      (profile?.farmLocation ??
                        "—")}
                  </div>

                  <div className="mt-2 text-slate-600">
                    {weather?.current ? (
                      <div className="flex items-center gap-2">
                        {weatherIcon(
                          weather
                            .current
                            .weathercode
                        )}

                        <div>
                          <div className="text-sm">
                            {new Date(
                              weather
                                .current
                                .time
                            ).toLocaleString(
                              locale
                            )}
                          </div>

                          <div className="text-xs text-slate-500">
                            Wind{" "}
                            {Math.round(
                              weather
                                .current
                                .windspeed
                            )}{" "}
                            km/h
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        {t.no_data}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  className="flex-1"
                  placeholder={
                    t.manual_placeholder
                  }
                  value={
                    cityInput
                  }
                  onChange={(e) =>
                    setCityInput(
                      e.target.value
                    )
                  }
                />

                <Button
                  onClick={() =>
                    handleManualFetch(
                      false
                    )
                  }
                  disabled={
                    !cityInput.trim()
                  }
                >
                  <Search className="mr-2 h-4 w-4" />
                  {t.fetch}
                </Button>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  id="saveProfile"
                  type="checkbox"
                  checked={
                    saveToProfile
                  }
                  onChange={(e) =>
                    setSaveToProfile(
                      e.target
                        .checked
                    )
                  }
                />

                <label
                  htmlFor="saveProfile"
                  className="text-sm text-slate-600"
                >
                  {t.save_location}
                </label>

                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      speechPlaying
                        ? stopSpeech()
                        : speak()
                    }
                    className="bg-slate-900 text-white"
                  >
                    <Speaker className="h-4 w-4 mr-2" />
                    {speechPlaying
                      ? "Stop"
                      : t.listen}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast large block */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Calendar className="h-4 w-4" />
                  {t.seven_day}
                </CardTitle>
              </CardHeader>

              <CardContent>
                {!weather ? (
                  <div className="text-slate-600">
                    {t.no_data}
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto py-2">
                    {weather.daily.map(
                      (d) => {
                        const dt =
                          new Date(
                            d.date
                          );

                        const dayName =
                          dt.toLocaleDateString(
                            locale,
                            {
                              weekday:
                                "short",
                            }
                          );

                        return (
                          <div
                            key={
                              d.date
                            }
                            className="min-w-[170px] bg-white/50 rounded-lg p-3 border border-slate-200"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-sm font-semibold text-slate-800">
                                  {
                                    dayName
                                  }
                                </div>

                                <div className="text-xs text-slate-600">
                                  {
                                    d.date
                                  }
                                </div>
                              </div>

                              <div>
                                {weatherIcon(
                                  d.weathercode
                                )}
                              </div>
                            </div>

                            <div className="mt-3">
                              <div className="text-2xl font-bold text-slate-800">
                                {Math.round(
                                  d.temp_max
                                )}
                                °
                              </div>

                              <div className="text-xs text-slate-600">
                                {Math.round(
                                  d.temp_min
                                )}
                                °
                              </div>
                            </div>

                            <div className="mt-3 text-xs text-slate-600 grid grid-cols-3 gap-2">
                              <div>
                                <div className="text-[11px]">
                                  Rain
                                </div>

                                <div className="font-medium">
                                  {d.pop ??
                                    0}
                                  %
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px]">
                                  Wind
                                </div>

                                <div className="font-medium">
                                  {Math.round(
                                    d.windspeed_max
                                  )}{" "}
                                  km/h
                                </div>
                              </div>

                              <div>
                                <div className="text-[11px]">
                                  Precip
                                </div>

                                <div className="font-medium">
                                  {(
                                    d.precip_mm ??
                                    0
                                  ).toFixed(
                                    1
                                  )}{" "}
                                  mm
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advisories */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-slate-800">
            {t.advisories}
          </h2>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="text-slate-600">
                Loading…
              </div>
            ) : !weather ? (
              <div className="text-slate-600">
                {t.no_data}
              </div>
            ) : (
              <>
                {weather.advisories.map(
                  (a) => (
                    <Card
                      key={a.id}
                      className="bg-white border border-slate-200"
                    >
                      <CardContent>
                        <div className="flex gap-3">
                          <div className="mt-1">
                            {a.severity ===
                            "high" ? (
                              <div className="w-8 h-8 bg-red-500 text-white flex items-center justify-center rounded-full font-bold">
                                !
                              </div>
                            ) : a.severity ===
                              "medium" ? (
                              <div className="w-8 h-8 bg-yellow-400 text-black flex items-center justify-center rounded-full font-bold">
                                !
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center rounded-full">
                                i
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-medium">
                              {locale ===
                              "en-US"
                                ? a.message_en
                                : translateAdvisory(
                                    a.message_en,
                                    locale
                                  )}
                            </div>

                            <div className="text-xs text-slate-500 mt-1">
                              ID:{" "}
                              {a.id}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}

                <div className="md:col-span-2">
                  <h3 className="mt-4 mb-2 text-lg font-semibold text-slate-800">
                    Crop-specific advice
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cropAdvisories.length ===
                    0 ? (
                      <div className="text-slate-600">
                        No crop-specific
                        advisories. Add
                        crops in profile
                        to get
                        personalized tips.
                      </div>
                    ) : (
                      cropAdvisories.map(
                        (c) => (
                          <Card
                            key={c.id}
                            className="bg-white border border-slate-200"
                          >
                            <CardContent>
                              <div className="flex gap-3">
                                <div className="mt-1">
                                  {c.severity ===
                                  "high" ? (
                                    <div className="w-8 h-8 bg-red-500 text-white flex items-center justify-center rounded-full font-bold">
                                      !
                                    </div>
                                  ) : c.severity ===
                                    "medium" ? (
                                    <div className="w-8 h-8 bg-yellow-400 text-black flex items-center justify-center rounded-full font-bold">
                                      !
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 bg-green-600 text-white flex items-center justify-center rounded-full">
                                      i
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="font-medium">
                                    {
                                      c.text
                                    }
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Today's tasks */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-800">
            {t.tasks}
          </h3>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {cropAdvisories.length ===
            0 ? (
              <div className="text-slate-600">
                Add crops in profile to
                get daily tasks.
              </div>
            ) : (
              cropAdvisories
                .slice(0, 6)
                .map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-3 rounded border border-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {c.severity ===
                        "high"
                          ? "⚠️"
                          : c.severity ===
                            "medium"
                          ? "🔶"
                          : "✅"}
                      </div>

                      <div>
                        <div className="font-medium text-slate-800">
                          {c.text}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          Action:{" "}
                          {c.severity ===
                          "high"
                            ? "Immediate"
                            : c.severity ===
                              "medium"
                            ? "Soon"
                            : "Monitor"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="mt-8 text-xs text-slate-500">
          Tip: Update your farm crops
          and location in Profile for
          better personalization.
        </div>
      </div>

      {/* Animations CSS */}
      <style jsx>{`
        .cloud {
          position: absolute;
          top: 8%;
          left: -40%;
          width: 520px;
          height: 140px;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.18),
            rgba(255, 255, 255, 0.06)
          );
          border-radius: 60px;
          filter: blur(14px);
          opacity: 0.85;
          animation: cloudMove 48s linear infinite;
        }

        .cloud-2 {
          top: 22%;
          left: -60%;
          width: 640px;
          height: 160px;
          animation-duration: 64s;
          opacity: 0.7;
        }

        .cloud-3 {
          top: 36%;
          left: -20%;
          width: 360px;
          height: 100px;
          animation-duration: 32s;
          opacity: 0.6;
        }

        @keyframes cloudMove {
          0% {
            transform: translateX(0);
          }

          100% {
            transform: translateX(180%);
          }
        }

        .rain-layer {
          position: absolute;
          inset: 0;
          z-index: 12;
          pointer-events: none;
        }

        .rain,
        .rain.delay {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .rain::before,
        .rain.delay::before {
          content: "";
          position: absolute;
          left: -10%;
          width: 120%;
          height: 300%;
          background-image: linear-gradient(
            rgba(255, 255, 255, 0.06) 1px,
            transparent 1px
          );
          background-size: 2px 12px;
          transform: translateY(-30%);
          animation: rainFall 0.9s linear infinite;
          opacity: 0.8;
        }

        .rain.delay::before {
          animation-delay: 0.4s;
          opacity: 0.6;
        }

        @keyframes rainFall {
          0% {
            transform: translateY(-30%);
          }

          100% {
            transform: translateY(120%);
          }
        }

        .soil-shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.02),
            rgba(255, 255, 255, 0.06),
            rgba(255, 255, 255, 0.02)
          );
          animation: shimmer 2.5s ease-in-out infinite;
          opacity: 0.5;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-30%);
          }

          50% {
            transform: translateX(30%);
          }

          100% {
            transform: translateX(-30%);
          }
        }

        @media (max-width: 768px) {
          .cloud,
          .cloud-2,
          .cloud-3 {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}