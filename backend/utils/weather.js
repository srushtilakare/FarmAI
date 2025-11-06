const axios = require("axios");

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

async function getWeather(lat, lon, lang = "en") {
  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat,
          lon,
          appid: OPENWEATHER_API_KEY,
          units: "metric",
          lang,
        },
      }
    );
    const data = response.data;
    return `Current weather: ${data.weather[0].description}, Temp: ${data.main.temp}°C, Humidity: ${data.main.humidity}%`;
  } catch (err) {
    console.error(err);
    return "Unable to fetch weather data right now.";
  }
}

module.exports = { getWeather };
