// backend/utils/farmiiEngine.js
// Next-Generation AI Agricultural Engine for Farmii (FarmAI)
// Powered by Gemini Flash (Free Tier) + Real-time Weather + Farmer Profile Context + Offline Agronomist Rules

const axios = require("axios");
const { GoogleGenAI } = require("@google/genai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_WEATHER_API_KEY;

// Candidate Gemini models in order of performance, speed, and free tier availability
const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

/**
 * Fetch live weather using OpenWeatherMap or Open-Meteo (100% free, no key required fallback)
 */
async function fetchLiveWeather(lat, lon, cityName = "") {
  try {
    // If coordinates are provided and OpenWeather API key is present
    if (lat && lon && OPENWEATHER_API_KEY) {
      try {
        const res = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
          { timeout: 4000 }
        );
        const w = res.data;
        return `Current weather in ${w.name || cityName || "your farm"}: ${w.weather[0]?.description || "clear"}, ${Math.round(w.main.temp)}°C, humidity ${w.main.humidity}%, wind ${Math.round(w.wind?.speed || 0)} km/h.`;
      } catch (e) {
        // Fall through to Open-Meteo
      }
    }

    // Free Open-Meteo fallback (zero API key needed)
    if (lat && lon) {
      const omRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code&timezone=auto`,
        { timeout: 4000 }
      );
      const curr = omRes.data?.current;
      if (curr) {
        return `Current farm weather: Temperature ${curr.temperature_2m}°C, Humidity ${curr.relative_humidity_2m}%, Precipitation ${curr.precipitation}mm.`;
      }
    }

    // If city name is provided without coordinates, try OpenWeather by city
    if (cityName && OPENWEATHER_API_KEY) {
      const cityRes = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${OPENWEATHER_API_KEY}&units=metric`,
        { timeout: 4000 }
      );
      const w = cityRes.data;
      return `Current weather in ${w.name}: ${w.weather[0]?.description || "fair"}, ${Math.round(w.main.temp)}°C, humidity ${w.main.humidity}%.`;
    }
  } catch (err) {
    console.warn("Weather fetch skipped:", err.message);
  }
  return "";
}

/**
 * Build personalized agricultural system instruction for Gemini
 */
function buildSystemInstruction(farmer, weatherInfo, language = "en") {
  const name = farmer?.fullName || "Farmer Friend";
  const location = farmer?.farmLocation || farmer?.district || "India";
  const state = farmer?.state || "";
  const district = farmer?.district || "";
  const village = farmer?.village || "";
  const crops = Array.isArray(farmer?.crops) && farmer.crops.length > 0 
    ? farmer.crops.join(", ") 
    : "General Indian crops (Tomato, Wheat, Rice, Cotton, Sugarcane, Onion, Potato)";
  const farmingType = farmer?.farmingType || "traditional";
  const category = farmer?.farmerCategory ? `${farmer.farmerCategory} farmer` : "farmer";

  let langInstruction = "Respond in English. Keep answers clear, practical, and respectful.";
  const l = (language || "").toLowerCase();
  if (l.includes("hi") || l.includes("hindi")) {
    langInstruction = "आप शुद्ध, सरल और विनम्र हिंदी (Hindi) में उत्तर दें। सम्मानपूर्वक 'नमस्ते [Name] जी' या 'किसान भाई' कहें।";
  } else if (l.includes("mr") || l.includes("marathi")) {
    langInstruction = "तुम्ही शुद्ध, सोप्या आणि आदरयुक्त मराठीत (Marathi) उत्तर द्या. 'नमस्कार [Name] जी' किंवा 'शेतकरी मित्र' म्हणून संवाद साधा.";
  }

  return `
You are "Farmii" (फार्मी), the smart, trusted AI agricultural companion of FarmAI, created specifically to empower Indian farmers.

FARMER PROFILE CONTEXT:
- Farmer Name: ${name}
- Location: ${location} ${district ? `(District: ${district})` : ""} ${state ? `(State: ${state})` : ""} ${village ? `(Village: ${village})` : ""}
- Registered Crops: ${crops}
- Farming Practice: ${farmingType} (${farmingType === "organic" ? "Strictly prioritize organic methods, bio-fertilizers like Jeevamrut, Neem oil, Trichoderma, Dashparni ark" : "Recommend Integrated Pest Management (IPM), balancing safe chemicals and organic alternatives"})
- Farmer Scale: ${category}
${weatherInfo ? `- Live Farm Weather: ${weatherInfo}` : ""}

LANGUAGE REQUIREMENT:
${langInstruction}
(If the farmer writes to you in Marathi, respond in Marathi. If in Hindi, respond in Hindi. If in English, respond in English. If they use Hinglish or Marathi in English script, respond in their chosen language).

YOUR CORE PRINCIPLES:
1. Warm & Respectful: Treat the farmer with dignity. Use honorifics ("जी", "शेतकरी मित्र").
2. Practical & Direct: Farmers are busy in the field. Put the direct solution in the first sentence.
3. Exact Dosage per Pump: Always specify EXACT spray dosages (e.g., "२५ ते ३० ग्रॅम प्रति १५ लिटर पाण्याचा पंप" or "2 ml per liter of water").
4. Dual Solutions: Provide the most effective solution (chemical if needed) PLUS an organic alternative (neem oil, buttermilk, bio-fungicides).
5. Field Tips: Remind them to spray in early morning/evening, use a sticker/spreader in rain, and wear a mask.
6. Localized: Keep recommendations suited to Indian agricultural seasons (Kharif, Rabi, Zaid) and local mandi conditions.
7. Kisan Helpline: For critical emergencies, remind them of Kisan Call Centre: 1800-180-1551.
8. Formatting: Use neat markdown with bullet points and bold highlights for dosages. Keep paragraphs concise for mobile screens.
`.trim();
}

