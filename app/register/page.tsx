"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CropSelector from "../../components/CropSelector";
import "./register.css";

type LocationInfo = {
  lat?: number;
  lon?: number;
  state?: string;
  district?: string;
  pincode?: string;
  village?: string;
  display_name?: string;
};

// Indian States and their districts
const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  "Andhra Pradesh": ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Tawang", "West Kameng", "East Kameng", "Papum Pare", "Kurung Kumey", "Kra Daadi", "Lower Subansiri", "Upper Subansiri", "West Siang", "East Siang", "Siang", "Upper Siang", "Lower Siang", "Lower Dibang Valley", "Dibang Valley", "Anjaw", "Lohit", "Namsai", "Changlang", "Tirap", "Longding"],
  "Assam": ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Chirang", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Dima Hasao", "Goalpara", "Golaghat", "Hailakandi", "Hojai", "Jorhat", "Kamrup Metropolitan", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "South Salmara-Mankachar", "Tinsukia", "Udalguri", "West Karbi Anglong"],
  "Bihar": ["Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"],
  "Chhattisgarh": ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya", "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
  "Haryana": ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  "Jharkhand": ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi", "Sahebganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"],
  "Karnataka": ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
  "Kerala": ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad", "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandla", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Panna", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol", "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"],
  "Maharashtra": ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  "Manipur": ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi", "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  "Meghalaya": ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  "Mizoram": ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  "Nagaland": ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  "Odisha": ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati", "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha", "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur", "Subarnapur", "Sundargarh"],
  "Punjab": ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shaheed Bhagat Singh Nagar", "Tarn Taran"],
  "Rajasthan": ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Karauli", "Kota", "Nagaur", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi", "Sri Ganganagar", "Tonk", "Udaipur"],
  "Sikkim": ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
  "Telangana": ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar", "Jogulamba", "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Mahabubabad", "Mahbubnagar", "Mancherial", "Medak", "Medchal", "Nagarkurnool", "Nalgonda", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"],
  "Tripura": ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Farrukhabad", "Fatehpur", "Firozabad", "Gautam Buddha Nagar", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
  "Uttarakhand": ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  "Chandigarh": ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  "Delhi": ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "North East Delhi", "North West Delhi", "Shahdara", "South Delhi", "South East Delhi", "South West Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Bandipora", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam", "Kupwara", "Poonch", "Pulwama", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"],
  "Ladakh": ["Kargil", "Leh"],
  "Lakshadweep": ["Lakshadweep"],
  "Puducherry": ["Karaikal", "Mahe", "Puducherry", "Yanam"]
};

