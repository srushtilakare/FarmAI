// app/api/weather/route.ts
import { NextResponse } from "next/server";

const GEOCODE_BASE = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_BASE = "https://api.open-meteo.com/v1/forecast";

async function fetchJson(url: string) {
  const r = await fetch(url);
  return r.json();
}

async function geocodeCity(city: string) {
  const url = `${GEOCODE_BASE}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const j = await fetchJson(url);
  if (j?.results?.length > 0) {
    const g = j.results[0];
    return { latitude: g.latitude, longitude: g.longitude, name: g.name, country: g.country };
  }
  return null;
}

function buildAdvisories(locationName: string, daily: any[]) {
  const adv: any[] = [];

  daily.forEach((d) => {
    if ((d.pop ?? 0) >= 70 || (d.precip_mm ?? 0) >= 20) {
      adv.push({
        id: `rain-${d.date}`,
        severity: "high",
        message_en: `Heavy rain likely on ${d.date}. Avoid pesticide/fertilizer spray and secure stored produce.`,
      });
    } else if ((d.pop ?? 0) >= 40) {
      adv.push({
        id: `rain-med-${d.date}`,
        severity: "medium",
        message_en: `Moderate chance of rain on ${d.date}. Plan field activities accordingly.`,
      });
    }
  });

  const hotDays = daily.filter((d) => d.temp_max >= 35);
  hotDays.forEach((d) => {
    adv.push({
      id: `heat-${d.date}`,
      severity: "medium",
      message_en: `High temperature (≈ ${d.temp_max}°C) on ${d.date}. Consider irrigation and shade for sensitive crops.`,
    });
  });

  daily.forEach((d) => {
    if ((d.windspeed_max ?? 0) >= 40) {
      adv.push({
        id: `wind-${d.date}`,
        severity: "medium",
        message_en: `Strong winds (~${d.windspeed_max} km/h) expected on ${d.date}. Avoid spraying pesticides that day.`,
      });
    }
  });

  const totalWeekPrecip = daily.reduce((s, d) => s + (d.precip_mm || 0), 0);
  if (totalWeekPrecip < 5) {
    adv.push({
      id: `dry-week`,
      severity: "info",
      message_en: `Low rainfall expected this week (~${totalWeekPrecip.toFixed(
        1
      )} mm). Plan irrigation for water-sensitive crops.`,
    });
  }

  if (adv.length === 0) {
    adv.push({
      id: "general",
      severity: "info",
      message_en: `No major weather warnings for the next 7 days. Continue regular farm care.`,
    });
  }
  return adv;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city") || undefined;
    const lat = url.searchParams.get("lat") || undefined;
    const lon = url.searchParams.get("lon") || undefined;
    const days = Math.min(7, Number(url.searchParams.get("days") || "7"));

    let latitude: number | undefined = lat ? Number(lat) : undefined;
    let longitude: number | undefined = lon ? Number(lon) : undefined;
    let locationName = city ?? "Unknown";

    if ((!latitude || !longitude) && city) {
      const geo = await geocodeCity(city);
      if (!geo) {
        return NextResponse.json({ status: "error", message: "Location not found" }, { status: 404 });
      }
      latitude = geo.latitude;
      longitude = geo.longitude;
      locationName = `${geo.name}, ${geo.country ?? ""}`.trim();
    }

    if (!latitude || !longitude) {
      return NextResponse.json({ status: "error", message: "Provide city or lat & lon" }, { status: 400 });
    }

    const dailyParams = [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "weathercode",
      "windspeed_10m_max",
      "uv_index_max",
    ].join(",");

    const forecastUrl = `${FORECAST_BASE}?latitude=${latitude}&longitude=${longitude}` +
      `&daily=${dailyParams}&current_weather=true&timezone=auto&forecast_days=${days}`;

    const j = await fetchJson(forecastUrl);

    const current = j.current_weather ?? null;
    const dailyData: any[] = [];

    if (j.daily) {
      const times = j.daily.time || [];
      const tmax = j.daily.temperature_2m_max || [];
      const tmin = j.daily.temperature_2m_min || [];
      const precip = j.daily.precipitation_sum || [];
      const pop = j.daily.precipitation_probability_max || [];
      const wmax = j.daily.windspeed_10m_max || [];
      const weathercode = j.daily.weathercode || [];
      const uv = j.daily.uv_index_max || [];

      for (let i = 0; i < times.length; i++) {
        dailyData.push({
          date: times[i],
          temp_max: tmax[i],
          temp_min: tmin[i],
          precip_mm: precip[i],
          pop: pop[i],
          windspeed_max: wmax[i],
          weathercode: weathercode[i],
          uv_index_max: uv[i] ?? null,
        });
      }
    }

    const advisories = buildAdvisories(locationName, dailyData);

    return NextResponse.json({
      status: "ok",
      location: { name: locationName, latitude, longitude },
      current: current
        ? {
            temperature: current.temperature,
            windspeed: current.windspeed,
            winddirection: current.winddirection,
            weathercode: current.weathercode,
            time: current.time,
          }
        : null,
      daily: dailyData,
      advisories,
      source: "open-meteo",
    });
  } catch (err: any) {
    console.error("API /api/weather error:", err);
    return NextResponse.json({ status: "error", message: err?.message || "Server error" }, { status: 500 });
  }
}
