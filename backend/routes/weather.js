// backend/routes/weather.js
// Express route for weather using Open-Meteo (free, no API key)
// Usage: GET /api/weather?city=CityName
//        GET /api/weather?lat=12.97&lon=77.59

const express = require("express");
const router = express.Router();
const { logActivity, getUserIdFromRequest } = require("./activities");

const fetchFrom = global.fetch || require("node-fetch");

// Helper: get lat/lon from city (Open-Meteo geocoding)
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=en&format=json`;
  const r = await fetchFrom(url);
  const j = await r.json();
  if (j && j.results && j.results.length > 0) {
    const g = j.results[0];
    return { latitude: g.latitude, longitude: g.longitude, name: g.name, country: g.country };
  }
  return null;
}

function buildAdvisories(locationName, daily) {
  // daily is array of objects with date, temp_max, temp_min, precip_mm, pop, windspeed_max
  const adv = [];

  // Check for heavy rain
  daily.forEach((d) => {
    if (d.pop >= 70 || d.precip_mm >= 20) {
      adv.push({
        id: `rain-${d.date}`,
        severity: "high",
        message_en: `Heavy rain likely on ${d.date}. Avoid pesticide/fertilizer spray and secure stored produce.`,
      });
    } else if (d.pop >= 40) {
      adv.push({
        id: `rain-med-${d.date}`,
        severity: "medium",
        message_en: `Moderate chance of rain on ${d.date}. Plan field activities accordingly.`,
      });
    }
  });

  // High temperature alerts (need irrigation / heat stress)
  const hotDays = daily.filter((d) => d.temp_max >= 35);
  hotDays.forEach((d) => {
    adv.push({
      id: `heat-${d.date}`,
      severity: "medium",
      message_en: `High temperature (≈ ${d.temp_max}°C) on ${d.date}. Consider irrigation and shade for sensitive crops.`,
    });
  });

  // Strong wind warnings for spraying
  daily.forEach((d) => {
    if (d.windspeed_max >= 40) {
      adv.push({
        id: `wind-${d.date}`,
        severity: "medium",
        message_en: `Strong winds (~${d.windspeed_max} km/h) expected on ${d.date}. Avoid spraying pesticides that day.`,
      });
    }
  });

  // Low rain across week → irrigation recommended
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

  // If no advisories, give general tip
  if (adv.length === 0) {
    adv.push({
      id: "general",
      severity: "info",
      message_en: `No major weather warnings for the next 7 days. Continue regular farm care.`,
    });
  }

  // Personalization hook: you could add crop-specific advice here (left generic)
  return adv;
}

router.get("/weather", async (req, res) => {
  try {
    let { city, lat, lon, days } = req.query;
    days = Math.min(7, Number(days) || 7);

    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);
    let locationName = city || "Unknown location";

    if ((!latitude || !longitude) && city) {
      const geo = await geocodeCity(city);
      if (!geo) {
        return res.status(404).json({ status: "error", message: "Location not found" });
      }
      latitude = geo.latitude;
      longitude = geo.longitude;
      locationName = `${geo.name}, ${geo.country || ""}`.trim();
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ status: "error", message: "Provide city or lat & lon" });
    }

    // Open-Meteo forecast call (daily + current)
    const dailyParams = [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "precipitation_probability_max",
      "weathercode",
      "windspeed_10m_max",
      "uv_index_max",
    ].join(",");

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=${dailyParams}&current_weather=true&timezone=auto&forecast_days=${days}`;

    const r = await fetchFrom(url);
    const j = await r.json();

    if (!j) {
      return res.status(500).json({ status: "error", message: "Failed to fetch forecast" });
    }

    const current = j.current_weather || null;
    const dailyData = [];
    if (j.daily) {
      const dates = j.daily.time || [];
      const tmax = j.daily.temperature_2m_max || [];
      const tmin = j.daily.temperature_2m_min || [];
      const precip = j.daily.precipitation_sum || [];
      const pop = j.daily.precipitation_probability_max || [];
      const wmax = j.daily.windspeed_10m_max || [];
      const weathercode = j.daily.weathercode || [];
      const uv = j.daily.uv_index_max || [];

      for (let i = 0; i < dates.length; i++) {
        dailyData.push({
          date: dates[i],
          temp_max: tmax[i],
          temp_min: tmin[i],
          precip_mm: precip[i],
          pop: pop[i], // precipitation probability %
          windspeed_max: wmax[i],
          weathercode: weathercode[i],
          uv_index_max: uv[i] || null,
        });
      }
    }

    const advisories = buildAdvisories(locationName, dailyData);

    // Log activity (optional - only if user is authenticated)
    const userId = await getUserIdFromRequest(req);
    if (userId) {
      await logActivity(userId, {
        activityType: 'weather-alert',
        title: `Weather Check - ${locationName}`,
        description: `Checked weather forecast for ${locationName} (${days} days)`,
        status: 'completed',
        result: `${advisories.length} advisories generated`,
        metadata: { location: locationName, days, advisoryCount: advisories.length }
      });
    }

    return res.json({
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
  } catch (err) {
    console.error("Weather route error:", err);
    return res.status(500).json({ status: "error", message: "Server error", error: err.message });
  }
});

module.exports = router;