/**
 * Intelligent Offline Expert Fallback (when all cloud AI APIs fail or network drops)
 */
function generateOfflineExpertResponse(message, farmer, language = "en") {
  const msg = (message || "").toLowerCase();
  const name = farmer?.fullName || "";
  const crops = farmer?.crops || [];
  const primaryCrop = crops[0] || "Tomato";
  const l = (language || "").toLowerCase();
  const isHi = l.includes("hi") || l.includes("hindi");
  const isMr = l.includes("mr") || l.includes("marathi");

  const greeting = isMr 
    ? `नमस्कार${name ? " " + name + " जी" : ""}! ` 
    : isHi 
    ? `नमस्ते${name ? " " + name + " जी" : ""}! ` 
    : `Hello${name ? " " + name : ""}! `;

  // 1. Cotton Bollworm / बोंडअळी / इल्ली
  if (msg.includes("बोंडअळी") || msg.includes("bondali") || msg.includes("bollworm") || msg.includes("सूंड़ी") || msg.includes("इल्ली") || (msg.includes("कापूस") && (msg.includes("अळी") || msg.includes("कीड")))) {
    if (isMr) {
      return `${greeting}कापूस पिकावरील **गुलाबी बोंडअळी (Pink Bollworm)** नियंत्रणासाठी तात्काळ खालील उपाययोजना करा:\n\n` +
        `* **रासायनिक फवारणी (तीव्र प्रादुर्भाव):**\n` +
        `  - **प्रोफेनोफॉस ५०% EC:** **३० ते ३५ मि.ली.** प्रति १५ लिटर पंप (किंवा प्रोफेनोफॉस + सायपरमेथ्रीन ४० मि.ली./पंप).\n` +
        `  - **इमामेक्टिन बेन्झोएट ५% SG (Proclaim):** **८ ते १० ग्रॅम** प्रति १५ लिटर पंप.\n` +
        `* **जैविक व सेंद्रिय नियंत्रण:**\n` +
        `  - शेतात एकरी ५ कामगंध सापळे (Pheromone Traps) लावा.\n` +
        `  - निंबोळी अर्क (Neem Oil १०,००० ppm) **३० ते ३५ मि.ली.** प्रति पंप फवारा.\n` +
        `* **महत्त्वाचा सल्ला:** किडीने बोंडात प्रवेश करण्यापूर्वीच फवारणी करावी व औषधात ५ मि.ली. स्टिकर अवश्य मिसळा.`;
    }
    if (isHi) {
      return `${greeting}कपास में **गुलाबी सुंडी (Pink Bollworm)** के प्रभावी नियंत्रण के लिए उपाय:\n\n` +
        `* **रासायनिक छिड़काव:**\n` +
        `  - **प्रोफेनोफॉस 50% EC:** **30-35 मिली** प्रति 15 लीटर पंप, या\n` +
        `  - **इमामेक्टिन बेंजोएट 5% SG:** **8-10 ग्राम** प्रति 15 लीटर पंप।\n` +
        `* **जैविक रोकथाम:** प्रति एकड़ 5 फेरोमोन ट्रैप लगाएं और नीम का तेल (10,000 ppm) **30 मिली प्रति पंप** छिड़कें।\n` +
        `* **सलाह:** कीटनाशक में स्टीकर/स्प्रेडर जरूर मिलाएं ताकि दवा अच्छे से चिपके।`;
    }
    return `${greeting}For controlling **Bollworm in Cotton**:\n\n` +
      `* **Chemical Spray:** Spray Emamectin Benzoate 5% SG @ **8-10g per 15L pump**, or Profenofos 50% EC @ **30-35ml per pump**.\n` +
      `* **Biological Control:** Install 5 Pheromone traps per acre to monitor moth activity. Spray Neem Oil 10,000 ppm @ **2ml/L**.\n` +
      `* **Tip:** Apply spray during early morning with a silicon sticker for maximum efficacy.`;
  }

  // 2. Soybean Stem Fly / खोडमाशी / खोडकीड
  if (msg.includes("खोडमाशी") || msg.includes("खोडकिडी") || msg.includes("stem fly") || msg.includes("stem borer") || (msg.includes("सोयाबीन") && (msg.includes("अळी") || msg.includes("कीड")))) {
    if (isMr) {
      return `${greeting}सोयाबीन पिकावरील **खोडमाशी व खोडकिडीच्या** नियंत्रणासाठी:\n\n` +
        `* **फवारणी पर्याय १:** अलिका (Thiamethoxam 12.6% + Lambda-cyhalothrin 9.5% ZC) **१० मि.ली.** प्रति १५ लिटर पंप.\n` +
        `* **फवारणी पर्याय २:** कोराजन (Chlorantraniliprole 18.5% SC) **४ मि.ली.** प्रति १५ लिटर पंप.\n` +
        `* **किंवा:** रोगोर / डायमेथोएट ३०% EC **३० मि.ली.** प्रति १५ लिटर पंप.\n` +
        `* **सल्ला:** फवारणी करताना झाडाच्या खोडापर्यंत औषध पोहोचेल याची खात्री करा आणि ५ मि.ली. स्टिकर नक्की वापरा.`;
    }
    if (isHi) {
      return `${greeting}सोयाबीन में **तना मक्खी (Stem Fly) और गर्डल बीटल** के नियंत्रण के लिए:\n\n` +
        `* **अलिका (Alika):** **10 मिली** प्रति 15 लीटर पंप, या\n` +
        `* **कोराजन (Coragen):** **4 मिली** प्रति 15 लीटर पंप का छिड़काव करें।\n` +
        `* **सलाह:** दवा तने तक पहुंचे और साथ में 5 मिली स्टीकर जरूर मिलाएं।`;
    }
    return `${greeting}For **Soybean Stem Fly / Borer** control:\n\n` +
      `* Spray Thiamethoxam + Lambda-cyhalothrin (Alika) @ **10ml per 15L pump**, or Chlorantraniliprole (Coragen) @ **4ml per pump**.\n` +
      `* Ensure spray thoroughly covers the stem base and add a silicon spreader.`;
  }

  // 3. General Pest / Disease / Sucking Pests / Blight
  if (msg.includes("pest") || msg.includes("disease") || msg.includes("keeda") || msg.includes("rog") || msg.includes("karpa") || msg.includes("blight") || msg.includes("curl") || msg.includes("sundi") || msg.includes("mava") || msg.includes("tudtude") || msg.includes("कीट") || msg.includes("रोग") || msg.includes("करपा") || msg.includes("कीड") || msg.includes("किडी") || msg.includes("अळी") || msg.includes("उपाय") || msg.includes("फवारणी") || msg.includes("छिड़काव")) {
    if (isMr) {
      return `${greeting}तुमच्या ${primaryCrop} पिकावरील कीड व रोग नियंत्रणासाठी योग्य मार्गदर्शन:\n\n` +
        `* **बुरशीजन्य रोग (करपा/मर/Blight):** मँकोझेब ७५% WP **३० ग्रॅम** किंवा साफ (Saaf - Carbendazim + Mancozeb) **३० ग्रॅम प्रति १५ लिटर पंप** फवारा.\n` +
        `* **रसशोषक किडी (मावा/तुडतुडे/थ्रिप्स):** इमिडाक्लोप्रिड १७.८% SL **५ मि.ली.** किंवा असिटामिप्रीड २०% SP **५ ते ६ ग्रॅम प्रति १५ लिटर पंप** फवारा.\n` +
        `* **सेंद्रिय पर्याय:** निंबोळी अर्क (Neem Oil १०,००० ppm) **३० मि.ली. प्रति पंप** किंवा दशपर्णी अर्क वापरा.\n` +
        `* **सल्ला:** फवारणी नेहमी सकाळी किंवा संध्याकाळी करा आणि औषधात ५ मि.ली. सिलिकॉन स्टिकर नक्की मिसळा.`;
    }
    if (isHi) {
      return `${greeting}आपकी ${primaryCrop} फसल में कीट व रोग नियंत्रण के लिए ये उपाय अपनाएं:\n\n` +
        `* **फफूंद/झुलसा (Blight):** मैंकोजेब 75% WP **30 ग्राम प्रति 15 लीटर पंप** या साफ (Saaf) **30 ग्राम प्रति पंप** का छिड़काव करें।\n` +
        `* **रस चूसक कीट (माहू/थ्रिप्स):** इमिडाक्लोप्रिड 17.8% SL **5 मिली प्रति 15 लीटर पंप** या नीम तेल **30 मिली प्रति पंप** छिड़कें।\n` +
        `* **सावधानी:** छिड़काव हमेशा सुबह या शाम को करें और साथ में स्टीकर/स्प्रेडर जरूर मिलाएं।`;
    }
    return `${greeting}For effective pest and disease management in your ${primaryCrop} crop:\n\n` +
      `* **Fungal Blight/Spots:** Spray Mancozeb 75% WP @ **30g per 15L pump** or Saaf (Carbendazim + Mancozeb) @ **30g per pump**.\n` +
      `* **Sucking Pests (Aphids/Thrips/Whitefly):** Spray Imidacloprid 17.8% SL @ **5ml per 15L pump** or Organic Neem Oil (10,000 ppm) @ **30ml per pump**.\n` +
      `* **Best Practice:** Spray during calm morning hours with a silicon-based sticker (5ml/pump).`;
  }

  // 4. Fertilizer / Khad / Soil / Nutrition
  if (msg.includes("fertilizer") || msg.includes("khad") || msg.includes("khat") || msg.includes("urea") || msg.includes("dap") || msg.includes("soil") || msg.includes("npk") || msg.includes("खत") || msg.includes("खाद") || msg.includes("उर्वरक") || msg.includes("टॉनिक") || msg.includes("tonic")) {
    if (isMr) {
      return `${greeting}तुमच्या ${primaryCrop} पिकासाठी संतुलित खत व्यवस्थापन:\n\n` +
        `* **पायाभूत खत (सुरुवातीला):** डीएपी (DAP) ५० किलो + पोटॅश २५ किलो प्रति एकर शेणखतात मिसळून द्या.\n` +
        `* **वाढीच्या अवस्थेत:** १९:१९:१९ (19:19:19) **५ ग्रॅम प्रति लिटर पाणी** फवारणी करा किंवा ठिबकद्वारे द्या.\n` +
        `* **फुलधारणा व फळधारणेच्या वेळी:** १२:६१:०० (12:61:00) किंवा ०:५२:३४ खत दिल्यास फळांची प्रत व वजन सुधारते.\n` +
        `* **सेंद्रिय पर्याय:** जीवामृत किंवा व्हर्मीकंपोस्ट (गांडूळ खत) जमिनीची सुपीकता वाढवण्यासाठी उत्तम आहे.`;
    }
    if (isHi) {
      return `${greeting}आपकी ${primaryCrop} फसल के लिए संतुलित उर्वरक सलाह:\n\n` +
        `* **बुवाई के समय:** डीएपी (DAP) 50 किग्रा + पोटाश 25 किग्रा प्रति एकड़ अच्छी सड़ी गोबर की खाद के साथ दें।\n` +
        `* **वानस्पतिक वृद्धि के समय:** यूरिया या 19:19:19 घुलनशील उर्वरक **5 ग्राम प्रति लीटर पानी** में मिलाकर छिड़कें।\n` +
        `* **फूल व फल बनते समय:** 0:52:34 या 0:0:50 का छिड़काव करने से फल का आकार व वजन बढ़ता है।\n` +
        `* **जैविक सलाह:** केंचुआ खाद (Vermicompost) और जीवामृत का नियमित उपयोग मिट्टी की उपजाऊ क्षमता बढ़ाता है।`;
    }
    return `${greeting}Balanced fertilizer recommendation for your ${primaryCrop} crop:\n\n` +
      `* **Basal Dose:** Apply 50 kg DAP + 25 kg MOP (Potash) per acre mixed with well-rotted farmyard manure.\n` +
      `* **Vegetative Growth:** Spray water-soluble NPK 19:19:19 @ **5g per liter** of water or fertigate via drip.\n` +
      `* **Flowering & Fruiting Stage:** Apply 0:52:34 (MKP) or 13:0:45 to boost fruit size, color, and sugar content.\n` +
      `* **Organic Option:** Use Jeevamrut (200 L/acre) every 15 days to enhance beneficial soil microbes.`;
  }

  // 5. Government Schemes / योजना / सबसिडी / विमा
  if (msg.includes("scheme") || msg.includes("subsidy") || msg.includes("योजना") || msg.includes("अनुदान") || msg.includes("विमा") || msg.includes("pm kisan") || msg.includes("कर्ज")) {
    if (isMr) {
      return `${greeting}शेतकऱ्यांसाठीच्या प्रमुख शासकीय योजना:\n\n` +
        `* **पीएम किसान सन्मान निधी (PM-KISAN):** पात्र शेतकऱ्यांना दरवर्षी ₹६,००० (३ हप्त्यांमध्ये ₹२,०००) थेट बँक खात्यात मिळतात.\n` +
        `* **नमो शेतकरी महासन्मान निधी:** महाराष्ट्र शासनाकडून अतिरिक्त ₹६,००० दरवर्षी दिले जातात (एकूण ₹१२,०००).\n` +
        `* **पंतप्रधान पीक विमा योजना (PMFBY):** केवळ ₹१ भरून खरीप व रब्बी पिकांचा विमा उतरवता येतो.\n` +
        `* **महाडीबीटी कृषी योजना (MahaDBT):** ठिबक/तुषार सिंचन (५५% ते ७५% अनुदान), ट्रॅक्टर व कृषी अवजारांवर अनुदान मिळते.`;
    }
    if (isHi) {
      return `${greeting}किसानों के लिए प्रमुख सरकारी योजनाएं:\n\n` +
        `* **पीएम किसान सम्मान निधि:** हर पात्र किसान को साल में ₹6,000 (₹2,000 की तीन किस्तें) सीधे खाते में।\n` +
        `* **प्रधानमंत्री फसल बीमा योजना (PMFBY):** प्राकृतिक आपदाओं से फसल नुकसान पर सुरक्षा कवच।\n` +
        `* **कृषि यंत्र एवं ड्रिप सब्सिडी:** आधुनिक कृषि यंत्रों और टपक सिंचाई पर 50% से 80% तक का सरकारी अनुदान।`;
    }
    return `${greeting}Top government schemes for farmers:\n\n` +
      `* **PM-KISAN:** Direct income support of ₹6,000/year to all landholding farmer families in 3 equal installments.\n` +
      `* **Pradhan Mantri Fasal Bima Yojana (PMFBY):** Comprehensive crop insurance shielding against yield loss due to non-preventable risks.\n` +
      `* **Micro-Irrigation Subsidy (PMKSY):** Up to 55-75% subsidy for installing drip and sprinkler systems.`;
  }

  // 6. Weather / Rain / Irrigation
  if (msg.includes("weather") || msg.includes("rain") || msg.includes("paus") || msg.includes("havaman") || msg.includes("barish") || msg.includes("हवामान") || msg.includes("मौसम") || msg.includes("बारिश") || msg.includes("पाणी") || msg.includes("सिंचन") || msg.includes("सिंचाई")) {
    if (isMr) {
      return `${greeting}शेतातील हवामान व पाणी व्यवस्थापन सल्ला:\n\n` +
        `* ढगाळ किंवा दमट हवामानात बुरशीजन्य रोगांचा प्रादुर्भाव वाढू शकतो, म्हणून पिकाचे बारकाईने निरीक्षण करा.\n` +
        `* पाऊस पडण्याची शक्यता असल्यास पिकाला पाणी देणे आणि खत/औषध फवारणी तात्पुरती थांबवा.\n` +
        `* फळबागा व भाजीपाल्यासाठी ठिबक सिंचन वापरावे जेणेकरून पाण्याची ४०-५०% बचत होते.`;
    }
    if (isHi) {
      return `${greeting}मौसम व सिंचाई संबंधी मुख्य सुझाव:\n\n` +
        `* यदि बारिश की संभावना हो, तो सिंचाई और कीटनाशक छिड़काव रोक दें।\n` +
        `* उमस भरे मौसम में फफूंद जनित रोगों का खतरा अधिक होता है, पौधों की निचली पत्तियों पर नजर रखें।\n` +
        `* पानी की बचत और बेहतर बढ़वार के लिए ड्रिप सिंचाई (टपक सिंचाई) का प्रयोग करें।`;
    }
    return `${greeting}Weather and irrigation guidance for your farm:\n\n` +
      `* Avoid spraying chemicals or irrigating if heavy rainfall is forecasted within the next 24 hours.\n` +
      `* High humidity combined with warm temperatures increases fungal spore germination; monitor leaf undersides.\n` +
      `* Adopt drip irrigation to save up to 40-50% water while maintaining root-zone moisture.`;
  }

  // 7. Default Personalized Greeting & Assistance
  if (isMr) {
    return `${greeting}मी फार्मी (Farmii), तुमचा शेती सल्लागार! तुमच्या ${crops.length ? crops.join(", ") : "शेती"} पिकाबद्दल काय मदत हवी आहे? खत, कीड नियंत्रण, बाजारभाव किंवा सरकारी योजना याबद्दल काहीही विचारा!`;
  }
  if (isHi) {
    return `${greeting}मैं फार्मी (Farmii), आपका कृषि मित्र! आपकी ${crops.length ? crops.join(", ") : "खेती"} के संबंध में क्या सहायता चाहिए? खाद, रोग नियंत्रण, मंडी भाव या सरकारी योजनाओं के बारे में बेझिझक पूछें!`;
  }
  return `${greeting}I am Farmii, your smart agricultural assistant! How can I help you with your ${crops.length ? crops.join(", ") : "crops"} today? Feel free to ask about disease remedies, fertilizer schedules, weather advice, or government schemes!`;
}

