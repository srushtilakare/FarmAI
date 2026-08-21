// backend/routes/weather.js
// Express route for weather using Open-Meteo (free, no API key)
//
// Usage:
// GET /api/backend-weather/weather?city=CityName
// GET /api/backend-weather/weather?lat=12.97&lon=77.59

const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");

const {
  logActivity,
  getUserIdFromRequest,
} = require("./activities");

const fetchFrom =
  global.fetch || require("node-fetch");

// ============================================================
// HELPER: GET LAT/LON FROM CITY
// ============================================================

async function geocodeCity(city) {
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city
    )}&count=1&language=en&format=json`;

  const response = await fetchFrom(url);
  const data = await response.json();

  if (
    data &&
    data.results &&
    data.results.length > 0
  ) {
    const location = data.results[0];

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      country: location.country,
    };
  }

  return null;
}

// ============================================================
// BUILD WEATHER ADVISORIES
// ============================================================

function buildAdvisories(locationName, daily) {
  const advisories = [];

  // ----------------------------------------------------------
  // HEAVY / MODERATE RAIN
  // ----------------------------------------------------------

  daily.forEach((day) => {
    // High rain alert
    if (
      day.pop >= 70 ||
      day.precip_mm >= 20
    ) {
      advisories.push({
        id: `rain-${day.date}`,
        severity: "high",
        message_en:
          `Heavy rain likely on ${day.date}. ` +
          `Avoid pesticide/fertilizer spray and secure stored produce.`,
      });
    }

    // Moderate rain
    else if (day.pop >= 40) {
      advisories.push({
        id: `rain-med-${day.date}`,
        severity: "medium",
        message_en:
          `Moderate chance of rain on ${day.date}. ` +
          `Plan field activities accordingly.`,
      });
    }
  });

  // ----------------------------------------------------------
  // HIGH TEMPERATURE
  // ----------------------------------------------------------

  const hotDays = daily.filter(
    (day) => day.temp_max >= 35
  );

  hotDays.forEach((day) => {
    advisories.push({
      id: `heat-${day.date}`,
      severity: "medium",
      message_en:
        `High temperature (≈ ${day.temp_max}°C) on ${day.date}. ` +
        `Consider irrigation and shade for sensitive crops.`,
    });
  });

  // ----------------------------------------------------------
  // STRONG WIND
  // ----------------------------------------------------------

  daily.forEach((day) => {
    if (day.windspeed_max >= 40) {
      advisories.push({
        id: `wind-${day.date}`,
        severity: "medium",
        message_en:
          `Strong winds (~${day.windspeed_max} km/h) expected on ${day.date}. ` +
          `Avoid spraying pesticides that day.`,
      });
    }
  });

  // ----------------------------------------------------------
  // LOW RAINFALL
  // ----------------------------------------------------------

  const totalWeekPrecip = daily.reduce(
    (sum, day) =>
      sum + (day.precip_mm || 0),
    0
  );

  if (totalWeekPrecip < 5) {
    advisories.push({
      id: "dry-week",
      severity: "info",
      message_en:
        `Low rainfall expected this week (~${totalWeekPrecip.toFixed(
          1
        )} mm). ` +
        `Plan irrigation for water-sensitive crops.`,
    });
  }

  // ----------------------------------------------------------
  // NO MAJOR WARNING
  // ----------------------------------------------------------

  if (advisories.length === 0) {
    advisories.push({
      id: "general",
      severity: "info",
      message_en:
        `No major weather warnings for the next 7 days. ` +
        `Continue regular farm care.`,
    });
  }

  return advisories;
}

// ============================================================
// CREATE WEATHER NOTIFICATIONS
// ============================================================

async function createWeatherNotifications(
  userId,
  locationName,
  advisories
) {
  if (!userId || !advisories?.length) {
    return [];
  }

  const createdNotifications = [];

  for (const advisory of advisories) {
    // --------------------------------------------------------
    // Don't create notification for the generic message
    // --------------------------------------------------------

    if (advisory.id === "general") {
      continue;
    }

    // --------------------------------------------------------
    // Unique key prevents duplicate notifications
    //
    // Example:
    // weather:USER_ID:rain-2026-08-21
    // --------------------------------------------------------

    const uniqueKey =
      `weather:${userId}:${advisory.id}`;

    // --------------------------------------------------------
    // Check whether this alert was already created
    // --------------------------------------------------------

    const existing =
      await Notification.findOne({
        recipient: userId,
        uniqueKey,
      });

    if (existing) {
      continue;
    }

    // --------------------------------------------------------
    // Choose title based on severity
    // --------------------------------------------------------

    let title = "Weather Alert";

    if (advisory.severity === "high") {
      title = "🌧️ Heavy Rain Alert";
    } else if (
      advisory.id.startsWith("rain")
    ) {
      title = "🌦️ Rain Advisory";
    } else if (
      advisory.id.startsWith("heat")
    ) {
      title = "🌡️ Heat Alert";
    } else if (
      advisory.id.startsWith("wind")
    ) {
      title = "💨 Strong Wind Alert";
    } else if (
      advisory.id === "dry-week"
    ) {
      title = "💧 Low Rainfall Advisory";
    }

    // --------------------------------------------------------
    // Create notification
    // --------------------------------------------------------

    const notification =
      await Notification.create({
        recipient: userId,

        sender: null,

        senderName: "FarmAI Weather",

        type: "weather_alert",

        category: "farming",

        title,

        message:
          `${advisory.message_en} ` +
          `Location: ${locationName}.`,

        icon: "cloud-rain",

        relatedId: null,

        relatedModel: "Weather",

        link: "/dashboard/weather-alerts",

        isRead: false,

        readAt: null,

        metadata: {
          location: locationName,
          severity: advisory.severity,
          advisoryId: advisory.id,
          source: "open-meteo",
        },

        uniqueKey,
      });

    createdNotifications.push(
      notification
    );
  }

  return createdNotifications;
}

// ============================================================
// WEATHER ROUTE
// ============================================================

router.get(
  "/weather",
  async (req, res) => {
    try {
      let {
        city,
        lat,
        lon,
        days,
      } = req.query;

      days = Math.min(
        7,
        Number(days) || 7
      );

      // ------------------------------------------------------
      // LOCATION
      // ------------------------------------------------------

      let latitude = parseFloat(lat);
      let longitude = parseFloat(lon);

      let locationName =
        city || "Unknown location";

      // ------------------------------------------------------
      // CITY → LAT/LON
      // ------------------------------------------------------

      if (
        (!latitude || !longitude) &&
        city
      ) {
        const geo =
          await geocodeCity(city);

        if (!geo) {
          return res.status(404).json({
            status: "error",
            message: "Location not found",
          });
        }

        latitude = geo.latitude;
        longitude = geo.longitude;

        locationName =
          `${geo.name}, ${
            geo.country || ""
          }`.trim();
      }

      // ------------------------------------------------------
      // VALIDATE LOCATION
      // ------------------------------------------------------

      if (
        !latitude ||
        !longitude
      ) {
        return res.status(400).json({
          status: "error",
          message:
            "Provide city or lat & lon",
        });
      }

      // ======================================================
      // OPEN-METEO FORECAST
      // ======================================================

      const dailyParams = [
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "precipitation_probability_max",
        "weathercode",
        "windspeed_10m_max",
        "uv_index_max",
      ].join(",");

      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        `&daily=${dailyParams}` +
        `&current_weather=true` +
        `&timezone=auto` +
        `&forecast_days=${days}`;

      const response =
        await fetchFrom(url);

      const data =
        await response.json();

      if (!data) {
        return res.status(500).json({
          status: "error",
          message:
            "Failed to fetch forecast",
        });
      }

      // ======================================================
      // CURRENT WEATHER
      // ======================================================

      const current =
        data.current_weather ||
        null;

      // ======================================================
      // DAILY WEATHER
      // ======================================================

      const dailyData = [];

      if (data.daily) {
        const dates =
          data.daily.time || [];

        const tmax =
          data.daily
            .temperature_2m_max || [];

        const tmin =
          data.daily
            .temperature_2m_min || [];

        const precip =
          data.daily
            .precipitation_sum || [];

        const pop =
          data.daily
            .precipitation_probability_max ||
          [];

        const wmax =
          data.daily
            .windspeed_10m_max || [];

        const weathercode =
          data.daily.weathercode || [];

        const uv =
          data.daily.uv_index_max || [];

        for (
          let i = 0;
          i < dates.length;
          i++
        ) {
          dailyData.push({
            date: dates[i],

            temp_max:
              tmax[i],

            temp_min:
              tmin[i],

            precip_mm:
              precip[i],

            pop:
              pop[i],

            windspeed_max:
              wmax[i],

            weathercode:
              weathercode[i],

            uv_index_max:
              uv[i] ?? null,
          });
        }
      }

      // ======================================================
      // BUILD ADVISORIES
      // ======================================================

      const advisories =
        buildAdvisories(
          locationName,
          dailyData
        );

      // ======================================================
      // GET AUTHENTICATED USER
      // ======================================================

      const userId =
        await getUserIdFromRequest(
          req
        );

      // ======================================================
      // CREATE WEATHER NOTIFICATIONS
      // ======================================================

      let createdNotifications = [];

      if (userId) {
        try {
          createdNotifications =
            await createWeatherNotifications(
              userId,
              locationName,
              advisories
            );

          console.log(
            `🌦️ Weather notifications created: ${createdNotifications.length}`
          );
        } catch (notificationError) {
          // Do not break the weather API
          // if notification creation fails.

          console.error(
            "Weather notification creation error:",
            notificationError
          );
        }

        // ====================================================
        // LOG WEATHER ACTIVITY
        // ====================================================

        try {
          await logActivity(
            userId,
            {
              activityType:
                "weather-alert",

              title:
                `Weather Check - ${locationName}`,

              description:
                `Checked weather forecast for ${locationName} (${days} days)`,

              status:
                "completed",

              result:
                `${advisories.length} advisories generated`,

              metadata: {
                location:
                  locationName,

                days,

                advisoryCount:
                  advisories.length,

                notificationsCreated:
                  createdNotifications.length,
              },
            }
          );
        } catch (activityError) {
          console.error(
            "Weather activity logging error:",
            activityError
          );
        }
      }

      // ======================================================
      // RESPONSE
      // ======================================================

      return res.json({
        status: "ok",

        location: {
          name: locationName,
          latitude,
          longitude,
        },

        current: current
          ? {
              temperature:
                current.temperature,

              windspeed:
                current.windspeed,

              winddirection:
                current.winddirection,

              weathercode:
                current.weathercode,

              time:
                current.time,
            }
          : null,

        daily: dailyData,

        advisories,

        // Useful for testing
        notificationsCreated:
          createdNotifications.length,

        source: "open-meteo",
      });
    } catch (err) {
      console.error(
        "Weather route error:",
        err
      );

      return res.status(500).json({
        status: "error",
        message: "Server error",
        error: err.message,
      });
    }
  }
);

module.exports = router;