"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

/* ==========================
   INDIAN STATES & DISTRICTS
   ========================== */

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": [
    "Anantapur",
    "Chittoor",
    "East Godavari",
    "Guntur",
    "Krishna",
    "Kurnool",
    "Prakasam",
    "Srikakulam",
    "Visakhapatnam",
    "Vizianagaram",
    "West Godavari",
    "YSR Kadapa",
  ],

  "Arunachal Pradesh": [
    "Tawang",
    "West Kameng",
    "East Kameng",
    "Papum Pare",
    "Kurung Kumey",
    "Kra Daadi",
    "Lower Subansiri",
    "Upper Subansiri",
    "West Siang",
    "East Siang",
    "Siang",
    "Upper Siang",
    "Lower Siang",
    "Lower Dibang Valley",
    "Dibang Valley",
    "Anjaw",
    "Lohit",
    "Namsai",
    "Changlang",
    "Tirap",
    "Longding",
  ],

  Assam: [
    "Baksa",
    "Barpeta",
    "Biswanath",
    "Bongaigaon",
    "Cachar",
    "Charaideo",
    "Chirang",
    "Darrang",
    "Dhemaji",
    "Dhubri",
    "Dibrugarh",
    "Dima Hasao",
    "Goalpara",
    "Golaghat",
    "Hailakandi",
    "Hojai",
    "Jorhat",
    "Kamrup Metropolitan",
    "Kamrup",
    "Karbi Anglong",
    "Karimganj",
    "Kokrajhar",
    "Lakhimpur",
    "Majuli",
    "Morigaon",
    "Nagaon",
    "Nalbari",
    "Sivasagar",
    "Sonitpur",
    "South Salmara-Mankachar",
    "Tinsukia",
    "Udalguri",
    "West Karbi Anglong",
  ],

  Bihar: [
    "Araria",
    "Arwal",
    "Aurangabad",
    "Banka",
    "Begusarai",
    "Bhagalpur",
    "Bhojpur",
    "Buxar",
    "Darbhanga",
    "East Champaran",
    "Gaya",
    "Gopalganj",
    "Jamui",
    "Jehanabad",
    "Kaimur",
    "Katihar",
    "Khagaria",
    "Kishanganj",
    "Lakhisarai",
    "Madhepura",
    "Madhubani",
    "Munger",
    "Muzaffarpur",
    "Nalanda",
    "Nawada",
    "Patna",
    "Purnia",
    "Rohtas",
    "Saharsa",
    "Samastipur",
    "Saran",
    "Sheikhpura",
    "Sheohar",
    "Sitamarhi",
    "Siwan",
    "Supaul",
    "Vaishali",
    "West Champaran",
  ],

  Chhattisgarh: [
    "Balod",
    "Baloda Bazar",
    "Balrampur",
    "Bastar",
    "Bemetara",
    "Bijapur",
    "Bilaspur",
    "Dantewada",
    "Dhamtari",
    "Durg",
    "Gariaband",
    "Janjgir-Champa",
    "Jashpur",
    "Kabirdham",
    "Kanker",
    "Kondagaon",
    "Korba",
    "Koriya",
    "Mahasamund",
    "Mungeli",
    "Narayanpur",
    "Raigarh",
    "Raipur",
    "Rajnandgaon",
    "Sukma",
    "Surajpur",
    "Surguja",
  ],

  Goa: ["North Goa", "South Goa"],

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

  Haryana: [
    "Ambala",
    "Bhiwani",
    "Charkhi Dadri",
    "Faridabad",
    "Fatehabad",
    "Gurugram",
    "Hisar",
    "Jhajjar",
    "Jind",
    "Kaithal",
    "Karnal",
    "Kurukshetra",
    "Mahendragarh",
    "Nuh",
    "Palwal",
    "Panchkula",
    "Panipat",
    "Rewari",
    "Rohtak",
    "Sirsa",
    "Sonipat",
    "Yamunanagar",
  ],

  "Himachal Pradesh": [
    "Bilaspur",
    "Chamba",
    "Hamirpur",
    "Kangra",
    "Kinnaur",
    "Kullu",
    "Lahaul and Spiti",
    "Mandi",
    "Shimla",
    "Sirmaur",
    "Solan",
    "Una",
  ],

  Jharkhand: [
    "Bokaro",
    "Chatra",
    "Deoghar",
    "Dhanbad",
    "Dumka",
    "East Singhbhum",
    "Garhwa",
    "Giridih",
    "Godda",
    "Gumla",
    "Hazaribagh",
    "Jamtara",
    "Khunti",
    "Koderma",
    "Latehar",
    "Lohardaga",
    "Pakur",
    "Palamu",
    "Ramgarh",
    "Ranchi",
    "Sahebganj",
    "Seraikela Kharsawan",
    "Simdega",
    "West Singhbhum",
  ],

  Karnataka: [
    "Bagalkot",
    "Ballari",
    "Belagavi",
    "Bengaluru Rural",
    "Bengaluru Urban",
    "Bidar",
    "Chamarajanagar",
    "Chikballapur",
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

  Kerala: [
    "Alappuzha",
    "Ernakulam",
    "Idukki",
    "Kannur",
    "Kasaragod",
    "Kollam",
    "Kottayam",
    "Kozhikode",
    "Malappuram",
    "Palakkad",
    "Pathanamthitta",
    "Thiruvananthapuram",
    "Thrissur",
    "Wayanad",
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

  Maharashtra: [
    "Ahmednagar",
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

  Manipur: [
    "Bishnupur",
    "Chandel",
    "Churachandpur",
    "Imphal East",
    "Imphal West",
    "Jiribam",
    "Kakching",
    "Kamjong",
    "Kangpokpi",
    "Noney",
    "Pherzawl",
    "Senapati",
    "Tamenglong",
    "Tengnoupal",
    "Thoubal",
    "Ukhrul",
  ],

  Meghalaya: [
    "East Garo Hills",
    "East Jaintia Hills",
    "East Khasi Hills",
    "North Garo Hills",
    "Ri Bhoi",
    "South Garo Hills",
    "South West Garo Hills",
    "South West Khasi Hills",
    "West Garo Hills",
    "West Jaintia Hills",
    "West Khasi Hills",
  ],

  Mizoram: [
    "Aizawl",
    "Champhai",
    "Kolasib",
    "Lawngtlai",
    "Lunglei",
    "Mamit",
    "Saiha",
    "Serchhip",
  ],

  Nagaland: [
    "Dimapur",
    "Kiphire",
    "Kohima",
    "Longleng",
    "Mokokchung",
    "Mon",
    "Peren",
    "Phek",
    "Tuensang",
    "Wokha",
    "Zunheboto",
  ],

  Odisha: [
    "Angul",
    "Balangir",
    "Balasore",
    "Bargarh",
    "Bhadrak",
    "Boudh",
    "Cuttack",
    "Deogarh",
    "Dhenkanal",
    "Gajapati",
    "Ganjam",
    "Jagatsinghpur",
    "Jajpur",
    "Jharsuguda",
    "Kalahandi",
    "Kandhamal",
    "Kendrapara",
    "Kendujhar",
    "Khordha",
    "Koraput",
    "Malkangiri",
    "Mayurbhanj",
    "Nabarangpur",
    "Nayagarh",
    "Nuapada",
    "Puri",
    "Rayagada",
    "Sambalpur",
    "Subarnapur",
    "Sundargarh",
  ],

  Punjab: [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Faridkot",
    "Fatehgarh Sahib",
    "Fazilka",
    "Ferozepur",
    "Gurdaspur",
    "Hoshiarpur",
    "Jalandhar",
    "Kapurthala",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Mohali",
    "Muktsar",
    "Pathankot",
    "Patiala",
    "Rupnagar",
    "Sangrur",
    "Shaheed Bhagat Singh Nagar",
    "Tarn Taran",
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

  Sikkim: [
    "East Sikkim",
    "North Sikkim",
    "South Sikkim",
    "West Sikkim",
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
    "Kanyakumari",
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
    "Jogulamba",
    "Kamareddy",
    "Karimnagar",
    "Khammam",
    "Komaram Bheem",
    "Mahabubabad",
    "Mahbubnagar",
    "Mancherial",
    "Medak",
    "Medchal",
    "Nagarkurnool",
    "Nalgonda",
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

  Tripura: [
    "Dhalai",
    "Gomati",
    "Khowai",
    "North Tripura",
    "Sepahijala",
    "South Tripura",
    "Unakoti",
    "West Tripura",
  ],

  "Uttar Pradesh": [
    "Agra",
    "Aligarh",
    "Ambedkar Nagar",
    "Amethi",
    "Amroha",
    "Auraiya",
    "Ayodhya",
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
    "Prayagraj",
    "Raebareli",
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

  Uttarakhand: [
    "Almora",
    "Bageshwar",
    "Chamoli",
    "Champawat",
    "Dehradun",
    "Haridwar",
    "Nainital",
    "Pauri Garhwal",
    "Pithoragarh",
    "Rudraprayag",
    "Tehri Garhwal",
    "Udham Singh Nagar",
    "Uttarkashi",
  ],

  "West Bengal": [
    "Alipurduar",
    "Bankura",
    "Birbhum",
    "Cooch Behar",
    "Dakshin Dinajpur",
    "Darjeeling",
    "Hooghly",
    "Howrah",
    "Jalpaiguri",
    "Jhargram",
    "Kalimpong",
    "Kolkata",
    "Malda",
    "Murshidabad",
    "Nadia",
    "North 24 Parganas",
    "Paschim Bardhaman",
    "Paschim Medinipur",
    "Purba Bardhaman",
    "Purba Medinipur",
    "Purulia",
    "South 24 Parganas",
    "Uttar Dinajpur",
  ],

  "Andaman and Nicobar Islands": [
    "Nicobar",
    "North and Middle Andaman",
    "South Andaman",
  ],

  Chandigarh: ["Chandigarh"],

  "Dadra and Nagar Haveli and Daman and Diu": [
    "Dadra and Nagar Haveli",
    "Daman",
    "Diu",
  ],

  Delhi: [
    "Central Delhi",
    "East Delhi",
    "New Delhi",
    "North Delhi",
    "North East Delhi",
    "North West Delhi",
    "Shahdara",
    "South Delhi",
    "South East Delhi",
    "South West Delhi",
    "West Delhi",
  ],

  "Jammu and Kashmir": [
    "Anantnag",
    "Bandipora",
    "Baramulla",
    "Budgam",
    "Doda",
    "Ganderbal",
    "Jammu",
    "Kathua",
    "Kishtwar",
    "Kulgam",
    "Kupwara",
    "Poonch",
    "Pulwama",
    "Rajouri",
    "Ramban",
    "Reasi",
    "Samba",
    "Shopian",
    "Srinagar",
    "Udhampur",
  ],

  Ladakh: ["Kargil", "Leh"],

  Lakshadweep: ["Lakshadweep"],

  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
};

/* ==========================
   AVAILABLE CROPS
   ========================== */

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

/* ==========================
   TRANSLATIONS
   ========================== */

const TRANSLATIONS: any = {
  "en-US": {
    title: "Join FarmAI",
    subtitle: "Complete your profile to get AI advisory",

    name: "Full Name",
    phone: "Mobile Number",
    language: "Language",

    password: "Password",
    confirmPassword: "Confirm Password",
    passwordHint: "Password must be at least 6 characters",

    detectLocation: "Use Current Location",
    locationDetected: "Location Detected",

    chooseCrops: "Select Crops You Grow",
    farmingType: "Farming Method",

    organic: "Organic",
    traditional: "Traditional",
    modern: "Modern / Hi-Tech",

    farmingDescriptionTitle: "What does this include?",

    traditionalDescription:
      "Common local farming practices using regular tools, seeds, fertilizers and pesticides.",

    modernDescription:
      "Uses machinery, drip irrigation, sensors, precision farming or other modern technology.",

    organicDescription:
      "Uses natural manure, compost and bio-inputs while avoiding synthetic chemical fertilizers and pesticides.",

    traditionalShort:
      "Regular farming methods and commonly used tools and inputs.",

    modernShort:
      "Technology-based farming with machines, irrigation, sensors and precision tools.",

    organicShort:
      "Natural inputs and methods with no synthetic chemical fertilizers or pesticides.",

    submit: "Complete Registration",
    success: "Registration successful!",

    errorLocation: "Location not found. Please enter manually.",
    fillAll: "Please fill all fields marked with *",

    state: "State",
    district: "District",
    pincode: "Pincode",
    village: "Village / Town",

    selectState: "Select State",
    selectDistrict: "Select District",

    manualLocation: "Enter Address Manually",
    editLocation: "Change Location",

    detecting: "Locating...",
    highAccuracy: "Refining location...",

    step1: "Personal",
    step2: "Location",
    step3: "Farming",

    nextStep: "Next Step",
    back: "Back",

    personalDescription: "Please enter your basic contact details.",
    locationDescription:
      "We need your farm location for soil & weather data.",
  },

  "hi-IN": {
    title: "FarmAI में शामिल हों",
    subtitle: "AI सलाह पाने के लिए अपनी प्रोफ़ाइल पूरी करें",

    name: "पूरा नाम",
    phone: "मोबाइल नंबर",
    language: "भाषा",

    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    passwordHint: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए",

    detectLocation: "मेरे वर्तमान स्थान का उपयोग करें",
    locationDetected: "स्थान प्राप्त हुआ",

    chooseCrops: "आप कौन सी फसल उगाते हैं?",
    farmingType: "खेती का तरीका",

    organic: "जैविक",
    traditional: "पारंपरिक",
    modern: "आधुनिक / हाई-टेक",

    farmingDescriptionTitle: "इसमें क्या शामिल है?",

    traditionalDescription:
      "स्थानीय और सामान्य खेती के तरीके, सामान्य औजार, बीज, खाद और कीटनाशकों का उपयोग।",

    modernDescription:
      "मशीनों, ड्रिप सिंचाई, सेंसर, सटीक खेती और अन्य आधुनिक तकनीकों का उपयोग।",

    organicDescription:
      "प्राकृतिक खाद, कम्पोस्ट और जैविक साधनों का उपयोग; रासायनिक खाद और कीटनाशकों से परहेज।",

    traditionalShort:
      "सामान्य खेती के तरीके और रोज़मर्रा के औजार व कृषि साधन।",

    modernShort:
      "मशीन, सिंचाई, सेंसर और तकनीक आधारित आधुनिक खेती।",

    organicShort:
      "प्राकृतिक साधनों से खेती, बिना कृत्रिम रासायनिक खाद और कीटनाशकों के।",

    submit: "पंजीकरण पूरा करें",
    success: "पंजीकरण सफल!",

    errorLocation: "स्थान नहीं मिला। कृपया मैन्युअल रूप से भरें।",
    fillAll: "कृपया सभी आवश्यक जानकारी भरें",

    state: "राज्य",
    district: "जिला",
    pincode: "पिनकोड",
    village: "गाँव / शहर",

    selectState: "राज्य चुनें",
    selectDistrict: "जिला चुनें",

    manualLocation: "पता मैन्युअली दर्ज करें",
    editLocation: "स्थान बदलें",

    detecting: "स्थान खोज रहे हैं...",
    highAccuracy: "सटीक स्थान ले रहे हैं...",

    step1: "व्यक्तिगत",
    step2: "स्थान",
    step3: "खेती",

    nextStep: "अगला चरण",
    back: "वापस",

    personalDescription: "कृपया अपनी मूल संपर्क जानकारी दर्ज करें।",
    locationDescription:
      "मिट्टी और मौसम की जानकारी के लिए हमें आपके खेत का स्थान चाहिए।",
  },

  "mr-IN": {
    title: "FarmAI मध्ये सामील व्हा",
    subtitle: "AI सल्ला मिळवण्यासाठी आपली माहिती भरा",

    name: "पूर्ण नाव",
    phone: "मोबाईल नंबर",
    language: "भाषा",

    password: "पासवर्ड",
    confirmPassword: "पासवर्डची पुष्टी करा",
    passwordHint: "पासवर्ड किमान 6 अक्षरांचा असावा",

    detectLocation: "माझे सध्याचे लोकेशन वापरा",
    locationDetected: "लोकेशन मिळाले",

    chooseCrops: "तुम्ही कोणती पिके घेता?",
    farmingType: "शेतीची पद्धत",

    organic: "सेंद्रिय",
    traditional: "पारंपारिक",
    modern: "आधुनिक / हाय-टेक",

    farmingDescriptionTitle: "यामध्ये काय समाविष्ट आहे?",

    traditionalDescription:
      "स्थानिक व नेहमीच्या शेती पद्धती, सामान्य अवजारे, बियाणे, खते व कीटकनाशकांचा वापर.",

    modernDescription:
      "यंत्रसामग्री, ठिबक सिंचन, सेन्सर, अचूक शेती व इतर आधुनिक तंत्रज्ञानाचा वापर.",

    organicDescription:
      "नैसर्गिक खत, कंपोस्ट व जैविक साधनांचा वापर; कृत्रिम रासायनिक खते व कीटकनाशके टाळली जातात.",

    traditionalShort:
      "नेहमीच्या शेती पद्धती, सामान्य अवजारे आणि वापरातील कृषी साधने.",

    modernShort:
      "यंत्रे, सिंचन, सेन्सर आणि तंत्रज्ञानावर आधारित आधुनिक शेती.",

    organicShort:
      "नैसर्गिक साधनांनी शेती; कृत्रिम रासायनिक खते व कीटकनाशके वापरली जात नाहीत.",

    submit: "नोंदणी पूर्ण करा",
    success: "नोंदणी यशस्वी!",

    errorLocation:
      "लोकेशन सापडले नाही. कृपया स्वतः माहिती भरा.",

    fillAll: "कृपया सर्व आवश्यक माहिती भरा",

    state: "राज्य",
    district: "जिल्हा",
    pincode: "पिनकोड",
    village: "गाव / शहर",

    selectState: "राज्य निवडा",
    selectDistrict: "जिल्हा निवडा",

    manualLocation: "पत्ता स्वतः टाका",
    editLocation: "लोकेशन बदला",

    detecting: "शोधत आहे...",
    highAccuracy: "अचूक लोकेशन मिळवत आहे...",

    step1: "वैयक्तिक",
    step2: "लोकेशन",
    step3: "शेती",

    nextStep: "पुढील टप्पा",
    back: "मागे",

    personalDescription:
      "कृपया आपली मूलभूत संपर्क माहिती भरा.",

    locationDescription:
      "माती आणि हवामानाची माहिती देण्यासाठी आम्हाला आपल्या शेताचे लोकेशन आवश्यक आहे.",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [lang, setLang] = useState<"en-US" | "hi-IN" | "mr-IN">("mr-IN");

  const t = (key: string) => TRANSLATIONS[lang][key] ?? key;

  /* ==========================
     FORM STATE
     ========================== */

  const [step, setStep] = useState<number>(1);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [location, setLocation] = useState<any>({});
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  const [showManualLocation, setShowManualLocation] = useState(false);

  const [manualState, setManualState] = useState("");
  const [manualDistrict, setManualDistrict] = useState("");
  const [manualPincode, setManualPincode] = useState("");
  const [manualVillage, setManualVillage] = useState("");

  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);

  const [farmingType, setFarmingType] = useState<
    "organic" | "traditional" | "modern"
  >("traditional");

  const [loading, setLoading] = useState(false);

  /* ==========================
     LOCATION DETECTION
     ========================== */

  async function reverseGeocodeWithRetry(
    lat: number,
    lon: number
  ): Promise<any | null> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await res.json();
      const address = data.address || {};

      let state = address.state || address.region || "";

      let district =
        address.state_district ||
        address.county ||
        address.city_district ||
        address.city ||
        "";

      district = district.replace(/\s+District$/i, "").trim();

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
        pincode: address.postcode || "",
        village,
        display_name: data.display_name || "",
      };
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  }

  function detectLocation() {
    setLocError(null);

    if (!navigator.geolocation) {
      setLocError(t("errorLocation"));
      setShowManualLocation(true);
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const loc = await reverseGeocodeWithRetry(lat, lon);

          if (loc) {
            setLocation(loc);

            setManualState(loc.state || "");
            setManualDistrict(loc.district || "");
            setManualPincode(loc.pincode || "");
            setManualVillage(loc.village || "");

            setShowManualLocation(true);

            toast({
              title: t("locationDetected"),
              description: loc.display_name || "",
              variant: "default",
            });
          } else {
            setLocError(t("errorLocation"));
            setShowManualLocation(true);
          }
        } catch (err) {
          setLocError(t("errorLocation"));
          setShowManualLocation(true);
        } finally {
          setLocLoading(false);
        }
      },

      () => {
        setLocLoading(false);
        setLocError(t("errorLocation"));
        setShowManualLocation(true);
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  }

  /* ==========================
     CROP SELECTION
     ========================== */

  function toggleCrop(cropId: string) {
    setSelectedCrops((prev) =>
      prev.includes(cropId)
        ? prev.filter((c) => c !== cropId)
        : [...prev, cropId]
    );
  }

  /* ==========================
     NEXT STEP
     ========================== */

  function goNext() {
    if (step === 1) {
      if (!name.trim() || !phone.trim()) {
        toast({
          title: "Incomplete",
          description: t("fillAll"),
          variant: "destructive",
        });

        return;
      }

      if (!/^\d{10}$/.test(phone.trim())) {
        toast({
          title: "Invalid Mobile Number",
          description: "Please enter a valid 10-digit mobile number.",
          variant: "destructive",
        });

        return;
      }

      setStep(2);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else if (step === 2) {
      if (!manualState || !manualDistrict) {
        toast({
          title: "Location Missing",
          description: "Please select your State and District",
          variant: "destructive",
        });

        return;
      }

      setStep(3);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  /* ==========================
     BACK
     ========================== */

  function goBack() {
    setStep((s) => Math.max(1, s - 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ==========================
     SUBMIT
     ========================== */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const finalState = manualState || location.state || "";
    const finalDistrict = manualDistrict || location.district || "";
    const finalPincode = manualPincode || location.pincode || "";
    const finalVillage = manualVillage || location.village || "";

    if (
      !name.trim() ||
      !phone.trim() ||
      !finalState ||
      !finalDistrict ||
      selectedCrops.length === 0
    ) {
      toast({
        title: "Error",
        description: t("fillAll"),
        variant: "destructive",
      });

      return;
    }

    if (!password) {
      toast({
        title: "Password Required",
        description: "Please create a password.",
        variant: "destructive",
      });

      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak Password",
        description: t("passwordHint"),
        variant: "destructive",
      });

      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });

      return;
    }

    setLoading(true);

    try {
      const locationParts = [
        finalVillage,
        finalDistrict,
        finalState,
        finalPincode,
      ].filter(Boolean);

      const farmLocation = locationParts.join(", ");

      const payload = {
        fullName: name,
        phone,
        preferredLanguage: lang,
        farmLocation,
        state: finalState,
        district: finalDistrict,
        pincode: finalPincode,
        village: finalVillage,
        latitude: location.lat || 0,
        longitude: location.lon || 0,
        crops: selectedCrops,
        farmingType,
        password,
      };

      const res = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Registration failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: t("success"),
          description: "Redirecting to login...",
          variant: "default",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Connection to server failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  /* ==========================
     DISTRICTS
     ========================== */

  const districtsForState = manualState
    ? INDIAN_STATES_DISTRICTS[manualState] || []
    : [];

  /* ==========================
     FARMING METHODS
     ========================== */

  const farmingMethods = [
    {
      id: "traditional",
      label: t("traditional"),
      description: t("traditionalShort"),
      detailedDescription: t("traditionalDescription"),
      icon: <Wheat className="w-5 h-5" />,
    },

    {
      id: "modern",
      label: t("modern"),
      description: t("modernShort"),
      detailedDescription: t("modernDescription"),
      icon: <Tractor className="w-5 h-5" />,
    },

    {
      id: "organic",
      label: t("organic"),
      description: t("organicShort"),
      detailedDescription: t("organicDescription"),
      icon: <Leaf className="w-5 h-5" />,
    },
  ];

  /* ==========================
     UI
     ========================== */

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-green-100">

        {/* ==========================
            SIDEBAR
            ========================== */}

        <div className="md:w-1/3 bg-gradient-to-br from-green-800 to-green-700 text-white p-8 flex flex-col justify-between relative overflow-hidden">

          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <Sprout className="absolute -bottom-10 -right-10 w-64 h-64" />
          </div>

          <div className="relative z-10">

            <div className="flex items-center gap-3 mb-8">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sprout className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight">
                FarmAI
              </h1>
            </div>

            <h2 className="text-3xl font-bold leading-tight mb-4">
              {t("title")}
            </h2>

            <p className="text-green-100 text-lg opacity-90">
              {t("subtitle")}
            </p>

          </div>

          {/* Stepper */}

          <div className="relative z-10 mt-8 md:mt-0 space-y-6">
            <div className="space-y-4">

              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-4"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      step >= s
                        ? "bg-white text-green-800 border-white font-bold"
                        : "border-green-400 text-green-200"
                    }`}
                  >
                    {step > s ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      s
                    )}
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      step >= s
                        ? "text-white"
                        : "text-green-300"
                    }`}
                  >
                    {s === 1 && t("step1")}
                    {s === 2 && t("step2")}
                    {s === 3 && t("step3")}
                  </span>
                </div>
              ))}

            </div>
          </div>
        </div>

        {/* ==========================
            MAIN FORM AREA
            ========================== */}

        <div className="md:w-2/3 p-6 md:p-10 bg-white relative">

          {/* Language selector */}

          <div className="absolute top-6 right-6 flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">

            <Languages className="w-4 h-4 text-gray-500 ml-1" />

            {["en-US", "hi-IN", "mr-IN"].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  lang === l
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l === "en-US"
                  ? "EN"
                  : l === "hi-IN"
                  ? "हिंदी"
                  : "मराठी"}
              </button>
            ))}

          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-12 h-full flex flex-col"
          >

            {/* ==========================
                STEP 1
                ========================== */}

            {step === 1 && (
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    {t("step1")}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t("personalDescription")}
                  </p>
                </div>

                <div className="space-y-4">

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("name")}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                      placeholder="e.g. Rajesh Kumar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("phone")}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <span className="absolute left-4 top-3.5 text-gray-400 font-medium">
                        +91
                      </span>

                      <input
                        value={phone}
                        onChange={(e) =>
                          setPhone(
                            e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10)
                          )
                        }
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                        placeholder="98765 43210"
                        type="tel"
                        maxLength={10}
                      />

                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ==========================
                STEP 2
                ========================== */}

            {step === 2 && (
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    {t("step2")}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t("locationDescription")}
                  </p>
                </div>

                {/* Auto Detect */}

                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locLoading}
                  className="w-full py-4 border-2 border-dashed border-green-300 rounded-xl bg-green-50 text-green-700 font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                >
                  {locLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}

                  {locLoading
                    ? t("highAccuracy")
                    : t("detectLocation")}
                </button>

                {/* Location detected */}

                {location.display_name &&
                  !showManualLocation && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-start gap-3">

                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />

                      <div>
                        <p className="text-green-800 font-medium">
                          {t("locationDetected")}
                        </p>

                        <p className="text-sm text-green-700 mt-1">
                          {location.display_name}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setShowManualLocation(true)
                          }
                          className="text-xs font-bold text-green-800 underline mt-2"
                        >
                          {t("editLocation")}
                        </button>
                      </div>

                    </div>
                  )}

                {/* Manual location fields */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t("state")}
                    </label>

                    <select
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-green-100 outline-none"
                      value={manualState}
                      onChange={(e) => {
                        setManualState(e.target.value);
                        setManualDistrict("");
                      }}
                    >
                      <option value="">
                        {t("selectState")}
                      </option>

                      {Object.keys(
                        INDIAN_STATES_DISTRICTS
                      ).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t("district")}
                    </label>

                    <select
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-green-100 outline-none"
                      value={manualDistrict}
                      onChange={(e) =>
                        setManualDistrict(e.target.value)
                      }
                      disabled={!manualState}
                    >
                      <option value="">
                        {t("selectDistrict")}
                      </option>

                      {districtsForState.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t("village")}
                    </label>

                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-100 outline-none"
                      value={manualVillage}
                      onChange={(e) =>
                        setManualVillage(e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-600 uppercase">
                      {t("pincode")}
                    </label>

                    <input
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-100 outline-none"
                      value={manualPincode}
                      onChange={(e) =>
                        setManualPincode(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      maxLength={6}
                    />
                  </div>

                </div>
              </div>
            )}

            {/* ==========================
                STEP 3
                ========================== */}

            {step === 3 && (
              <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">

                <div>
                  <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    {t("step3")}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    {t("chooseCrops")}
                  </p>
                </div>

                {/* ==========================
                    CROP GRID
                    ========================== */}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">

                  {AVAILABLE_CROPS.map((crop) => (
                    <div
                      key={crop.id}
                      onClick={() => toggleCrop(crop.id)}
                      className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 ${
                        selectedCrops.includes(crop.id)
                          ? "bg-green-600 border-green-600 text-white shadow-md transform scale-105"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-green-300"
                      }`}
                    >
                      <span className="text-2xl mb-1">
                        {crop.icon}
                      </span>

                      <span className="text-xs font-medium">
                        {crop.label}
                      </span>
                    </div>
                  ))}

                </div>

                {/* ==========================
                    PASSWORD
                    ========================== */}

                <div className="pt-4 border-t border-gray-100 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("password")}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />

                      <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all outline-none"
                        placeholder="Create your password"
                        autoComplete="new-password"
                      />

                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {t("passwordHint")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("confirmPassword")}{" "}
                      <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">

                      <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />

                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) =>
                          setConfirmPassword(e.target.value)
                        }
                        className={`w-full pl-11 pr-4 py-3 rounded-xl border transition-all outline-none ${
                          confirmPassword &&
                          confirmPassword !== password
                            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        }`}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                      />

                    </div>

                    {confirmPassword &&
                      confirmPassword !== password && (
                        <p className="text-xs text-red-500 mt-1">
                          Passwords do not match.
                        </p>
                      )}
                  </div>

                </div>

                {/* ==========================
                    FARMING METHOD
                    ========================== */}

                <div className="pt-4 border-t border-gray-100">

                  <div className="mb-3">
                    <label className="block text-sm font-semibold text-gray-700">
                      {t("farmingType")}
                    </label>

                    <p className="text-xs text-gray-500 mt-1">
                      {t("farmingDescriptionTitle")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                    {farmingMethods.map((type) => {
                      const isSelected =
                        farmingType === type.id;

                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() =>
                            setFarmingType(
                              type.id as
                                | "organic"
                                | "traditional"
                                | "modern"
                            )
                          }
                          className={`text-left rounded-xl border p-4 transition-all duration-200 ${
                            isSelected
                              ? "bg-green-50 border-green-600 ring-2 ring-green-100 shadow-sm"
                              : "bg-white border-gray-200 hover:border-green-300 hover:bg-green-50/40"
                          }`}
                        >

                          {/* Icon + title */}

                          <div className="flex items-center gap-2 mb-2">

                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                                isSelected
                                  ? "bg-green-600 text-white"
                                  : "bg-green-50 text-green-700"
                              }`}
                            >
                              {type.icon}
                            </div>

                            <span
                              className={`text-sm font-semibold ${
                                isSelected
                                  ? "text-green-800"
                                  : "text-gray-700"
                              }`}
                            >
                              {type.label}
                            </span>

                          </div>

                          {/* Short explanation */}

                          <p
                            className={`text-xs leading-relaxed ${
                              isSelected
                                ? "text-green-800"
                                : "text-gray-500"
                            }`}
                          >
                            {type.description}
                          </p>

                          {/* Selected indicator */}

                          {isSelected && (
                            <div className="flex items-center gap-1.5 mt-3 text-xs font-semibold text-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                              Selected
                            </div>
                          )}

                        </button>
                      );
                    })}

                  </div>

                  {/* Detailed explanation of selected method */}

                  <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-4">

                    <div className="flex items-start gap-3">

                      <div className="w-8 h-8 shrink-0 rounded-lg bg-green-100 text-green-700 flex items-center justify-center">
                        {farmingMethods.find(
                          (method) =>
                            method.id === farmingType
                        )?.icon}
                      </div>

                      <div>

                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          {
                            farmingMethods.find(
                              (method) =>
                                method.id === farmingType
                            )?.label
                          }
                        </p>

                        <p className="text-xs leading-relaxed text-gray-600">
                          {
                            farmingMethods.find(
                              (method) =>
                                method.id === farmingType
                            )?.detailedDescription
                          }
                        </p>

                      </div>

                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* ==========================
                NAVIGATION
                ========================== */}

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">

              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-gray-500 hover:text-gray-800 font-medium px-4 py-2"
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
                  onClick={goNext}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-xl h-12 text-base shadow-lg shadow-green-200"
                >
                  {t("nextStep")}

                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 rounded-xl h-12 text-base shadow-lg shadow-green-200 w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}

                  {t("submit")}
                </Button>
              )}

            </div>

          </form>
        </div>
      </div>
    </div>
  );
}