const TRANSLATIONS: any = {
  "en-US": {
    title: "Register to FarmAI",
    subtitle: "Fast setup — takes 2 minutes",
    name: "Name",
    phone: "Phone number",
    language: "Language",
    detectLocation: "📍 Auto-detect my location",
    locationDetected: "Detected location",
    chooseCrops: "Choose your crops",
    farmingType: "Farming type",
    organic: "Organic",
    traditional: "Traditional",
    modern: "Modern",
    submit: "Register",
    success: "Registration successful!",
    errorLocation: "Couldn't auto-detect location, please enter manually.",
    fillAll: "All required fields must be filled",
    state: "State",
    district: "District",
    pincode: "Pincode",
    village: "Village/Town (Optional)",
    selectState: "Select State",
    selectDistrict: "Select District",
    manualLocation: "Or enter location manually:",
    editLocation: "Edit Location",
    detecting: "Detecting location...",
    highAccuracy: "Getting high-accuracy location...",
  },
  "hi-IN": {
    title: "FarmAI में पंजीकरण",
    subtitle: "तेज़ सेटअप — 2 मिनट में पूरा करें",
    name: "नाम",
    phone: "फ़ोन नंबर",
    language: "भाषा",
    detectLocation: "📍 मेरा स्थान स्वचालित रूप से खोजें",
    locationDetected: "पहचाना गया स्थान",
    chooseCrops: "अपनी फसल चुनें",
    farmingType: "खेती का प्रकार",
    organic: "जैविक",
    traditional: "पारंपरिक",
    modern: "आधुनिक",
    submit: "पंजीकरण",
    success: "पंजीकरण सफल!",
    errorLocation: "स्थान नहीं पाया, कृपया मैन्युअल रूप से दर्ज करें।",
    fillAll: "कृपया सभी आवश्यक फ़ील्ड भरें",
    state: "राज्य",
    district: "जिला",
    pincode: "पिनकोड",
    village: "गाँव/कस्बा (वैकल्पिक)",
    selectState: "राज्य चुनें",
    selectDistrict: "जिला चुनें",
    manualLocation: "या स्थान मैन्युअल रूप से दर्ज करें:",
    editLocation: "स्थान संपादित करें",
    detecting: "स्थान खोज रहे हैं...",
    highAccuracy: "सटीक स्थान प्राप्त कर रहे हैं...",
  },
  "mr-IN": {
    title: "FarmAI मध्ये नोंदणी",
    subtitle: "जलद सेटअप — 2 मिनिटांत पूर्ण करा",
    name: "नाव",
    phone: "फोन नंबर",
    language: "भाषा",
    detectLocation: "📍 माझे स्थान स्वयंचलितपणे शोधा",
    locationDetected: "ओळखलेले स्थान",
    chooseCrops: "आपली पिके निवडा",
    farmingType: "शेतीचा प्रकार",
    organic: "सेंद्रिय",
    traditional: "पारंपरिक",
    modern: "आधुनिक",
    submit: "नोंदणी",
    success: "नोंदणी यशस्वी!",
    errorLocation: "स्थान शोधले गेले नाही, कृपया मॅन्युअली भरा.",
    fillAll: "कृपया सर्व आवश्यक फील्ड भरा",
    state: "राज्य",
    district: "जिल्हा",
    pincode: "पिनकोड",
    village: "गाव/शहर (पर्यायी)",
    selectState: "राज्य निवडा",
    selectDistrict: "जिल्हा निवडा",
    manualLocation: "किंवा स्थान मॅन्युअली प्रविष्ट करा:",
    editLocation: "स्थान संपादित करा",
    detecting: "स्थान शोधत आहे...",
    highAccuracy: "उच्च अचूकता स्थान मिळवत आहे...",
  },
};

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useState<"en-US" | "hi-IN" | "mr-IN">("en-US");
  const t = (k: string) => TRANSLATIONS[lang][k] ?? k;

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState<LocationInfo>({});
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualState, setManualState] = useState("");
  const [manualDistrict, setManualDistrict] = useState("");
  const [manualPincode, setManualPincode] = useState("");
  const [manualVillage, setManualVillage] = useState("");
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [farmingType, setFarmingType] = useState<"organic" | "traditional" | "modern">(
    "traditional"
  );
  const [loading, setLoading] = useState(false);

  // Improved location detection with better accuracy for Indian addresses
  async function detectLocation() {
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
          // Try multiple geocoding services for better accuracy
          let locationData = await reverseGeocodeWithRetry(lat, lon);
          
          if (locationData) {
            setLocation(locationData);
            // Populate manual fields with detected data for easy editing
            setManualState(locationData.state || "");
            setManualDistrict(locationData.district || "");
            setManualPincode(locationData.pincode || "");
            setManualVillage(locationData.village || "");
            setShowManualLocation(true); // Show for verification/editing
          } else {
            setLocError(t("errorLocation"));
            setShowManualLocation(true);
          }
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setLocError(t("errorLocation"));
          setShowManualLocation(true);
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocLoading(false);
        setLocError(t("errorLocation"));
        setShowManualLocation(true);
      },
      { 
        enableHighAccuracy: true, // Request GPS if available
        timeout: 20000, // Increased timeout for better accuracy
        maximumAge: 0 // Don't use cached position
      }
    );
  }

  // Improved reverse geocoding with better parsing for Indian addresses
  async function reverseGeocodeWithRetry(lat: number, lon: number): Promise<LocationInfo | null> {
    try {
      // Use Nominatim with zoom level for better Indian address parsing
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en' // Ensure English results
          }
        }
      );
      
      if (!res.ok) throw new Error("Geocoding failed");
      
      const data = await res.json();
      const address = data.address || {};
      
      // Improved parsing for Indian addresses
      let state = address.state || address.region || "";
      let district = "";
      let village = "";
      
      // Better district detection for India
      if (address.state_district) {
        district = address.state_district;
      } else if (address.county) {
        district = address.county;
      } else if (address.city_district) {
        district = address.city_district;
      } else if (address.city) {
        district = address.city;
      }
      
      // Extract village/town
      if (address.village) {
        village = address.village;
      } else if (address.town) {
        village = address.town;
      } else if (address.suburb) {
        village = address.suburb;
      } else if (address.neighbourhood) {
        village = address.neighbourhood;
      }
      
      // Clean up district name (remove "District" suffix if present)
      district = district.replace(/\s+District$/i, "").trim();
      
      const loc: LocationInfo = {
        lat,
        lon,
        state: state,
        district: district,
        pincode: address.postcode || "",
        village: village,
        display_name: data.display_name || "",
      };
      
      console.log("Detected location:", loc);
      return loc;
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  }

  function toggleCrop(crop: string) {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  }

  // Handle registration submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Use manual fields if filled, otherwise use auto-detected
    const finalState = manualState || location.state;
    const finalDistrict = manualDistrict || location.district;
    const finalPincode = manualPincode || location.pincode;
    const finalVillage = manualVillage || location.village;

    // ✅ Validate required fields
    if (
      !name.trim() ||
      !phone.trim() ||
      !finalState ||
      !finalDistrict ||
      selectedCrops.length === 0 ||
      !farmingType
    ) {
      alert(t("fillAll"));
      return;
    }

    setLoading(true);

    try {
      // Build location display name
      const locationParts = [
        finalVillage,
        finalDistrict,
        finalState,
        finalPincode
      ].filter(Boolean);
      const farmLocation = locationParts.join(", ");

      const payload = {
        fullName: name,
        phone,
        preferredLanguage: lang,
        farmLocation: farmLocation,
        state: finalState,
        district: finalDistrict,
        pincode: finalPincode,
        village: finalVillage,
        latitude: location.lat,
        longitude: location.lon,
        crops: selectedCrops,
        farmingType,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Registration failed");
      } else {
        alert(t("success"));
        router.push("/login"); // Redirect to OTP login
      }
    } catch (err) {
      console.error("Register error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="simple-register">
      <div className="card">
        <h1 className="title">{t("title")}</h1>
        <p className="subtitle">{t("subtitle")}</p>

        {/* Language selector */}
        <div className="lang-row">
          <label>{t("language")}</label>
          <div className="lang-buttons">
            <button className={lang === "en-US" ? "active" : ""} type="button" onClick={() => setLang("en-US")}>English</button>
            <button className={lang === "hi-IN" ? "active" : ""} type="button" onClick={() => setLang("hi-IN")}>हिन्दी</button>
            <button className={lang === "mr-IN" ? "active" : ""} type="button" onClick={() => setLang("mr-IN")}>मराठी</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label className="label">{t("name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("name")} />

          <label className="label">{t("phone")}</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("phone")} inputMode="numeric" />

          {/* Location Detection Section */}
          <div className="location-section">
            <button 
              type="button" 
              className="location-btn" 
              onClick={detectLocation} 
              disabled={locLoading}
            >
              {locLoading ? t("detecting") : t("detectLocation")}
            </button>

            {location.display_name && (
              <div className="location-info">
                <strong>{t("locationDetected")}:</strong>
                <div className="detected-address">{location.display_name}</div>
                <small style={{ color: "#666", fontSize: "0.85rem" }}>
                  📍 Lat: {location.lat?.toFixed(6)}, Lon: {location.lon?.toFixed(6)}
                </small>
              </div>
            )}
            {locError && <div className="error">{locError}</div>}
          </div>

          {/* Manual Location Input Fields */}
          {(showManualLocation || locError) && (
            <div className="manual-location">
              <p style={{ margin: "10px 0", color: "#666", fontSize: "0.9rem" }}>
                {t("manualLocation")}
              </p>
              
              {/* State Selector */}
              <label className="label">{t("state")} *</label>
              <select 
                className="input" 
                value={manualState} 
                onChange={(e) => {
                  setManualState(e.target.value);
                  setManualDistrict(""); // Reset district when state changes
                }}
                required
              >
                <option value="">{t("selectState")}</option>
                {Object.keys(INDIAN_STATES_DISTRICTS).map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>

              {/* District Selector */}
              <label className="label">{t("district")} *</label>
              <select 
                className="input" 
                value={manualDistrict} 
                onChange={(e) => setManualDistrict(e.target.value)}
                disabled={!manualState}
                required
              >
                <option value="">{t("selectDistrict")}</option>
                {manualState && INDIAN_STATES_DISTRICTS[manualState]?.map((district) => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>

              {/* Village/Town */}
              <label className="label">{t("village")}</label>
              <input 
                className="input" 
                value={manualVillage} 
                onChange={(e) => setManualVillage(e.target.value)}
                placeholder={t("village")}
              />

              {/* Pincode */}
              <label className="label">{t("pincode")}</label>
              <input 
                className="input" 
                value={manualPincode} 
                onChange={(e) => setManualPincode(e.target.value)}
                placeholder={t("pincode")}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          )}

          <div className="crops-block">
            <label className="label">{t("chooseCrops")}</label>
            <CropSelector selected={selectedCrops} toggleCrop={toggleCrop} lang={lang} />
          </div>

          <div className="farming-type">
            <label className="label">{t("farmingType")}</label>
            <div className="farming-buttons">
              <button type="button" className={farmingType === "traditional" ? "active" : ""} onClick={() => setFarmingType("traditional")}>{t("traditional")}</button>
              <button type="button" className={farmingType === "modern" ? "active" : ""} onClick={() => setFarmingType("modern")}>{t("modern")}</button>
              <button type="button" className={farmingType === "organic" ? "active" : ""} onClick={() => setFarmingType("organic")}>{t("organic")}</button>
            </div>
          </div>

          <div className="submit-row">
            <button className="submit-btn" type="submit" disabled={loading}>
              {loading ? "Please wait…" : t("submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