/**
 * Generate 3 contextual follow-up questions
 */
function getSuggestedQuestions(crops = [], language = "en") {
  const l = (language || "").toLowerCase();
  const crop = crops[0] || "Tomato";

  if (l.includes("mr") || l.includes("marathi")) {
    return [
      `🌿 ${crop} पिकावरील रोगांवर घरगुती उपाय काय?`,
      `💧 ${crop} पिकाला योग्य पाणी देण्याची वेळ कोणती?`,
      `🏛️ शेतकऱ्यांसाठी सध्या कोणत्या सरकारी योजना आहेत?`,
    ];
  }
  if (l.includes("hi") || l.includes("hindi")) {
    return [
      `🌿 ${crop} में कीट नियंत्रण के लिए क्या छिड़कें?`,
      `💧 ${crop} में सही सिंचाई व खाद का समय?`,
      `🏛️ छोटे किसानों के लिए कौन सी सरकारी योजनाएं हैं?`,
    ];
  }
  return [
    `🌿 Best organic pesticide for ${crop}?`,
    `💧 When is the best time to irrigate ${crop}?`,
    `🏛️ Top government schemes available for me?`,
  ];
}

/**
 * Main Farmii Orchestrator
 */
async function askFarmii({ message, history = [], farmer = {}, location = {}, language = "en" }) {
  const lat = location?.lat || farmer?.latitude;
  const lon = location?.lon || farmer?.longitude;
  const cityName = farmer?.district || farmer?.farmLocation || "";

  // 1. Fetch live weather context (fast, non-blocking)
  let weatherInfo = "";
  try {
    weatherInfo = await fetchLiveWeather(lat, lon, cityName);
  } catch (e) {
    // silently continue
  }

  // 2. Build system instruction
  const systemInstruction = buildSystemInstruction(farmer, weatherInfo, language);

  // 3. Format conversation history for Gemini
  const contents = [];
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-6); // last 6 turns
    for (const h of recent) {
      const text = h.text || h.content || "";
      if (!text.trim()) continue;
      const role = (h.role === "assistant" || h.role === "farmii" || h.role === "bot" || h.sender === "bot" || h.sender === "farmii")
        ? "model" 
        : "user";
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Ensure current user message is appended
  contents.push({
    role: "user",
    parts: [{ text: message }],
  });

  // 4. Try Gemini Flash models (100% Free Tier on Google AI Studio)
  if (GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

      for (const modelName of GEMINI_MODELS) {
        let attempts = 0;
        const maxAttempts = 2;

        while (attempts < maxAttempts) {
          attempts++;
          try {
            console.log(`🤖 Farmii querying model: ${modelName} (attempt ${attempts}/${maxAttempts})`);
            const genPromise = ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                systemInstruction,
                temperature: 0.6,
                maxOutputTokens: 2048,
              },
            });

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Model request timed out after 16s")), 16000)
            );

            const response = await Promise.race([genPromise, timeoutPromise]);

            if (response?.text && response.text.trim().length > 10) {
              console.log(`✅ Farmii successfully generated response using ${modelName}`);
              return {
                reply: response.text.trim(),
                source: "gemini",
                modelUsed: modelName,
                suggestedQuestions: getSuggestedQuestions(farmer?.crops, language),
                weatherUsed: !!weatherInfo,
              };
            }
          } catch (modelErr) {
            const isTransient = modelErr.status === 503 || modelErr.status === 429 || (modelErr.message && modelErr.message.includes("503"));
            console.warn(`⚠️ Model ${modelName} attempt ${attempts} failed (${modelErr.status || modelErr.message?.substring(0, 80)}).`);
            if (isTransient && attempts < maxAttempts) {
              console.log(`⏳ Transient 503/429 on ${modelName}, waiting 1.2s before retry...`);
              await new Promise((r) => setTimeout(r, 1200));
            } else {
              break; // move to next model candidate
            }
          }
        }
      }
    } catch (genAiErr) {
      console.error("Gemini initialization failed:", genAiErr.message);
    }
  }

  // 5. Intelligent Offline Expert Fallback
  console.log("🛡️ Falling back to Farmii Agricultural Expert Knowledge Base");
  const fallbackReply = generateOfflineExpertResponse(message, farmer, language);
  return {
    reply: fallbackReply,
    source: "expert_rules",
    modelUsed: "agricultural_expert_rules",
    suggestedQuestions: getSuggestedQuestions(farmer?.crops, language),
    weatherUsed: !!weatherInfo,
  };
}

module.exports = {
  askFarmii,
  fetchLiveWeather,
  getSuggestedQuestions,
};
