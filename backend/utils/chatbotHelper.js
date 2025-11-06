const { getWeather } = require("./weather");
const { predictCropDisease } = require("./cropPredict");

async function generateBotResponse({ message, location, language, imagePath }) {
  const input = message.toLowerCase();

  // Crop disease detection
  if ((input.includes("disease") || input.includes("pest")) && imagePath) {
    const disease = await predictCropDisease(imagePath);
    if (disease) {
      return `Based on the image, your crop might have: ${disease}.`;
    } else {
      return "I couldn't detect any disease from the image. Please try a clearer photo.";
    }
  }

  // Weather queries
  if (input.includes("weather") || input.includes("rain")) {
    const weatherInfo = await getWeather(location.lat, location.lon, language);
    return `Weather info for your area: ${weatherInfo}`;
  }

  // Market prices
  if (input.includes("price") || input.includes("market")) {
    // For demo, static prices (you can integrate real API later)
    return language === "hi"
      ? "आज के बाजार में टमाटर ₹25/kg, आलू ₹20/kg हैं।"
      : language === "mr"
      ? "आजच्या बाजारात टोमॅटो ₹25/kg, बटाटे ₹20/kg आहेत."
      : "Current market prices: Tomato ₹25/kg, Potato ₹20/kg.";
  }

  // Crop advisory
  if (input.includes("crop") || input.includes("plant")) {
    return language === "hi"
      ? "आपके क्षेत्र और मौसम के अनुसार, अब मक्का और मूँग फसल अच्छी रहेगी।"
      : language === "mr"
      ? "आपल्या भाग आणि हवामानानुसार, आता मक्याची आणि मूगची पिके चांगली राहतील."
      : "Based on your location and season, maize and moong crops are suitable now.";
  }

  // Soil/fertilizer queries
  if (input.includes("soil") || input.includes("fertilizer")) {
    return language === "hi"
      ? "मिट्टी की जाँच और उचित उर्वरक का उपयोग करें।"
      : language === "mr"
      ? "मातीची चाचणी करा आणि योग्य खत वापरा."
      : "Regular soil testing and proper fertilizer use is recommended.";
  }

  // Default fallback
  return language === "hi"
    ? "मैं आपकी कृषि सहायता के लिए यहाँ हूँ! कृपया अपना प्रश्न पूछें।"
    : language === "mr"
    ? "मी तुमच्या शेतीसाठी येथे आहे! कृपया आपला प्रश्न विचारा."
    : "I'm here to assist with your farming needs! Please ask your question.";
}

module.exports = { generateBotResponse };
