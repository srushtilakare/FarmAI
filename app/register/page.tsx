"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  MapPin,
  User,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Languages,
  Leaf,
  Tractor,
  Wheat,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";

/* =========================================================
   INDIAN STATES & DISTRICTS
   ========================================================= */

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Anantapur",
    "Chittoor",
    "East Godavari",
    "Guntur",
    "Kadapa",
    "Krishna",
    "Kurnool",
    "Nellore",
    "Prakasam",
    "Srikakulam",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
  ],

  Maharashtra: [
    "Ahilyanagar",
    "Akola",
    "Amravati",
    "Aurangabad",
    "Beed",
    "Bhandara",
    "Buldhana",
    "Chandrapur",
    "Dhule",
    "Gadchiroli",
    "Gondia",
    "Hingoli",
    "Jalgaon",
    "Jalna",
    "Kolhapur",
    "Latur",
    "Mumbai City",
    "Mumbai Suburban",
    "Nagpur",
    "Nanded",
    "Nandurbar",
    "Nashik",
    "Osmanabad",
    "Palghar",
    "Parbhani",
    "Pune",
    "Raigad",
    "Ratnagiri",
    "Sangli",
    "Satara",
    "Sindhudurg",
    "Solapur",
    "Thane",
    "Wardha",
    "Washim",
    "Yavatmal",
  ],

  Karnataka: [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikkaballapur",
    "Chikkamagaluru",
    "Chitradurga",
    "Dakshina Kannada",
    "Davanagere",
    "Dharwad",
    "Gadag",
    "Hassan",
    "Haveri",
    "Kalaburagi",
    "Kodagu",
    "Kolar",
    "Koppal",
    "Mandya",
    "Mysuru",
    "Raichur",
    "Ramanagara",
    "Shivamogga",
    "Tumakuru",
    "Udupi",
    "Uttara Kannada",
    "Vijayapura",
    "Yadgir",
  ],

  Gujarat: [
    "Ahmedabad",
    "Amreli",
    "Anand",
    "Aravalli",
    "Banaskantha",
    "Bharuch",
    "Bhavnagar",
    "Botad",
    "Chhota Udaipur",
    "Dahod",
    "Dang",
    "Devbhoomi Dwarka",
    "Gandhinagar",
    "Gir Somnath",
    "Jamnagar",
    "Junagadh",
    "Kheda",
    "Kutch",
    "Mahisagar",
    "Mehsana",
    "Morbi",
    "Narmada",
    "Navsari",
    "Panchmahal",
    "Patan",
    "Porbandar",
    "Rajkot",
    "Sabarkantha",
    "Surat",
    "Surendranagar",
    "Tapi",
    "Vadodara",
    "Valsad",
  ],

  "Madhya Pradesh": [
    "Agar Malwa",
    "Alirajpur",
    "Anuppur",
    "Ashoknagar",
    "Balaghat",
    "Barwani",
    "Betul",
    "Bhind",
    "Bhopal",
    "Burhanpur",
    "Chhatarpur",
    "Chhindwara",
    "Damoh",
    "Datia",
    "Dewas",
    "Dhar",
    "Dindori",
    "Guna",
    "Gwalior",
    "Harda",
    "Hoshangabad",
    "Indore",
    "Jabalpur",
    "Jhabua",
    "Katni",
    "Khandwa",
    "Khargone",
    "Mandla",
    "Mandsaur",
    "Morena",
    "Narsinghpur",
    "Neemuch",
    "Panna",
    "Raisen",
    "Rajgarh",
    "Ratlam",
    "Rewa",
    "Sagar",
    "Satna",
    "Sehore",
    "Seoni",
    "Shahdol",
    "Shajapur",
    "Sheopur",
    "Shivpuri",
    "Sidhi",
    "Singrauli",
    "Tikamgarh",
    "Ujjain",
    "Umaria",
    "Vidisha",
  ],

  Rajasthan: [
    "Ajmer",
    "Alwar",
    "Banswara",
    "Baran",
    "Barmer",
    "Bharatpur",
    "Bhilwara",
    "Bikaner",
    "Bundi",
    "Chittorgarh",
    "Churu",
    "Dausa",
    "Dholpur",
    "Dungarpur",
    "Hanumangarh",
    "Jaipur",
    "Jaisalmer",
    "Jalore",
    "Jhalawar",
    "Jhunjhunu",
    "Jodhpur",
    "Karauli",
    "Kota",
    "Nagaur",
    "Pali",
    "Pratapgarh",
    "Rajsamand",
    "Sawai Madhopur",
    "Sikar",
    "Sirohi",
    "Sri Ganganagar",
    "Tonk",
    "Udaipur",
  ],

  "Tamil Nadu": [
    "Ariyalur",
    "Chengalpattu",
    "Chennai",
    "Coimbatore",
    "Cuddalore",
    "Dharmapuri",
    "Dindigul",
    "Erode",
    "Kallakurichi",
    "Kanchipuram",
    "Karur",
    "Krishnagiri",
    "Madurai",
    "Mayiladuthurai",
    "Nagapattinam",
    "Namakkal",
    "Nilgiris",
    "Perambalur",
    "Pudukkottai",
    "Ramanathapuram",
    "Ranipet",
    "Salem",
    "Sivaganga",
    "Tenkasi",
    "Thanjavur",
    "Theni",
    "Thoothukudi",
    "Tiruchirappalli",
    "Tirunelveli",
    "Tirupathur",
    "Tiruppur",
    "Tiruvallur",
    "Tiruvannamalai",
    "Tiruvarur",
    "Vellore",
    "Viluppuram",
    "Virudhunagar",
  ],

  Telangana: [
    "Adilabad",
    "Bhadradri Kothagudem",
    "Hyderabad",
    "Jagtial",
    "Jangaon",
    "Jayashankar",
    "Jogulamba Gadwal",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem",
    "Mahabubabad",
    "Mahbubnagar",
    "Mancherial",
    "Medak",
    "Medchal",
    "Mulugu",
    "Nagarkurnool",
    "Nalgonda",
    "Narayanpet",
    "Nirmal",
    "Nizamabad",
    "Peddapalli",
    "Rajanna Sircilla",
    "Rangareddy",
    "Sangareddy",
    "Siddipet",
    "Suryapet",
    "Vikarabad",
    "Wanaparthy",
    "Warangal Rural",
    "Warangal Urban",
    "Yadadri Bhuvanagiri",
  ],

  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Allahabad",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Azamgarh",
    "Baghpat",
    "Bahraich",
    "Ballia",
    "Balrampur",
    "Banda",
    "Barabanki",
    "Bareilly",
    "Basti",
    "Bhadohi",
    "Bijnor",
    "Budaun",
    "Bulandshahr",
    "Chandauli",
    "Chitrakoot",
    "Deoria",
    "Etah",
    "Etawah",
    "Farrukhabad",
    "Fatehpur",
    "Firozabad",
    "Gautam Buddha Nagar",
    "Ghaziabad",
    "Ghazipur",
    "Gonda",
    "Gorakhpur",
    "Hamirpur",
    "Hapur",
    "Hardoi",
    "Hathras",
    "Jalaun",
    "Jaunpur",
    "Jhansi",
    "Kannauj",
    "Kanpur Dehat",
    "Kanpur Nagar",
    "Kasganj",
    "Kaushambi",
    "Kushinagar",
    "Lakhimpur Kheri",
    "Lalitpur",
    "Lucknow",
    "Maharajganj",
    "Mahoba",
    "Mainpuri",
    "Mathura",
    "Mau",
    "Meerut",
    "Mirzapur",
    "Moradabad",
    "Muzaffarnagar",
    "Pilibhit",
    "Pratapgarh",
    "Rae Bareli",
    "Rampur",
    "Saharanpur",
    "Sambhal",
    "Sant Kabir Nagar",
    "Shahjahanpur",
    "Shamli",
    "Shravasti",
    "Siddharthnagar",
    "Sitapur",
    "Sonbhadra",
    "Sultanpur",
    "Unnao",
    "Varanasi",
  ],
};

/* =========================================================
   CROPS
   ========================================================= */

const AVAILABLE_CROPS = [
  { id: "wheat", label: "Wheat (गहू)", icon: "🌾" },
  { id: "rice", label: "Rice (तांदूळ)", icon: "🍚" },
  { id: "cotton", label: "Cotton (कापूस)", icon: "🌿" },
  { id: "sugarcane", label: "Sugarcane (ऊस)", icon: "🎋" },
  { id: "soybean", label: "Soybean (सोयाबीन)", icon: "🌱" },
  { id: "corn", label: "Corn (मका)", icon: "🌽" },
  { id: "onion", label: "Onion (कांदा)", icon: "🧅" },
  { id: "tomato", label: "Tomato (टोमॅटो)", icon: "🍅" },
  { id: "vegetables", label: "Vegetables (भाजीपाला)", icon: "🥦" },
  { id: "fruits", label: "Fruits (फळे)", icon: "🍎" },
];

/* =========================================================
   TRANSLATIONS
   ========================================================= */

const TRANSLATIONS: Record<string, any> = {
  "en-US": {
    title: "Join FarmAI",
    subtitle:
      "Complete your profile to get personalized AI farming advice",

    personal: "Personal Details",
    personalDesc: "Tell us a little about yourself.",

    name: "Full Name",
    namePlaceholder: "e.g. Rajesh Kumar",

    phone: "Mobile Number",
    phonePlaceholder: "9876543210",

    location: "Farm Location",
    locationDesc:
      "Your location helps us provide accurate weather and farming information.",

    language: "Language",

    detectLocation: "Use My Current Location",
    detecting: "Finding your location...",
    highAccuracy: "Getting accurate location...",
    locationDetected: "Location detected",

    state: "State",
    district: "District",
    pincode: "Pincode",
    village: "Village / Town",

    selectState: "Select State",
    selectDistrict: "Select District",

    farming: "Farming Information",
    chooseCrops: "Select the crops you currently grow.",

    farmingType: "What type of farming do you practice?",

    traditional: "Traditional",
    modern: "Modern / Hi-Tech",
    organic: "Organic",

    traditionalInfo:
      "Uses common farming practices such as ploughing, sowing, irrigation and regular use of fertilizers or pesticides.",

    modernInfo:
      "Uses technology such as machinery, drip irrigation, sensors, protected cultivation or other advanced farming methods.",

    organicInfo:
      "Avoids synthetic chemical fertilizers and pesticides and mainly uses natural inputs such as compost, manure and bio-products.",

    chooseMethod:
      "Choose the method that best matches how you currently farm.",

    mpinTitle: "Create your 4-digit MPIN",

    mpinDescription:
      "Create a 4-digit number that you can remember. It will be used to log in to FarmAI.",

    mpin: "4-digit MPIN",
    confirmMpin: "Confirm MPIN",

    mpinPlaceholder: "Enter 4-digit MPIN",
    confirmMpinPlaceholder: "Enter MPIN again",

    showMpin: "Show MPIN",
    hideMpin: "Hide MPIN",

    mpinHint:
      "Do not use very easy numbers such as 1234 or 0000.",

    submit: "Complete Registration",

    next: "Next Step",
    back: "Back",

    step1: "Personal",
    step2: "Location",
    step3: "Farming",

    successTitle: "Registration Successful!",
    successDescription:
      "Your FarmAI account has been created successfully. Redirecting to login...",

    incompleteTitle: "Some information is missing",

    invalidPhoneTitle: "Invalid Mobile Number",
    invalidPhone:
      "Please enter a valid 10-digit Indian mobile number.",

    phoneExistsTitle: "Account Already Exists",
    phoneExists:
      "This mobile number is already registered. Please login instead.",

    checkingPhone: "Checking mobile number...",

    nameRequired: "Please enter your full name.",
    phoneRequired: "Please enter your mobile number.",

    stateRequired: "Please select your state.",
    districtRequired: "Please select your district.",

    cropsRequired: "Please select at least one crop.",

    farmingTypeRequired:
      "Please select the farming method that best matches your farm.",

    mpinRequired: "Please create a 4-digit MPIN.",

    mpinInvalid:
      "MPIN must contain exactly 4 digits.",

    weakMpin:
      "This MPIN is too easy to guess. Please choose a different 4-digit MPIN.",

    mpinMismatch:
      "The two MPINs do not match.",

    registrationError:
      "Registration failed. Please try again.",

    serverError:
      "Unable to connect to the server. Please try again.",

    errorLocation:
      "Location could not be detected. Please enter it manually.",

    security:
      "Your MPIN is securely encrypted.",
  },

  "hi-IN": {
    title: "FarmAI में शामिल हों",
    subtitle:
      "AI आधारित खेती की सलाह पाने के लिए अपनी प्रोफ़ाइल पूरी करें",

    personal: "व्यक्तिगत जानकारी",
    personalDesc: "अपने बारे में थोड़ी जानकारी दें।",

    name: "पूरा नाम",
    namePlaceholder: "जैसे: राजेश कुमार",

    phone: "मोबाइल नंबर",
    phonePlaceholder: "9876543210",

    location: "खेत का स्थान",
    locationDesc:
      "आपका स्थान हमें सही मौसम और खेती की जानकारी देने में मदद करता है।",

    language: "भाषा",

    detectLocation: "मेरे वर्तमान स्थान का उपयोग करें",
    detecting: "स्थान खोज रहे हैं...",
    highAccuracy: "सटीक स्थान प्राप्त कर रहे हैं...",
    locationDetected: "स्थान प्राप्त हुआ",

    state: "राज्य",
    district: "जिला",
    pincode: "पिनकोड",
    village: "गाँव / शहर",

    selectState: "राज्य चुनें",
    selectDistrict: "जिला चुनें",

    farming: "खेती की जानकारी",
    chooseCrops: "आप वर्तमान में कौन सी फसलें उगाते हैं?",

    farmingType: "आप किस प्रकार की खेती करते हैं?",

    traditional: "पारंपरिक",
    modern: "आधुनिक / हाई-टेक",
    organic: "जैविक",

    traditionalInfo:
      "हल चलाना, बुवाई, सिंचाई और सामान्य खाद या कीटनाशकों के उपयोग जैसी पारंपरिक खेती की पद्धतियाँ।",

    modernInfo:
      "मशीनरी, ड्रिप सिंचाई, सेंसर, संरक्षित खेती या अन्य आधुनिक तकनीकों का उपयोग।",

    organicInfo:
      "रासायनिक खाद और कीटनाशकों से बचकर मुख्य रूप से कम्पोस्ट, गोबर की खाद और जैविक उत्पादों का उपयोग।",

    chooseMethod:
      "अपनी वास्तविक खेती के तरीके से सबसे अच्छी तरह मेल खाने वाला विकल्प चुनें।",

    mpinTitle: "4 अंकों का MPIN बनाएं",

    mpinDescription:
      "ऐसा 4 अंकों का नंबर चुनें जिसे आप आसानी से याद रख सकें। इसका उपयोग FarmAI में लॉगिन करने के लिए होगा।",

    mpin: "4 अंकों का MPIN",
    confirmMpin: "MPIN की पुष्टि करें",

    mpinPlaceholder: "4 अंकों का MPIN डालें",
    confirmMpinPlaceholder: "MPIN दोबारा डालें",

    showMpin: "MPIN दिखाएं",
    hideMpin: "MPIN छिपाएं",

    mpinHint:
      "1234 या 0000 जैसे बहुत आसान नंबर का उपयोग न करें।",

    submit: "पंजीकरण पूरा करें",

    next: "आगे बढ़ें",
    back: "पीछे",

    step1: "व्यक्तिगत",
    step2: "स्थान",
    step3: "खेती",

    successTitle: "पंजीकरण सफल!",
    successDescription:
      "आपका FarmAI खाता सफलतापूर्वक बन गया है। लॉगिन पेज पर जा रहे हैं...",

    incompleteTitle: "कुछ जानकारी बाकी है",

    invalidPhoneTitle: "मोबाइल नंबर सही नहीं है",
    invalidPhone:
      "कृपया 10 अंकों का सही भारतीय मोबाइल नंबर डालें।",

    phoneExistsTitle: "खाता पहले से मौजूद है",
    phoneExists:
      "यह मोबाइल नंबर पहले से पंजीकृत है। कृपया लॉगिन करें।",

    checkingPhone: "मोबाइल नंबर जांच रहे हैं...",

    nameRequired: "कृपया अपना पूरा नाम डालें।",
    phoneRequired: "कृपया अपना मोबाइल नंबर डालें।",

    stateRequired: "कृपया अपना राज्य चुनें.",
    districtRequired: "कृपया अपना जिला चुनें।",

    cropsRequired: "कृपया कम से कम एक फसल चुनें।",

    farmingTypeRequired:
      "कृपया अपनी खेती के अनुसार सही खेती पद्धति चुनें।",

    mpinRequired: "कृपया 4 अंकों का MPIN बनाएं.",

    mpinInvalid:
      "MPIN में ठीक 4 अंक होने चाहिए।",

    weakMpin:
      "यह MPIN बहुत आसानी से अनुमान लगाया जा सकता है। कृपया दूसरा MPIN चुनें।",

    mpinMismatch:
      "दोनों MPIN एक जैसे नहीं हैं।",

    registrationError:
      "पंजीकरण असफल हुआ। कृपया दोबारा प्रयास करें।",

    serverError:
      "सर्वर से कनेक्शन नहीं हो सका। कृपया दोबारा प्रयास करें।",

    errorLocation:
      "स्थान नहीं मिल सका। कृपया जानकारी स्वयं भरें।",

    security:
      "आपका MPIN सुरक्षित रूप से एन्क्रिप्ट किया जाता है।",
  },

  "mr-IN": {
    title: "FarmAI मध्ये सामील व्हा",
    subtitle:
      "AI आधारित शेतीचा सल्ला मिळवण्यासाठी आपली माहिती भरा",

    personal: "वैयक्तिक माहिती",
    personalDesc: "तुमच्याबद्दल थोडी माहिती द्या.",

    name: "पूर्ण नाव",
    namePlaceholder: "उदा. राजेश कुमार",

    phone: "मोबाईल नंबर",
    phonePlaceholder: "9876543210",

    location: "शेताचे ठिकाण",
    locationDesc:
      "तुमचे लोकेशन आम्हाला अचूक हवामान आणि शेतीची माहिती देण्यास मदत करते.",

    language: "भाषा",

    detectLocation: "माझे सध्याचे लोकेशन वापरा",
    detecting: "लोकेशन शोधत आहे...",
    highAccuracy: "अचूक लोकेशन मिळवत आहे...",
    locationDetected: "लोकेशन मिळाले",

    state: "राज्य",
    district: "जिल्हा",
    pincode: "पिनकोड",
    village: "गाव / शहर",

    selectState: "राज्य निवडा",
    selectDistrict: "जिल्हा निवडा",

    farming: "शेतीची माहिती",
    chooseCrops: "तुम्ही सध्या कोणती पिके घेता?",

    farmingType: "तुम्ही कोणत्या प्रकारची शेती करता?",

    traditional: "पारंपारिक",
    modern: "आधुनिक / हाय-टेक",
    organic: "सेंद्रिय",

    traditionalInfo:
      "नांगरणी, पेरणी, सिंचन तसेच सामान्य खते आणि कीटकनाशकांचा वापर करणारी पारंपारिक शेती.",

    modernInfo:
      "यंत्रसामग्री, ठिबक सिंचन, सेन्सर, संरक्षित शेती किंवा इतर आधुनिक तंत्रज्ञानाचा वापर.",

    organicInfo:
      "रासायनिक खते व कीटकनाशके टाळून कंपोस्ट, शेणखत आणि जैविक उत्पादनांचा मुख्यतः वापर.",

    chooseMethod:
      "तुम्ही प्रत्यक्षात ज्या पद्धतीने शेती करता त्याच्याशी सर्वात जुळणारा पर्याय निवडा.",

    mpinTitle: "4 अंकी MPIN तयार करा",

    mpinDescription:
      "तुम्हाला सहज लक्षात राहील असा 4 अंकी नंबर निवडा. याच MPIN ने FarmAI मध्ये लॉगिन करता येईल.",

    mpin: "4 अंकी MPIN",
    confirmMpin: "MPIN ची पुष्टी करा",

    mpinPlaceholder: "4 अंकी MPIN टाका",
    confirmMpinPlaceholder: "MPIN पुन्हा टाका",

    showMpin: "MPIN दाखवा",
    hideMpin: "MPIN लपवा",

    mpinHint:
      "1234 किंवा 0000 सारखा खूप सोपा नंबर वापरू नका.",

    submit: "नोंदणी पूर्ण करा",

    next: "पुढे जा",
    back: "मागे",

    step1: "वैयक्तिक",
    step2: "लोकेशन",
    step3: "शेती",

    successTitle: "नोंदणी यशस्वी!",
    successDescription:
      "तुमचे FarmAI खाते यशस्वीरित्या तयार झाले आहे. लॉगिन पेजवर जात आहे...",

    incompleteTitle: "काही माहिती बाकी आहे",

    invalidPhoneTitle: "मोबाईल नंबर चुकीचा आहे",
    invalidPhone:
      "कृपया 10 अंकी योग्य भारतीय मोबाईल नंबर टाका.",

    phoneExistsTitle: "खाते आधीपासून आहे",
    phoneExists:
      "हा मोबाईल नंबर आधीच नोंदणीकृत आहे. कृपया लॉगिन करा.",

    checkingPhone: "मोबाईल नंबर तपासत आहे...",

    nameRequired: "कृपया तुमचे पूर्ण नाव टाका.",
    phoneRequired: "कृपया तुमचा मोबाईल नंबर टाका.",

    stateRequired: "कृपया तुमचे राज्य निवडा.",
    districtRequired: "कृपया तुमचा जिल्हा निवडा.",

    cropsRequired:
      "कृपया कमीत कमी एक पीक निवडा.",

    farmingTypeRequired:
      "तुमच्या प्रत्यक्ष शेतीशी जुळणारी योग्य पद्धत निवडा.",

    mpinRequired:
      "कृपया 4 अंकी MPIN तयार करा.",

    mpinInvalid:
      "MPIN मध्ये नेमके 4 अंक असणे आवश्यक आहे.",

    weakMpin:
      "हा MPIN खूप सोपा आहे. कृपया दुसरा 4 अंकी MPIN निवडा.",

    mpinMismatch:
      "दोन्ही MPIN सारखे नाहीत.",

    registrationError:
      "नोंदणी अयशस्वी झाली. कृपया पुन्हा प्रयत्न करा.",

    serverError:
      "सर्व्हरशी कनेक्शन झाले नाही. कृपया पुन्हा प्रयत्न करा.",

    errorLocation:
      "लोकेशन सापडले नाही. कृपया माहिती स्वतः भरा.",

    security:
      "तुमचा MPIN सुरक्षितपणे एन्क्रिप्ट केला जातो.",
  },
};

/* =========================================================
   FARMING METHODS
   ========================================================= */

const FARMING_METHODS = [
  {
    id: "traditional",
    icon: Wheat,
  },
  {
    id: "modern",
    icon: Tractor,
  },
  {
    id: "organic",
    icon: Leaf,
  },
];

/* =========================================================
   WEAK 4-DIGIT MPIN CHECK
   ========================================================= */

function isWeakMpin(mpin: string) {
  const weakPins = [
    "0000",
    "1111",
    "2222",
    "3333",
    "4444",
    "5555",
    "6666",
    "7777",
    "8888",
    "9999",

    "1234",
    "4321",

    "1122",
    "2211",
    "1212",
    "2121",
    "1221",
    "2112",

    "2580",
    "0852",
    "6969",
    "1004",
    "2000",
    "2020",
  ];

  if (weakPins.includes(mpin)) {
    return true;
  }

  // All same digits
  if (/^(\d)\1{3}$/.test(mpin)) {
    return true;
  }

  // Ascending sequence
  let ascending = true;

  for (let i = 1; i < mpin.length; i++) {
    if (
      Number(mpin[i]) !==
      Number(mpin[i - 1]) + 1
    ) {
      ascending = false;
      break;
    }
  }

  if (ascending) {
    return true;
  }

  // Descending sequence
  let descending = true;

  for (let i = 1; i < mpin.length; i++) {
    if (
      Number(mpin[i]) !==
      Number(mpin[i - 1]) - 1
    ) {
      descending = false;
      break;
    }
  }

  return descending;
}

/* =========================================================
   REGISTER PAGE
   ========================================================= */

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000";

  const [lang, setLang] =
    useState<"en-US" | "hi-IN" | "mr-IN">(
      "mr-IN"
    );

  const t = (key: string) =>
    TRANSLATIONS[lang][key] || key;

  /* =====================================================
     STEP
     ===================================================== */

  const [step, setStep] = useState(1);

  /* =====================================================
     PERSONAL
     ===================================================== */

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  /* =====================================================
     LOCATION
     ===================================================== */

  const [location, setLocation] =
    useState<any>({});

  const [locLoading, setLocLoading] =
    useState(false);

  const [manualState, setManualState] =
    useState("");

  const [manualDistrict, setManualDistrict] =
    useState("");

  const [manualPincode, setManualPincode] =
    useState("");

  const [manualVillage, setManualVillage] =
    useState("");

  /* =====================================================
     FARMING
     ===================================================== */

  const [selectedCrops, setSelectedCrops] =
    useState<string[]>([]);

  const [farmingType, setFarmingType] =
    useState<
      "organic" | "traditional" | "modern"
    >("traditional");

  /* =====================================================
     MPIN
     ===================================================== */

  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] =
    useState("");

  const [showMpin, setShowMpin] =
    useState(false);

  const [showConfirmMpin, setShowConfirmMpin] =
    useState(false);

  /* =====================================================
     LOADING
     ===================================================== */

  const [loading, setLoading] =
    useState(false);

  const [checkingPhone, setCheckingPhone] =
    useState(false);

  // True only when the backend confirms that this
  // mobile number is already registered.
  const [phoneAlreadyRegistered, setPhoneAlreadyRegistered] =
    useState(false);

  /* =====================================================
     ERRORS
     ===================================================== */

  const [errors, setErrors] =
    useState<Record<string, string>>({});

  /* =====================================================
     REVERSE GEOCODING
     ===================================================== */

  async function reverseGeocode(
    lat: number,
    lon: number
  ) {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=jsonv2` +
        `&lat=${lat}` +
        `&lon=${lon}` +
        `&zoom=18` +
        `&addressdetails=1`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        },
      });

      if (!res.ok) {
        throw new Error(
          "Geocoding failed"
        );
      }

      const data = await res.json();
      const address = data.address || {};

      const state =
        address.state ||
        address.region ||
        "";

      let district =
        address.state_district ||
        address.county ||
        address.city_district ||
        address.city ||
        "";

      district = district
        .replace(
          /\s+District$/i,
          ""
        )
        .trim();

      const village =
        address.village ||
        address.town ||
        address.suburb ||
        address.neighbourhood ||
        "";

      return {
        lat,
        lon,
        state,
        district,
        pincode:
          address.postcode || "",
        village,
        display_name:
          data.display_name || "",
      };
    } catch (error) {
      console.error(
        "Geocoding error:",
        error
      );

      return null;
    }
  }

  /* =====================================================
     DETECT LOCATION
     ===================================================== */

  function detectLocation() {
    clearError("location");

    if (!navigator.geolocation) {
      // setShowManualLocation(true);

      toast({
        title: t("errorLocation"),
        description: t("errorLocation"),
        variant: "destructive",
      });

      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat =
          position.coords.latitude;

        const lon =
          position.coords.longitude;

        const loc =
          await reverseGeocode(
            lat,
            lon
          );

        if (!loc) {
          setLocLoading(false);

          toast({
            title: t("errorLocation"),
            description:
              t("errorLocation"),
            variant: "destructive",
          });

          return;
        }

        setLocation(loc);

        setManualState(
          loc.state || ""
        );

        setManualDistrict(
          loc.district || ""
        );

        setManualPincode(
          loc.pincode || ""
        );

        setManualVillage(
          loc.village || ""
        );

        toast({
          title: `✓ ${t(
            "locationDetected"
          )}`,
          description:
            loc.display_name || "",
        });

        setLocLoading(false);
      },
      () => {
        setLocLoading(false);

        toast({
          title: t("errorLocation"),
          description:
            t("errorLocation"),
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  /* =====================================================
     ERROR HELPERS
     ===================================================== */

  function clearError(field: string) {
    setErrors((prev) => {
      const next = {
        ...prev,
      };

      delete next[field];

      return next;
    });
  }

  function setError(
    field: string,
    message: string
  ) {
    setErrors((prev) => ({
      ...prev,
      [field]: message,
    }));
  }

  /* =====================================================
     CROP SELECTION
     ===================================================== */

  function toggleCrop(
    cropId: string
  ) {
    clearError("crops");

    setSelectedCrops((prev) =>
      prev.includes(cropId)
        ? prev.filter(
            (crop) => crop !== cropId
          )
        : [...prev, cropId]
    );
  }

  /* =====================================================
     CHECK PHONE
     ===================================================== */

  async function checkPhoneAvailability(
    mobileNumber: string
  ) {
    setCheckingPhone(true);
    setPhoneAlreadyRegistered(false);

    try {
      const res = await fetch(
        `${API_URL}/api/auth/check-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: mobileNumber,
          }),
        }
      );

      let data: any = {};

      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // =================================================
      // PHONE ALREADY REGISTERED
      // =================================================

      if (
        res.status === 409 ||
        data.code === "PHONE_EXISTS"
      ) {
        setPhoneAlreadyRegistered(true);
        setError("phone", t("phoneExists"));

        toast({
          title: `⚠️ ${t("phoneExistsTitle")}`,
          description:
            data.message || t("phoneExists"),
          variant: "destructive",
        });

        return false;
      }

      // =================================================
      // OTHER BACKEND ERROR
      // =================================================

      if (!res.ok) {
        setPhoneAlreadyRegistered(false);

        const message =
          data.message || t("serverError");

        setError("phone", message);

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });

        return false;
      }

      // =================================================
      // PHONE AVAILABLE
      // =================================================

      if (data.available === true) {
        clearError("phone");
        setPhoneAlreadyRegistered(false);
        return true;
      }

      // Unexpected response
      setPhoneAlreadyRegistered(false);
      setError("phone", t("serverError"));

      toast({
        title: "Error",
        description: t("serverError"),
        variant: "destructive",
      });

      return false;
    } catch (error) {
      console.error(
        "Phone availability error:",
        error
      );

      setPhoneAlreadyRegistered(false);

      toast({
        title: "Error",
        description: t("serverError"),
        variant: "destructive",
      });

      return false;
    } finally {
      setCheckingPhone(false);
    }
  }

  /* =====================================================
     STEP 1 VALIDATION
     ===================================================== */

  async function validateStep1() {
    const newErrors: Record<
      string,
      string
    > = {};

    const cleanName =
      name.trim();

    const cleanPhone =
      phone
        .replace(/\D/g, "")
        .trim();

    if (!cleanName) {
      newErrors.name =
        t("nameRequired");
    }

    if (!cleanPhone) {
      newErrors.phone =
        t("phoneRequired");
    } else if (
      !/^[6-9]\d{9}$/.test(
        cleanPhone
      )
    ) {
      newErrors.phone =
        t("invalidPhone");
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors)
        .length > 0
    ) {
      toast({
        title: `⚠️ ${t(
          "incompleteTitle"
        )}`,
        description:
          Object.values(
            newErrors
          )[0],
        variant: "destructive",
      });

      return false;
    }

    return checkPhoneAvailability(
      cleanPhone
    );
  }

  /* =====================================================
     STEP 2 VALIDATION
     ===================================================== */

  function validateStep2() {
    const newErrors: Record<
      string,
      string
    > = {};

    if (!manualState) {
      newErrors.state =
        t("stateRequired");
    }

    if (!manualDistrict) {
      newErrors.district =
        t("districtRequired");
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors)
        .length > 0
    ) {
      toast({
        title: `⚠️ ${t(
          "incompleteTitle"
        )}`,
        description:
          Object.values(
            newErrors
          )[0],
        variant: "destructive",
      });

      return false;
    }

    return true;
  }

  /* =====================================================
     NEXT
     ===================================================== */

  async function goNext() {
    if (step === 1) {
      const valid =
        await validateStep1();

      if (!valid) return;

      setStep(2);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (step === 2) {
      const valid =
        validateStep2();

      if (!valid) return;

      setStep(3);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* =====================================================
     BACK
     ===================================================== */

  function goBack() {
    setErrors({});

    setStep((current) =>
      Math.max(
        1,
        current - 1
      )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================================
     FINAL VALIDATION
     ===================================================== */

  function validateFinalStep() {
    const newErrors: Record<
      string,
      string
    > = {};

    /* CROPS */

    if (
      selectedCrops.length ===
      0
    ) {
      newErrors.crops =
        t("cropsRequired");
    }

    /* MPIN */

    if (!mpin) {
      newErrors.mpin =
        t("mpinRequired");
    } else if (
      !/^\d{4}$/.test(mpin)
    ) {
      newErrors.mpin =
        t("mpinInvalid");
    } else if (
      isWeakMpin(mpin)
    ) {
      newErrors.mpin =
        t("weakMpin");
    }

    /* CONFIRM MPIN */

    if (!confirmMpin) {
      newErrors.confirmMpin =
        t("mpinRequired");
    } else if (
      mpin !== confirmMpin
    ) {
      newErrors.confirmMpin =
        t("mpinMismatch");
    }

    setErrors(newErrors);

    if (
      Object.keys(newErrors)
        .length > 0
    ) {
      toast({
        title: `⚠️ ${t(
          "incompleteTitle"
        )}`,
        description:
          Object.values(
            newErrors
          )[0],
        variant: "destructive",
      });

      return false;
    }

    return true;
  }

  /* =====================================================
     SUBMIT REGISTRATION
     ===================================================== */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!validateFinalStep()) {
      return;
    }

    setLoading(true);

    try {
      const finalState =
        manualState ||
        location.state ||
        "";

      const finalDistrict =
        manualDistrict ||
        location.district ||
        "";

      const finalPincode =
        manualPincode ||
        location.pincode ||
        "";

      const finalVillage =
        manualVillage ||
        location.village ||
        "";

      const locationParts = [
        finalVillage,
        finalDistrict,
        finalState,
        finalPincode,
      ].filter(Boolean);

      const farmLocation =
        locationParts.join(
          ", "
        );

      const payload = {
        fullName:
          name.trim(),

        phone: phone
          .replace(
            /\D/g,
            ""
          )
          .trim(),

        preferredLanguage:
          lang,

        farmLocation,

        state: finalState,

        district:
          finalDistrict,

        pincode:
          finalPincode,

        village:
          finalVillage,

        latitude:
          typeof location.lat ===
          "number"
            ? location.lat
            : 0,

        longitude:
          typeof location.lon ===
          "number"
            ? location.lon
            : 0,

        crops:
          selectedCrops,

        farmingType,

        /* IMPORTANT:
           Backend expects 4-digit MPIN */
        mpin,
      };

      console.log(
        "Registration payload:",
        {
          ...payload,
          mpin: "****",
        }
      );

      const res =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await res.json();

      /* =================================================
         EXISTING USER
         ================================================= */

      if (
        res.status === 409 ||
        data.code ===
          "PHONE_EXISTS"
      ) {
        setError(
          "phone",
          t("phoneExists")
        );

        setPhoneAlreadyRegistered(true);

        toast({
          title: `⚠️ ${t(
            "phoneExistsTitle"
          )}`,
          description:
            data.message ||
            t("phoneExists"),
          variant:
            "destructive",
        });

        setStep(1);

        return;
      }

      /* =================================================
         VALIDATION ERROR
         ================================================= */

      if (!res.ok) {
        let message =
          data.message ||
          t("registrationError");

        if (
          data.code ===
          "WEAK_MPIN"
        ) {
          setError(
            "mpin",
            t("weakMpin")
          );

          message =
            t("weakMpin");
        }

        if (
          data.code ===
          "INVALID_MPIN"
        ) {
          setError(
            "mpin",
            t("mpinInvalid")
          );

          message =
            t("mpinInvalid");
        }

        if (
          data.code ===
          "MPIN_REQUIRED"
        ) {
          setError(
            "mpin",
            t("mpinRequired")
          );

          message =
            t("mpinRequired");
        }

        toast({
          title: `⚠️ ${t(
            "registrationError"
          )}`,
          description:
            message,
          variant:
            "destructive",
        });

        return;
      }

      /* =================================================
         SUCCESS
         ================================================= */

      toast({
        title: `✓ ${t(
          "successTitle"
        )}`,
        description:
          t(
            "successDescription"
          ),
        className:
          "bg-green-600 text-white border-none",
      });

      setTimeout(() => {
        router.push(
          "/login"
        );
      }, 1800);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      toast({
        title:
          "Connection Error",
        description:
          t("serverError"),
        variant:
          "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     DISTRICTS
     ===================================================== */

  const districtsForState =
    manualState
      ? INDIAN_STATES_DISTRICTS[
          manualState
        ] || []
      : [];

  /* =====================================================
     RENDER
     ===================================================== */

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-3 sm:p-5 md:p-8 font-sans">

      <div className="w-full max-w-5xl bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-green-100">

        {/* =================================================
            LEFT SIDEBAR
            ================================================= */}

        <div className="md:w-[34%] bg-gradient-to-br from-green-800 to-green-700 text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">

          <div className="absolute inset-0 opacity-[0.08] pointer-events-none">
            <Sprout className="absolute -bottom-10 -right-10 w-64 h-64" />
          </div>

          <div className="relative z-10">

            <div className="flex items-center gap-3 mb-7">

              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sprout className="w-7 h-7 text-white" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                FarmAI
              </h1>

            </div>

            <h2 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
              {t("title")}
            </h2>

            <p className="text-green-100 text-sm sm:text-base leading-relaxed opacity-90">
              {t("subtitle")}
            </p>

          </div>

          {/* STEPPER */}

          <div className="relative z-10 mt-8 md:mt-12">

            <div className="space-y-5">

              {[1, 2, 3].map(
                (currentStep) => (

                  <div
                    key={
                      currentStep
                    }
                    className="flex items-center gap-3"
                  >

                    <div
                      className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        step >=
                        currentStep
                          ? "bg-white text-green-800 border-white font-bold"
                          : "border-green-400 text-green-200"
                      }`}
                    >

                      {step >
                      currentStep ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        currentStep
                      )}

                    </div>

                    <span
                      className={`text-sm font-medium ${
                        step >=
                        currentStep
                          ? "text-white"
                          : "text-green-300"
                      }`}
                    >
                      {currentStep ===
                        1 &&
                        t("step1")}

                      {currentStep ===
                        2 &&
                        t("step2")}

                      {currentStep ===
                        3 &&
                        t("step3")}
                    </span>

                  </div>
                )
              )}

            </div>

          </div>

        </div>

        {/* =================================================
            RIGHT FORM
            ================================================= */}

        <div className="md:w-[66%] p-5 sm:p-7 md:p-9 bg-white relative">

          {/* LANGUAGE */}

          <div className="flex justify-end mb-6">

            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">

              <Languages className="w-4 h-4 text-gray-500 ml-1.5" />

              {[
                "en-US",
                "hi-IN",
                "mr-IN",
              ].map(
                (language) => (

                  <button
                    key={
                      language
                    }
                    type="button"
                    onClick={() =>
                      setLang(
                        language as
                          | "en-US"
                          | "hi-IN"
                          | "mr-IN"
                      )
                    }
                    className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      lang ===
                      language
                        ? "bg-green-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {language ===
                    "en-US"
                      ? "EN"
                      : language ===
                        "hi-IN"
                      ? "हिंदी"
                      : "मराठी"}
                  </button>

                )
              )}

            </div>

          </div>

          <form
            onSubmit={
              handleSubmit
            }
            className="flex flex-col"
          >

            {/* =================================================
                STEP 1
                ================================================= */}

            {step === 1 && (

              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                <div>

                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">

                    <User className="w-5 h-5 text-green-600" />

                    {t(
                      "personal"
                    )}

                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t(
                      "personalDesc"
                    )}
                  </p>

                </div>

                {/* NAME */}

                <div className="space-y-2">

                  <label className="text-sm font-medium text-gray-700">
                    {t(
                      "name"
                    )}{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    value={
                      name
                    }
                    onChange={(
                      e
                    ) => {
                      setName(
                        e.target.value
                      );

                      clearError(
                        "name"
                      );
                    }}
                    className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${
                      errors.name
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                        : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    }`}
                    placeholder={t(
                      "namePlaceholder"
                    )}
                  />

                  {errors.name && (

                    <p className="flex items-center gap-1 text-xs text-red-600">

                      <AlertCircle className="w-3.5 h-3.5" />

                      {
                        errors.name
                      }

                    </p>
                  )}

                </div>

                {/* PHONE */}

                <div className="space-y-2">

                  <label className="text-sm font-medium text-gray-700">
                    {t(
                      "phone"
                    )}{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">

                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                      +91
                    </span>

                    <input
                      value={
                        phone
                      }
                      onChange={(
                        e
                      ) => {
                        const value =
                          e.target.value
                            .replace(
                              /\D/g,
                              ""
                            )
                            .slice(
                              0,
                              10
                            );

                        setPhone(
                          value
                        );

                        setPhoneAlreadyRegistered(
                          false
                        );

                        clearError(
                          "phone"
                        );
                      }}
                      className={`w-full pl-12 pr-4 py-3 rounded-xl border outline-none transition-all ${
                        errors.phone
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      }`}
                      placeholder={t(
                        "phonePlaceholder"
                      )}
                      type="tel"
                      inputMode="numeric"
                      maxLength={
                        10
                      }
                    />

                  </div>

                  <div className="flex justify-between">

                    <div>

                      {errors.phone && (

                        <p className="flex items-center gap-1 text-xs text-red-600">

                          <AlertCircle className="w-3.5 h-3.5" />

                          {
                            errors.phone
                          }

                        </p>

                      )}

                    </div>

                    <span className="text-xs text-gray-400">
                      {
                        phone.length
                      }
                      /10
                    </span>

                  </div>

                  {/* =================================================
                      EXISTING ACCOUNT LOGIN OPTION
                      ================================================= */}

                  {phoneAlreadyRegistered && (

                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5">

                      <div className="flex items-start gap-3">

                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">

                          <AlertCircle className="w-4 h-4 text-amber-700" />

                        </div>

                        <div className="flex-1 min-w-0">

                          <p className="text-sm font-semibold text-amber-900">
                            {t("phoneExistsTitle")}
                          </p>

                          <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                            {t("phoneExists")}
                          </p>

                          <button
                            type="button"
                            onClick={() =>
                              router.push("/login")
                            }
                            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
                          >
                            {lang === "mr-IN"
                              ? "लॉगिन करा"
                              : lang === "hi-IN"
                              ? "लॉगिन करें"
                              : "Login Now"}

                            <ChevronRight className="w-4 h-4" />
                          </button>

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              </div>
            )}

            {/* =================================================
                STEP 2
                ================================================= */}

            {step === 2 && (

              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                <div>

                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">

                    <MapPin className="w-5 h-5 text-green-600" />

                    {t(
                      "location"
                    )}

                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t(
                      "locationDesc"
                    )}
                  </p>

                </div>

                {/* LOCATION DETECTION */}

                <button
                  type="button"
                  onClick={
                    detectLocation
                  }
                  disabled={
                    locLoading
                  }
                  className="w-full py-3.5 border-2 border-dashed border-green-300 rounded-xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >

                  {locLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}

                  {locLoading
                    ? t(
                        "highAccuracy"
                      )
                    : t(
                        "detectLocation"
                      )}

                </button>

                {/* LOCATION FOUND */}

                {location.display_name && (

                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">

                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />

                    <div className="min-w-0">

                      <p className="text-green-800 font-semibold">
                        {t(
                          "locationDetected"
                        )}
                      </p>

                      <p className="text-sm text-green-700 mt-1 break-words">
                        {
                          location.display_name
                        }
                      </p>

                    </div>

                  </div>

                )}

                {/* MANUAL LOCATION */}

                <div className="space-y-4">

                  {/* STATE */}

                  <div className="space-y-2">

                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t(
                        "state"
                      )}{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      className={`w-full px-3.5 py-3 rounded-xl border bg-white outline-none transition-all ${
                        errors.state
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      }`}
                      value={
                        manualState
                      }
                      onChange={(
                        e
                      ) => {
                        setManualState(
                          e.target
                            .value
                        );

                        setManualDistrict(
                          ""
                        );

                        clearError(
                          "state"
                        );

                        clearError(
                          "district"
                        );
                      }}
                    >

                      <option value="">
                        {t(
                          "selectState"
                        )}
                      </option>

                      {Object.keys(
                        INDIAN_STATES_DISTRICTS
                      ).map(
                        (
                          stateName
                        ) => (

                          <option
                            key={
                              stateName
                            }
                            value={
                              stateName
                            }
                          >
                            {
                              stateName
                            }
                          </option>

                        )
                      )}

                    </select>

                    {errors.state && (

                      <p className="flex items-center gap-1 text-xs text-red-600">

                        <AlertCircle className="w-3.5 h-3.5" />

                        {
                          errors.state
                        }

                      </p>
                    )}

                  </div>

                  {/* DISTRICT */}

                  <div className="space-y-2">

                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t(
                        "district"
                      )}{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <select
                      className={`w-full px-3.5 py-3 rounded-xl border bg-white outline-none transition-all ${
                        errors.district
                          ? "border-red-400 bg-red-50"
                          : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      }`}
                      value={
                        manualDistrict
                      }
                      onChange={(
                        e
                      ) => {
                        setManualDistrict(
                          e.target
                            .value
                        );

                        clearError(
                          "district"
                        );
                      }}
                      disabled={
                        !manualState
                      }
                    >

                      <option value="">
                        {t(
                          "selectDistrict"
                        )}
                      </option>

                      {districtsForState.map(
                        (
                          district
                        ) => (

                          <option
                            key={
                              district
                            }
                            value={
                              district
                            }
                          >
                            {
                              district
                            }
                          </option>

                        )
                      )}

                    </select>

                    {errors.district && (

                      <p className="flex items-center gap-1 text-xs text-red-600">

                        <AlertCircle className="w-3.5 h-3.5" />

                        {
                          errors.district
                        }

                      </p>
                    )}

                  </div>

                  {/* VILLAGE + PINCODE */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="space-y-2">

                      <label className="text-xs font-bold text-gray-600 uppercase">
                        {t(
                          "village"
                        )}
                      </label>

                      <input
                        value={
                          manualVillage
                        }
                        onChange={(
                          e
                        ) =>
                          setManualVillage(
                            e.target
                              .value
                          )
                        }
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        placeholder={t(
                          "village"
                        )}
                      />

                    </div>

                    <div className="space-y-2">

                      <label className="text-xs font-bold text-gray-600 uppercase">
                        {t(
                          "pincode"
                        )}
                      </label>

                      <input
                        value={
                          manualPincode
                        }
                        onChange={(
                          e
                        ) =>
                          setManualPincode(
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                6
                              )
                          )
                        }
                        maxLength={
                          6
                        }
                        inputMode="numeric"
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        placeholder="422001"
                      />

                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                STEP 3
                ================================================= */}

            {step === 3 && (

              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

                <div>

                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">

                    <Leaf className="w-5 h-5 text-green-600" />

                    {t(
                      "farming"
                    )}

                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t(
                      "chooseCrops"
                    )}
                  </p>

                </div>

                {/* CROPS */}

                <div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">

                    {AVAILABLE_CROPS.map(
                      (crop) => {

                        const selected =
                          selectedCrops.includes(
                            crop.id
                          );

                        return (

                          <button
                            key={
                              crop.id
                            }
                            type="button"
                            onClick={() =>
                              toggleCrop(
                                crop.id
                              )
                            }
                            className={`min-h-[72px] cursor-pointer border rounded-xl p-2.5 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                              selected
                                ? "bg-green-600 border-green-600 text-white shadow-md"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-300"
                            }`}
                          >

                            <span className="text-2xl mb-1">
                              {
                                crop.icon
                              }
                            </span>

                            <span className="text-xs font-medium leading-tight">
                              {
                                crop.label
                              }
                            </span>

                          </button>
                        );
                      }
                    )}

                  </div>

                  {errors.crops && (

                    <p className="flex items-center gap-1 text-xs text-red-600 mt-2">

                      <AlertCircle className="w-3.5 h-3.5" />

                      {
                        errors.crops
                      }

                    </p>
                  )}

                  {selectedCrops.length >
                    0 && (

                    <p className="text-xs text-green-700 mt-2">
                      ✓{" "}
                      {
                        selectedCrops.length
                      }{" "}
                      crop
                      {selectedCrops.length >
                      1
                        ? "s"
                        : ""}{" "}
                      selected
                    </p>
                  )}

                </div>

                {/* FARMING METHOD */}

                <div className="pt-5 border-t border-gray-100">

                  <div className="mb-3">

                    <label className="block text-sm font-semibold text-gray-800">
                      {t(
                        "farmingType"
                      )}
                    </label>

                    <p className="text-xs text-gray-500 mt-1">
                      {t(
                        "chooseMethod"
                      )}
                    </p>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {FARMING_METHODS.map(
                      (method) => {

                        const Icon =
                          method.icon;

                        const selected =
                          farmingType ===
                          method.id;

                        return (

                          <button
                            key={
                              method.id
                            }
                            type="button"
                            onClick={() =>
                              setFarmingType(
                                method.id as
                                  | "organic"
                                  | "traditional"
                                  | "modern"
                              )
                            }
                            className={`text-left rounded-xl border p-3.5 transition-all ${
                              selected
                                ? "border-green-600 bg-green-50 ring-2 ring-green-100 shadow-sm"
                                : "border-gray-200 bg-white hover:border-green-300 hover:bg-gray-50"
                            }`}
                          >

                            <div className="flex items-center gap-2 mb-2">

                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  selected
                                    ? "bg-green-600 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >

                                <Icon className="w-4 h-4" />

                              </div>

                              <span
                                className={`text-sm font-semibold ${
                                  selected
                                    ? "text-green-800"
                                    : "text-gray-700"
                                }`}
                              >
                                {t(
                                  method.id
                                )}
                              </span>

                            </div>

                            <p className="text-[11px] leading-relaxed text-gray-500">
                              {t(
                                `${method.id}Info`
                              )}
                            </p>

                            {selected && (

                              <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-green-700">

                                <CheckCircle2 className="w-3.5 h-3.5" />

                                Selected

                              </div>
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* =================================================
                    MPIN
                    ================================================= */}

                <div className="pt-5 border-t border-gray-100">

                  <div className="flex items-start gap-3 mb-4">

                    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">

                      <Lock className="w-4 h-4 text-green-700" />

                    </div>

                    <div>

                      <h4 className="font-semibold text-gray-800">
                        {t(
                          "mpinTitle"
                        )}
                      </h4>

                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {t(
                          "mpinDescription"
                        )}
                      </p>

                    </div>

                  </div>

                  {/* MPIN */}

                  <div className="space-y-2 mb-4">

                    <label className="block text-sm font-medium text-gray-700">
                      {t(
                        "mpin"
                      )}{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showMpin
                            ? "text"
                            : "password"
                        }
                        value={
                          mpin
                        }
                        onChange={(
                          e
                        ) => {
                          const value =
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                4
                              );

                          setMpin(
                            value
                          );

                          clearError(
                            "mpin"
                          );
                        }}
                        inputMode="numeric"
                        maxLength={
                          4
                        }
                        autoComplete="new-password"
                        placeholder={t(
                          "mpinPlaceholder"
                        )}
                        className={`w-full pl-4 pr-12 py-3 rounded-xl border outline-none tracking-[0.35em] font-semibold ${
                          errors.mpin
                            ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowMpin(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                        aria-label={
                          showMpin
                            ? t(
                                "hideMpin"
                              )
                            : t(
                                "showMpin"
                              )
                        }
                      >

                        {showMpin ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}

                      </button>

                    </div>

                    <div className="flex justify-between">

                      <div>

                        {errors.mpin && (

                          <p className="flex items-center gap-1 text-xs text-red-600">

                            <AlertCircle className="w-3.5 h-3.5" />

                            {
                              errors.mpin
                            }

                          </p>
                        )}

                        {!errors.mpin &&
                          mpin.length >
                            0 && (

                          <p
                            className={`text-xs ${
                              mpin.length ===
                              4
                                ? "text-green-600"
                                : "text-gray-500"
                            }`}
                          >
                            {
                              mpin.length
                            }
                            /4
                          </p>
                        )}

                      </div>

                    </div>

                  </div>

                  {/* CONFIRM MPIN */}

                  <div className="space-y-2">

                    <label className="block text-sm font-medium text-gray-700">
                      {t(
                        "confirmMpin"
                      )}{" "}
                      <span className="text-red-500">
                        *
                      </span>
                    </label>

                    <div className="relative">

                      <input
                        type={
                          showConfirmMpin
                            ? "text"
                            : "password"
                        }
                        value={
                          confirmMpin
                        }
                        onChange={(
                          e
                        ) => {
                          const value =
                            e.target.value
                              .replace(
                                /\D/g,
                                ""
                              )
                              .slice(
                                0,
                                4
                              );

                          setConfirmMpin(
                            value
                          );

                          clearError(
                            "confirmMpin"
                          );
                        }}
                        inputMode="numeric"
                        maxLength={
                          4
                        }
                        autoComplete="new-password"
                        placeholder={t(
                          "confirmMpinPlaceholder"
                        )}
                        className={`w-full pl-4 pr-12 py-3 rounded-xl border outline-none tracking-[0.35em] font-semibold ${
                          errors.confirmMpin
                            ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmMpin(
                            (value) =>
                              !value
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700"
                        aria-label={
                          showConfirmMpin
                            ? t(
                                "hideMpin"
                              )
                            : t(
                                "showMpin"
                              )
                        }
                      >

                        {showConfirmMpin ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}

                      </button>

                    </div>

                    {errors.confirmMpin ? (

                      <p className="flex items-center gap-1 text-xs text-red-600">

                        <AlertCircle className="w-3.5 h-3.5" />

                        {
                          errors.confirmMpin
                        }

                      </p>

                    ) : (
                      confirmMpin &&
                      confirmMpin ===
                        mpin && (

                        <p className="flex items-center gap-1 text-xs text-green-600">

                          <CheckCircle2 className="w-3.5 h-3.5" />

                          MPIN matches

                        </p>
                      )
                    )}

                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">

                    <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />

                    {t(
                      "security"
                    )}

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                NAVIGATION
                ================================================= */}

            <div className="mt-7 pt-5 border-t border-gray-100 flex items-center justify-between gap-4">

              {step > 1 ? (

                <button
                  type="button"
                  onClick={
                    goBack
                  }
                  disabled={
                    loading ||
                    checkingPhone
                  }
                  className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >

                  <ChevronLeft className="w-4 h-4" />

                  {t("back")}

                </button>

              ) : (
                <div />
              )}

              {step < 3 ? (

                <Button
                  type="button"
                  onClick={
                    goNext
                  }
                  disabled={
                    loading ||
                    checkingPhone
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-md shadow-green-100"
                >

                  {checkingPhone ? (

                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />

                      {t(
                        "checkingPhone"
                      )}
                    </>

                  ) : (

                    <>
                      {t("next")}

                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>

                  )}

                </Button>

              ) : (

                <Button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="bg-green-600 hover:bg-green-700 text-white px-5 sm:px-7 rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-md shadow-green-100"
                >

                  {loading ? (

                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />

                      {lang ===
                      "mr-IN"
                        ? "नोंदणी करत आहे..."
                        : lang ===
                          "hi-IN"
                        ? "पंजीकरण हो रहा है..."
                        : "Creating account..."}
                    </>

                  ) : (

                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />

                      {t(
                        "submit"
                      )}
                    </>

                  )}

                </Button>
              )}

            </div>

            {/* =================================================
                ALREADY REGISTERED
                ================================================= */}

            <div className="mt-5 text-center">

              <p className="text-sm text-gray-500">
                {lang === "mr-IN"
                  ? "आधीपासून खाते आहे?"
                  : lang === "hi-IN"
                  ? "क्या आपका खाता पहले से है?"
                  : "Already have an account?"}

                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                  className="ml-1 font-semibold text-green-700 hover:text-green-800 hover:underline"
                >
                  {lang === "mr-IN"
                    ? "लॉगिन करा"
                    : lang === "hi-IN"
                    ? "लॉगिन करें"
                    : "Login"}
                </button>
              </p>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}