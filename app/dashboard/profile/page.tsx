"use client"

import { useState, useEffect, ChangeEvent, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/components/ui/tabs"

import {
	MapPin,
	Camera,
	Save,
	Edit,
	Lock,
	AlertTriangle,
	CheckCircle2,
	Globe,
	ShieldCheck,
	Landmark,
	UserRound,
	Tractor,
	FileCheck2,
	CircleAlert,
	Trash2,
	Upload,
	Sprout,
	Droplets,
	Navigation,
	Award,
	Phone,
	Mail,
	Layers,
	Wheat,
	IndianRupee,
	RefreshCw,
	Sparkles,
	HelpCircle,
	Check,
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import CropSelector from "@/components/CropSelector"
import { useLanguage } from "@/lib/i18n/LanguageContext"

// =========================================================
// USER PROFILE INTERFACE
// =========================================================

export interface UserProfile {
	_id?: string

	// Basic information
	fullName: string
	email?: string
	phone?: string

	// Farm & Location details
	farmName?: string
	farmLocation?: string
	state?: string
	district?: string
	taluka?: string
	pincode?: string
	village?: string
	latitude?: number
	longitude?: number

	// Cultivation & Soil
	crops?: string[]
	farmingType?: string
	experienceYears?: number | null
	soilType?: string
	soilHealthCard?: boolean | null
	irrigationType?: string
	irrigationSource?: string[]
	livestock?: string[]
	machinery?: string[]

	// Language
	preferredLanguage?: string

	// Profile photo
	profilePhoto?: string

	// Government Scheme Eligibility & Banking
	dateOfBirth?: string | null
	gender?: string
	socialCategory?: string
	farmerCategory?: string
	annualFamilyIncome?: number | null
	landHolding?: number | null
	landUnit?: string
	landOwnership?: string
	aadhaarLinked?: boolean | null
	bankAccountAvailable?: boolean | null
	pmKisanRegistered?: boolean | null
	kccHolder?: boolean | null
	cropInsuranceActive?: boolean | null

	// Account
	createdAt?: string

	[key: string]: any
}

// =========================================================
// ELIGIBILITY & ESSENTIAL FIELDS
// =========================================================

const eligibilityFields = [
	"dateOfBirth",
	"gender",
	"socialCategory",
	"farmerCategory",
	"annualFamilyIncome",
	"landHolding",
	"landUnit",
	"landOwnership",
	"irrigationType",
	"aadhaarLinked",
	"bankAccountAvailable",
	"pmKisanRegistered",
]

const eligibilityFieldLabels: Record<string, string> = {
	dateOfBirth: "Date of Birth",
	gender: "Gender",
	socialCategory: "Social Category",
	farmerCategory: "Farmer Category",
	annualFamilyIncome: "Annual Family Income",
	landHolding: "Land Holding",
	landUnit: "Land Unit",
	landOwnership: "Land Ownership",
	irrigationType: "Irrigation Type",
	aadhaarLinked: "Aadhaar Linked",
	bankAccountAvailable: "Bank Account",
	pmKisanRegistered: "PM-KISAN Registration",
}

// Soil Types common in Indian Agriculture
const SOIL_TYPES = [
	{ value: "black_cotton", label: "Black Cotton Soil (काळी सुपीक माती / Regur)" },
	{ value: "red_loam", label: "Red Loamy Soil (तांबडी माती)" },
	{ value: "alluvial", label: "Alluvial Soil (गाळाची माती)" },
	{ value: "sandy_loam", label: "Sandy Loam Soil (वालुकामय माती)" },
	{ value: "clay_loam", label: "Clay Loam Soil (चिकनमाती)" },
	{ value: "laterite", label: "Laterite Soil (जांभा दगडी माती)" },
]

// Water / Irrigation Sources
const IRRIGATION_SOURCES = [
	{ id: "open_well", label: "Open Well (विहीर / कुआं)" },
	{ id: "borewell", label: "Borewell (बोअरवेल / नलकूप)" },
	{ id: "canal", label: "Canal (कालवा / नहर)" },
	{ id: "farm_pond", label: "Farm Pond (शेततळे / तालाब)" },
	{ id: "river_stream", label: "River / Stream (नदी / नाला)" },
	{ id: "rainfed", label: "Rainfed Only (केवळ पावसाचे पाणी)" },
]

// Livestock & Allied Agriculture
const LIVESTOCK_OPTIONS = [
	{ id: "cows", label: "Dairy Cows (गायी)" },
	{ id: "buffaloes", label: "Buffaloes (म्हशी)" },
	{ id: "goats_sheep", label: "Goats / Sheep (शेळी-मेंढी)" },
	{ id: "poultry", label: "Poultry (कुक्कुटपालन)" },
	{ id: "fishery", label: "Fishery (मत्स्यपालन)" },
]

// Farm Machinery & Implements
const MACHINERY_OPTIONS = [
	{ id: "tractor", label: "Tractor (ट्रॅक्टर)" },
	{ id: "power_tiller", label: "Power Tiller / Rotavator" },
	{ id: "battery_sprayer", label: "Battery Sprayer (बॅटरी फवारणी पंप)" },
	{ id: "drip_system", label: "Drip System (ठिबक सिंचन संच)" },
	{ id: "solar_pump", label: "Solar Water Pump (कुसुम योजना पंप)" },
	{ id: "harvester", label: "Harvester / Thresher" },
]

// =========================================================
// HELPER: CLIENT-SIDE IMAGE COMPRESSION (Canvas to WebP/JPEG)
// =========================================================

const compressImage = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			return reject(new Error("Please upload a valid image file."))
		}

		const reader = new FileReader()
		reader.readAsDataURL(file)
		reader.onload = (event) => {
			const img = new Image()
			img.src = event.target?.result as string
			img.onload = () => {
				const canvas = document.createElement("canvas")
				const maxDim = 480 // 480px is ideal for crisp avatar and fast <40KB payload
				let width = img.width
				let height = img.height

				if (width > height) {
					if (width > maxDim) {
						height = Math.round((height * maxDim) / width)
						width = maxDim
					}
				} else {
					if (height > maxDim) {
						width = Math.round((width * maxDim) / height)
						height = maxDim
					}
				}

				canvas.width = width
				canvas.height = height
				const ctx = canvas.getContext("2d")
				if (!ctx) {
					return resolve(event.target?.result as string)
				}

				ctx.drawImage(img, 0, 0, width, height)
				// Convert to high efficiency JPEG
				const compressed = canvas.toDataURL("image/jpeg", 0.85)
				resolve(compressed)
			}
			img.onerror = () => reject(new Error("Could not decode image file."))
		}
		reader.onerror = () => reject(new Error("Could not read image file."))
	})
}

// =========================================================
// CHECK WHETHER A FIELD IS COMPLETE
// =========================================================

const isEligibilityFieldComplete = (
	profile: UserProfile,
	field: string
): boolean => {
	const value = profile[field]
	if (value === null || value === undefined || value === "") {
		return false
	}
	if (typeof value === "boolean") return true
	if (typeof value === "number") return !isNaN(value)
	return true
}

const calculateEligibilityCompletion = (profile: UserProfile) => {
	const completed = eligibilityFields.filter((field) =>
		isEligibilityFieldComplete(profile, field)
	).length
	return Math.round((completed / eligibilityFields.length) * 100)
}

// =========================================================
// MAIN PROFILE PAGE COMPONENT
// =========================================================

export default function ProfilePage() {
	const { t } = useLanguage()
	const router = useRouter()
	const fileInputRef = useRef<HTMLInputElement>(null)

	// State
	const [isEditing, setIsEditing] = useState(false)
	const [profileData, setProfileData] = useState<UserProfile | null>(null)
	const [originalData, setOriginalData] = useState<UserProfile | null>(null)

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [detectingLocation, setDetectingLocation] = useState(false)
	const [activeTab, setActiveTab] = useState("overview")

	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [showSensitiveWarning, setShowSensitiveWarning] = useState(false)
	const [customCropInput, setCustomCropInput] = useState("")

	// =====================================================
	// FETCH USER PROFILE
	// =====================================================

	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true)
			setError(null)

			try {
				const token = localStorage.getItem("token")

				if (!token) {
					router.push("/login")
					return
				}

				const res = await fetch("/api/user", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})

				if (res.status === 401) {
					localStorage.removeItem("token")
					localStorage.removeItem("user")
					router.push("/login")
					return
				}

				if (!res.ok) {
					const errorText = await res.text()
					throw new Error(
						`Failed to fetch user: ${res.status} ${errorText}`
					)
				}

				const data = await res.json()
				const userData: UserProfile =
					data?.user && data?.user?._id
						? data.user
						: data

				setProfileData(userData)
				setOriginalData(JSON.parse(JSON.stringify(userData)))
				localStorage.setItem("user", JSON.stringify(userData))
			} catch (err: any) {
				console.error("Error fetching user:", err)
				setError(err.message || "Could not load profile data.")
			} finally {
				setLoading(false)
			}
		}

		fetchUser()
	}, [router])

	// =====================================================
	// INPUT HANDLERS
	// =====================================================

	const handleInputChange = (field: keyof UserProfile, value: any) => {
		setProfileData((prev) =>
			prev ? { ...prev, [field]: value } : null
		)

		if (
			(field === "phone" || field === "email") &&
			value !== originalData?.[field]
		) {
			setShowSensitiveWarning(true)
		}
	}

	// Toggle multi-select items (irrigation sources, livestock, machinery)
	const toggleArrayItem = (field: "irrigationSource" | "livestock" | "machinery", item: string) => {
		if (!profileData) return
		const current = profileData[field] || []
		const updated = current.includes(item)
			? current.filter((x) => x !== item)
			: [...current, item]
		handleInputChange(field, updated)
	}

	// =====================================================
	// PROFILE PHOTO UPLOAD & REMOVAL
	// =====================================================

	const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0]
			try {
				const compressed = await compressImage(file)
				setProfileData((prev) =>
					prev ? { ...prev, profilePhoto: compressed } : null
				)
				setSuccess("Photo selected! Click 'Save Changes' to permanently apply.")
				setTimeout(() => setSuccess(null), 3000)
			} catch (err: any) {
				setError(err.message || "Failed to process photo.")
				setTimeout(() => setError(null), 3500)
			}
		}
	}

	const handleRemovePhoto = () => {
		if (!window.confirm("Are you sure you want to remove your profile photo?")) {
			return
		}
		setProfileData((prev) =>
			prev ? { ...prev, profilePhoto: "" } : null
		)
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
		setSuccess("Photo removed from preview. Click 'Save Changes' to confirm.")
		setTimeout(() => setSuccess(null), 3000)
	}

	// =====================================================
	// GPS LOCATION DETECTION
	// =====================================================

	const handleDetectLocation = () => {
		if (!navigator.geolocation) {
			alert("Geolocation is not supported by your browser.")
			return
		}
		setDetectingLocation(true)
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setDetectingLocation(false)
				const lat = Number(pos.coords.latitude.toFixed(6))
				const lon = Number(pos.coords.longitude.toFixed(6))
				handleInputChange("latitude", lat)
				handleInputChange("longitude", lon)
				setSuccess(`GPS coordinates updated (${lat}, ${lon})!`)
				setTimeout(() => setSuccess(null), 3000)
			},
			(err) => {
				setDetectingLocation(false)
				alert("Could not detect location: " + err.message)
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		)
	}

	// =====================================================
	// CROP MANAGEMENT
	// =====================================================

	const toggleCrop = (crop: string) => {
		if (!profileData) return
		const currentCrops = profileData.crops || []
		const newCrops = currentCrops.includes(crop)
			? currentCrops.filter((c) => c !== crop)
			: [...currentCrops, crop]
		handleInputChange("crops", newCrops)
	}

	const handleAddCustomCrop = () => {
		if (!customCropInput.trim() || !profileData) return
		const trimmed = customCropInput.trim()
		const currentCrops = profileData.crops || []
		if (!currentCrops.includes(trimmed)) {
			handleInputChange("crops", [...currentCrops, trimmed])
		}
		setCustomCropInput("")
	}

	// =====================================================
	// CANCEL & RESET
	// =====================================================

	const handleCancel = () => {
		if (originalData) {
			setProfileData(JSON.parse(JSON.stringify(originalData)))
		}
		setIsEditing(false)
		setShowSensitiveWarning(false)
		setError(null)
		setSuccess(null)
		if (fileInputRef.current) fileInputRef.current.value = ""
	}

	// =====================================================
	// SAVE PROFILE TO DATABASE
	// =====================================================

	const handleSave = async () => {
		if (!profileData) return

		const phoneChanged = profileData.phone !== originalData?.phone
		const emailChanged = profileData.email !== originalData?.email

		if (phoneChanged || emailChanged) {
			const confirmMessage =
				phoneChanged && emailChanged
					? "You're updating both phone number and email. Continue?"
					: phoneChanged
						? "Changing your registered phone number requires verification. Continue?"
						: "Changing your email address. Continue?"

			if (!window.confirm(confirmMessage)) return
		}

		setSaving(true)
		setError(null)
		setSuccess(null)

		try {
			const token = localStorage.getItem("token")
			if (!token) {
				router.push("/login")
				return
			}

			const updatePayload = {
				fullName: profileData.fullName,
				email: profileData.email || "",
				phone: profileData.phone || "",
				farmName: profileData.farmName || "",
				farmLocation:
					profileData.farmLocation ||
					[profileData.village, profileData.district, profileData.state]
						.filter(Boolean)
						.join(", "),
				state: profileData.state || "",
				district: profileData.district || "",
				taluka: profileData.taluka || "",
				pincode: profileData.pincode || "",
				village: profileData.village || "",
				latitude: profileData.latitude || 0,
				longitude: profileData.longitude || 0,
				crops: profileData.crops || [],
				farmingType: profileData.farmingType || "traditional",
				experienceYears: profileData.experienceYears ?? null,
				soilType: profileData.soilType || "",
				soilHealthCard: profileData.soilHealthCard ?? null,
				irrigationType: profileData.irrigationType || "",
				irrigationSource: profileData.irrigationSource || [],
				livestock: profileData.livestock || [],
				machinery: profileData.machinery || [],
				preferredLanguage: profileData.preferredLanguage || "en-US",

				// Profile photo: sends data URL or empty string
				profilePhoto: profileData.profilePhoto || "",
				removePhoto: !profileData.profilePhoto,

				// Schemes & Eligibility
				dateOfBirth: profileData.dateOfBirth || null,
				gender: profileData.gender || "",
				socialCategory: profileData.socialCategory || "",
				farmerCategory: profileData.farmerCategory || "",
				annualFamilyIncome: profileData.annualFamilyIncome ?? null,
				landHolding: profileData.landHolding ?? null,
				landUnit: profileData.landUnit || "",
				landOwnership: profileData.landOwnership || "",
				aadhaarLinked: profileData.aadhaarLinked ?? null,
				bankAccountAvailable: profileData.bankAccountAvailable ?? null,
				pmKisanRegistered: profileData.pmKisanRegistered ?? null,
				kccHolder: profileData.kccHolder ?? null,
				cropInsuranceActive: profileData.cropInsuranceActive ?? null,
			}

			const res = await fetch("/api/user", {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updatePayload),
			})

			if (res.status === 401) {
				localStorage.removeItem("token")
				localStorage.removeItem("user")
				router.push("/login")
				return
			}

			if (!res.ok) {
				const errorText = await res.text()
				throw new Error(`Failed to save profile: ${res.status} ${errorText}`)
			}

			const responseData = await res.json()
			const updated: UserProfile =
				responseData?.user && responseData?.user?._id
					? responseData.user
					: responseData

			setProfileData(updated)
			setOriginalData(JSON.parse(JSON.stringify(updated)))
			setIsEditing(false)
			setShowSensitiveWarning(false)

			// Sync with localStorage for sidebar and top nav avatars
			localStorage.setItem("user", JSON.stringify(updated))
			window.dispatchEvent(new Event("storage"))

			setSuccess("Farmer profile successfully updated in database!")
			setTimeout(() => setSuccess(null), 3500)
		} catch (err: any) {
			console.error("Error saving profile:", err)
			setError(err.message || "Failed to save profile.")
		} finally {
			setSaving(false)
		}
	}

	// =====================================================
	// COMPUTED METRICS
	// =====================================================

	const eligibilityCompletion = profileData
		? calculateEligibilityCompletion(profileData)
		: 0

	const missingEligibilityFields = profileData
		? eligibilityFields.filter((f) => !isEligibilityFieldComplete(profileData, f))
		: []

	const farmerKisanId = profileData?._id
		? `FARMAI-IN-${profileData._id.slice(-6).toUpperCase()}`
		: "FARMAI-IN-78291"

	// Resolve photo URL (data URL or relative path)
	const resolvedPhotoUrl = profileData?.profilePhoto
		? profileData.profilePhoto.startsWith("data:") ||
		  profileData.profilePhoto.startsWith("http")
			? profileData.profilePhoto
			: `${process.env.NEXT_PUBLIC_API_URL || ""}${profileData.profilePhoto}`
		: ""

	// =====================================================
	// RENDER GUARDS
	// =====================================================

	if (loading) {
		return (
			<DashboardLayout>
				<div className="flex flex-col justify-center items-center h-[50vh] gap-3">
					<RefreshCw className="h-8 w-8 text-primary animate-spin" />
					<p className="text-lg font-medium text-muted-foreground">
						Loading farmer profile records...
					</p>
				</div>
			</DashboardLayout>
		)
	}

	if (error && !profileData) {
		return (
			<DashboardLayout>
				<Card className="border-red-500/50 bg-red-500/10 max-w-2xl mx-auto my-12">
					<CardHeader>
						<CardTitle className="text-red-600 flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Failed to Load Profile
						</CardTitle>
						<CardDescription className="text-red-700">
							{error}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={() => window.location.reload()} variant="outline">
							Retry
						</Button>
					</CardContent>
				</Card>
			</DashboardLayout>
		)
	}

	if (!profileData) return null

	// =====================================================
	// MAIN UI RENDER
	// =====================================================

	return (
		<DashboardLayout>
			<div className="mx-auto max-w-7xl space-y-5 pb-10 text-slate-800">

				{/* -------------------------------------------------
				    PAGE TITLE & ACTION BAR
				------------------------------------------------- */}
				<div className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
					<div>
						<div className="flex items-center gap-2.5">
							<div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
								<Sprout className="h-6 w-6" />
							</div>
							<div>
								<h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
									Farmer Profile & Identity
								</h1>
								<p className="mt-1 text-sm leading-relaxed text-slate-600">
									शेतकरी प्रोफाईल व कृषी ओळखपत्र • Verified agricultural credentials
								</p>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{isEditing ? (
							<>
								<Button
									variant="outline"
									onClick={handleCancel}
									disabled={saving}
									className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
								>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									disabled={saving || !profileData.fullName}
									className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2"
								>
									{saving ? (
										<>
											<RefreshCw className="h-4 w-4 animate-spin" />
											Saving to Database...
										</>
									) : (
										<>
											<Save className="h-4 w-4" />
											Save Changes
										</>
									)}
								</Button>
							</>
						) : (
							<Button
								onClick={() => setIsEditing(true)}
								className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-2"
							>
								<Edit className="h-4 w-4" />
								Edit Profile Details
							</Button>
						)}
					</div>
				</div>

				{/* -------------------------------------------------
				    FEEDBACK ALERTS
				------------------------------------------------- */}
				{success && (
					<Alert className="border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm animate-in fade-in duration-300">
						<CheckCircle2 className="h-5 w-5 text-emerald-600" />
						<AlertDescription className="font-medium">
							{success}
						</AlertDescription>
					</Alert>
				)}

				{error && (
					<Alert variant="destructive" className="shadow-sm animate-in fade-in duration-300">
						<AlertTriangle className="h-5 w-5" />
						<AlertDescription className="font-medium">
							{error}
						</AlertDescription>
					</Alert>
				)}

				{showSensitiveWarning && isEditing && (
					<Alert className="border-amber-400 bg-amber-50 text-amber-900 shadow-sm">
						<Lock className="h-5 w-5 text-amber-600" />
						<AlertDescription className="text-xs sm:text-sm">
							<strong>Security Note:</strong> Changing your primary phone number or email will require mobile SMS / OTP re-verification on your next sign-in.
						</AlertDescription>
					</Alert>
				)}

				{/* -------------------------------------------------
				    DIGITAL FARMER PASSBOOK / IDENTITY HEADER CARD
				------------------------------------------------- */}
				<div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50 to-teal-50 p-5 text-slate-800 shadow-md ring-1 ring-emerald-100 md:p-7">
					{/* Decorative background watermark */}
					<div className="pointer-events-none absolute bottom-0 right-0 translate-x-8 translate-y-8 opacity-[0.09]">
						<Tractor className="h-80 w-80 text-emerald-800" />
					</div>

					<div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8">
						
						{/* Photo Avatar with Upload & Delete controls */}
						<div className="flex flex-col items-center gap-3">
							<div className="relative group">
								<Avatar className="h-28 w-28 rounded-full border-4 border-white bg-emerald-100 shadow-md ring-2 ring-emerald-100 md:h-32 md:w-32">
									{resolvedPhotoUrl ? (
										<AvatarImage
											src={resolvedPhotoUrl}
											alt={`${profileData.fullName}'s profile`}
											className="object-cover"
										/>
									) : (
										<AvatarFallback className="bg-emerald-100 text-emerald-800 text-3xl font-bold tracking-wider">
											{profileData.fullName
												? profileData.fullName
														.split(" ")
														.map((n: string) => n[0])
														.join("")
														.toUpperCase()
												: "FR"}
										</AvatarFallback>
									)}
								</Avatar>

								{/* Camera Overlay when Editing */}
								{isEditing && (
									<label
										htmlFor="profile-photo-upload"
										className="absolute bottom-1 right-1 p-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full cursor-pointer shadow-lg border-2 border-white transition-all transform hover:scale-110"
										title="Upload new profile picture"
									>
										<Camera className="h-4 w-4" />
										<input
											id="profile-photo-upload"
											ref={fileInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={handlePhotoUpload}
										/>
									</label>
								)}
							</div>

							{/* Photo Action Buttons when in Edit mode */}
							{isEditing && (
								<div className="flex items-center gap-2 mt-1">
									<label
										htmlFor="profile-photo-upload"
										className="flex cursor-pointer items-center gap-1 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-50"
									>
										<Upload className="h-3 w-3" />
										Upload Photo
									</label>

									{resolvedPhotoUrl && (
										<button
											type="button"
											onClick={handleRemovePhoto}
											className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
											title="Remove current photo"
										>
											<Trash2 className="h-3 w-3" />
											Remove
										</button>
									)}
								</div>
							)}

							<div className="text-center">
								<Badge className="border-emerald-200 bg-emerald-100 text-[11px] font-mono tracking-wider text-emerald-800">
									{farmerKisanId}
								</Badge>
							</div>
						</div>

						{/* Identity & Farm Info Details */}
						<div className="flex-1 text-center lg:text-left space-y-3">
							<div className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
								<h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
									{profileData.fullName || "Farmer"}
								</h2>

								<Badge className="flex items-center gap-1 border border-emerald-200 bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-800 shadow-none">
									<Award className="h-3.5 w-3.5" />
									Verified Farmer
								</Badge>
							</div>

							<p className="text-base font-semibold text-emerald-800 md:text-lg">
								{profileData.farmName || "Primary Krishi Holding"}
							</p>

							{/* Location & Contact row */}
							<div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-600 lg:justify-start">
								<div className="flex items-center gap-1.5">
									<MapPin className="h-4 w-4 shrink-0 text-emerald-700" />
									<span>
										{[
											profileData.village,
											profileData.taluka,
											profileData.district,
											profileData.state,
										]
											.filter(Boolean)
											.join(", ") || "Location not set"}
									</span>
								</div>

								{profileData.phone && (
									<div className="flex items-center gap-1.5">
										<Phone className="h-4 w-4 shrink-0 text-emerald-700" />
										<span>+91 {profileData.phone}</span>
									</div>
								)}

								{profileData.email && (
									<div className="flex items-center gap-1.5">
										<Mail className="h-4 w-4 shrink-0 text-emerald-700" />
										<span>{profileData.email}</span>
									</div>
								)}
							</div>

							{/* Key Crop Badges */}
							<div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 pt-1">
								<span className="mr-1 text-xs font-semibold text-slate-600">
									Cultivating:
								</span>
								{profileData.crops && profileData.crops.length > 0 ? (
									profileData.crops.slice(0, 5).map((crop) => (
										<Badge
											key={crop}
											variant="secondary"
											className="border border-emerald-200 bg-emerald-100 text-xs capitalize text-emerald-800"
										>
											🌿 {crop}
										</Badge>
									))
								) : (
									<span className="text-xs italic text-slate-500">
										No crops registered
									</span>
								)}
								{profileData.crops && profileData.crops.length > 5 && (
									<Badge
										variant="secondary"
										className="bg-emerald-100 text-xs text-emerald-800"
									>
										+{profileData.crops.length - 5} more
									</Badge>
								)}
							</div>

							{/* Micro KPI Cards */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
								<div className="rounded-xl border border-emerald-100 bg-white/90 p-3 text-center shadow-sm">
									<p className="text-xs font-medium text-slate-500">Land Holding</p>
									<p className="mt-1 text-base font-bold text-slate-900">
										{profileData.landHolding
											? `${profileData.landHolding} ${profileData.landUnit || "Acre"}`
											: "Not Set"}
									</p>
								</div>

								<div className="rounded-xl border border-emerald-100 bg-white/90 p-3 text-center shadow-sm">
									<p className="text-xs font-medium text-slate-500">Practice</p>
									<p className="mt-1 text-base font-bold capitalize text-slate-900">
										{profileData.farmingType || "Traditional"}
									</p>
								</div>

								<div className="rounded-xl border border-emerald-100 bg-white/90 p-3 text-center shadow-sm">
									<p className="text-xs font-medium text-slate-500">PM-KISAN</p>
									<p className="mt-1 text-base font-bold text-slate-900">
										{profileData.pmKisanRegistered ? "Registered" : "Pending"}
									</p>
								</div>

								<div className="rounded-xl border border-emerald-100 bg-white/90 p-3 text-center shadow-sm">
									<p className="text-xs font-medium text-slate-500">Profile Score</p>
									<p className="mt-1 text-base font-bold text-slate-900">
										{eligibilityCompletion}%
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* -------------------------------------------------
				    PROFILE COMPLETENESS PROGRESS CARD
				------------------------------------------------- */}
				<Card className="border-emerald-100 bg-white shadow-sm">
					<CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
						<div className="flex items-center gap-3.5">
							<div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
								<ShieldCheck className="h-6 w-6" />
							</div>
							<div>
								<div className="flex items-center gap-2">
									<h3 className="text-base font-bold text-slate-900">
										FarmAI Agriculture Profile Completion
									</h3>
									<Badge
										className={
											eligibilityCompletion === 100
												? "bg-emerald-600 text-white"
												: "bg-amber-100 text-amber-800 border-amber-300"
										}
									>
										{eligibilityCompletion}% Complete
									</Badge>
								</div>
								<p className="mt-1 text-sm leading-relaxed text-slate-600">
									A complete profile enables automated eligibility checking for PM-Kisan, Fasal Bima, and state drip irrigation subsidies.
								</p>
							</div>
						</div>

						<div className="w-full md:w-64 space-y-1.5">
							<div className="flex justify-between text-xs text-muted-foreground">
								<span>Status</span>
								<span className="font-semibold text-foreground">
									{eligibilityFields.length - missingEligibilityFields.length} of {eligibilityFields.length} fields filled
								</span>
							</div>
							<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
								<div
									className="h-full rounded-full bg-emerald-600 transition-all duration-500"
									style={{ width: `${eligibilityCompletion}%` }}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* -------------------------------------------------
				    TABBED SECTIONS: REAL-WORLD AGRI APP STRUCTURE
				------------------------------------------------- */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
					
					{/* Responsive Tabs Navigation */}
					<TabsList className="flex h-auto flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
						<TabsTrigger
							value="overview"
							className="rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm sm:text-sm"
						>
							<UserRound className="h-4 w-4 mr-1.5" />
							Personal Details
						</TabsTrigger>

						<TabsTrigger
							value="land"
							className="rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm sm:text-sm"
						>
							<Tractor className="h-4 w-4 mr-1.5" />
							Farm & Land Records
						</TabsTrigger>

						<TabsTrigger
							value="cultivation"
							className="rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm sm:text-sm"
						>
							<Wheat className="h-4 w-4 mr-1.5" />
							Crops & Irrigation
						</TabsTrigger>

						<TabsTrigger
							value="schemes"
							className="rounded-lg px-3 py-2 text-xs text-slate-600 transition-colors data-[state=active]:bg-white data-[state=active]:font-semibold data-[state=active]:text-emerald-800 data-[state=active]:shadow-sm sm:text-sm"
						>
							<Landmark className="h-4 w-4 mr-1.5" />
							Government Schemes & Banking
						</TabsTrigger>
					</TabsList>

					{/* -------------------------------------------------
					    TAB 1: PERSONAL & CONTACT INFORMATION
					------------------------------------------------- */}
					<TabsContent value="overview" className="space-y-6">
						<Card className="border-slate-200 bg-white shadow-sm">
							<CardHeader>
								<CardTitle className="text-xl flex items-center gap-2">
									<UserRound className="h-5 w-5 text-emerald-600" />
									Farmer Identification & Contact Records
								</CardTitle>
								<CardDescription>
									Personal demographics required for official agricultural certificates and communication.
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									{/* Full Name */}
									<div className="space-y-2">
										<Label htmlFor="fullName" className="font-semibold">
											Full Name (संपूर्ण नाव) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="fullName"
											value={profileData.fullName || ""}
											onChange={(e) => handleInputChange("fullName", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Ramesh Shankar Patil"
											required
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Mobile Phone */}
									<div className="space-y-2">
										<Label htmlFor="phone" className="font-semibold flex items-center justify-between">
											<span>Mobile Number (मोबाईल नंबर) <span className="text-red-500">*</span></span>
											{isEditing && (
												<span className="text-xs text-amber-600 flex items-center gap-1">
													<Lock className="h-3 w-3" /> OTP Protected
												</span>
											)}
										</Label>
										<Input
											id="phone"
											value={profileData.phone || ""}
											onChange={(e) => handleInputChange("phone", e.target.value)}
											disabled={!isEditing}
											type="tel"
											placeholder="10-digit mobile number"
											maxLength={10}
											className="border-slate-200 bg-white font-mono text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Email Address */}
									<div className="space-y-2">
										<Label htmlFor="email" className="font-semibold">
											Email Address (ईमेल पत्ता - पर्यायी)
										</Label>
										<Input
											id="email"
											value={profileData.email || ""}
											onChange={(e) => handleInputChange("email", e.target.value)}
											disabled={!isEditing}
											type="email"
											placeholder="farmer@example.com"
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Preferred App Language */}
									<div className="space-y-2">
										<Label htmlFor="preferredLanguage" className="font-semibold">
											Preferred Language (पसंतीची भाषा)
										</Label>
										<Select
											value={profileData.preferredLanguage || "en-US"}
											onValueChange={(val) => handleInputChange("preferredLanguage", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select language" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="en-US">English (English)</SelectItem>
												<SelectItem value="hi-IN">हिंदी (Hindi)</SelectItem>
												<SelectItem value="mr-IN">मराठी (Marathi)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Date of Birth */}
									<div className="space-y-2">
										<Label htmlFor="dateOfBirth" className="font-semibold">
											Date of Birth (जन्मतारीख)
										</Label>
										<Input
											id="dateOfBirth"
											type="date"
											value={
												profileData.dateOfBirth
													? new Date(profileData.dateOfBirth).toISOString().split("T")[0]
													: ""
											}
											onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
											disabled={!isEditing}
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Gender */}
									<div className="space-y-2">
										<Label className="font-semibold">Gender (लिंग)</Label>
										<Select
											value={profileData.gender || ""}
											onValueChange={(val) => handleInputChange("gender", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select gender" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="male">Male (पुरुष)</SelectItem>
												<SelectItem value="female">Female (महिला शेतकरी)</SelectItem>
												<SelectItem value="other">Other (इतर)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Social Category */}
									<div className="space-y-2">
										<Label className="font-semibold">
											Social Category (सामाजिक प्रवर्ग - For Govt Subsidies)
										</Label>
										<Select
											value={profileData.socialCategory || ""}
											onValueChange={(val) => handleInputChange("socialCategory", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select social category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="general">General (खुला प्रवर्ग)</SelectItem>
												<SelectItem value="obc">OBC (इतर मागासवर्गीय)</SelectItem>
												<SelectItem value="sc">SC (अनुसूचित जाती)</SelectItem>
												<SelectItem value="st">ST (अनुसूचित जमाती)</SelectItem>
												<SelectItem value="other">Other</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Farming Experience */}
									<div className="space-y-2">
										<Label htmlFor="experienceYears" className="font-semibold">
											Farming Experience (शेती अनुभव - वर्षे)
										</Label>
										<Input
											id="experienceYears"
											type="number"
											min="0"
											max="70"
											value={profileData.experienceYears ?? ""}
											onChange={(e) =>
												handleInputChange(
													"experienceYears",
													e.target.value === "" ? null : Number(e.target.value)
												)
											}
											disabled={!isEditing}
											placeholder="e.g. 15 Years"
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* -------------------------------------------------
					    TAB 2: FARM & LAND RECORDS
					------------------------------------------------- */}
					<TabsContent value="land" className="space-y-6">
						<Card className="border-slate-200 bg-white shadow-sm">
							<CardHeader>
								<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
									<div>
										<CardTitle className="text-xl flex items-center gap-2">
											<Tractor className="h-5 w-5 text-emerald-600" />
											Farm Holding & Land Particulars (जमीन तपशील)
										</CardTitle>
										<CardDescription>
											7/12 land records, farm geographic address, and soil profile details.
										</CardDescription>
									</div>

									{isEditing && (
										<Button
											type="button"
											variant="outline"
											onClick={handleDetectLocation}
											disabled={detectingLocation}
											className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs sm:text-sm self-start flex items-center gap-1.5"
										>
											{detectingLocation ? (
												<>
													<RefreshCw className="h-3.5 w-3.5 animate-spin" />
													Detecting GPS...
												</>
											) : (
												<>
													<Navigation className="h-3.5 w-3.5" />
													📍 Auto-Detect Farm GPS
												</>
											)}
										</Button>
									)}
								</div>
							</CardHeader>

							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
									{/* Farm Name */}
									<div className="space-y-2">
										<Label htmlFor="farmName" className="font-semibold">
											Farm / Holding Name (शेताचे नाव)
										</Label>
										<Input
											id="farmName"
											value={profileData.farmName || ""}
											onChange={(e) => handleInputChange("farmName", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Shinde Agro Farms"
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* State */}
									<div className="space-y-2">
										<Label htmlFor="state" className="font-semibold">
											State (राज्य) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="state"
											value={profileData.state || ""}
											onChange={(e) => handleInputChange("state", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Maharashtra"
											required
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* District */}
									<div className="space-y-2">
										<Label htmlFor="district" className="font-semibold">
											District (जिल्हा) <span className="text-red-500">*</span>
										</Label>
										<Input
											id="district"
											value={profileData.district || ""}
											onChange={(e) => handleInputChange("district", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Jalna, Latur, Pune"
											required
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Taluka / Tehsil */}
									<div className="space-y-2">
										<Label htmlFor="taluka" className="font-semibold">
											Taluka / Tehsil (तालुका)
										</Label>
										<Input
											id="taluka"
											value={profileData.taluka || ""}
											onChange={(e) => handleInputChange("taluka", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Ambad, Ausa, Baramati"
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Village / Town */}
									<div className="space-y-2">
										<Label htmlFor="village" className="font-semibold">
											Village (गाव / ग्राम)
										</Label>
										<Input
											id="village"
											value={profileData.village || ""}
											onChange={(e) => handleInputChange("village", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. Rohilgad, Killari"
											className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* PIN Code */}
									<div className="space-y-2">
										<Label htmlFor="pincode" className="font-semibold">
											PIN Code (पिन कोड)
										</Label>
										<Input
											id="pincode"
											value={profileData.pincode || ""}
											onChange={(e) => handleInputChange("pincode", e.target.value)}
											disabled={!isEditing}
											placeholder="e.g. 431205"
											maxLength={6}
											className="border-slate-200 bg-white font-mono text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Land Holding Size */}
									<div className="space-y-2">
										<Label htmlFor="landHolding" className="font-semibold">
											Total Land Area (एकूण जमीन क्षेत्र)
										</Label>
										<Input
											id="landHolding"
											type="number"
											min="0"
											step="0.1"
											value={profileData.landHolding ?? ""}
											onChange={(e) =>
												handleInputChange(
													"landHolding",
													e.target.value === "" ? null : Number(e.target.value)
												)
											}
											disabled={!isEditing}
											placeholder="e.g. 4.5"
											className="border-slate-200 bg-white font-mono text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* Land Unit */}
									<div className="space-y-2">
										<Label className="font-semibold">Land Unit (क्षेत्र एकक)</Label>
										<Select
											value={profileData.landUnit || "acre"}
											onValueChange={(val) => handleInputChange("landUnit", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="acre">Acre (एकर)</SelectItem>
												<SelectItem value="hectare">Hectare (हेक्टर)</SelectItem>
												<SelectItem value="guntha">Guntha (गुंठा)</SelectItem>
												<SelectItem value="bigha">Bigha (बीघा)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Land Ownership */}
									<div className="space-y-2">
										<Label className="font-semibold">Land Ownership (मालकी हक्क)</Label>
										<Select
											value={profileData.landOwnership || ""}
											onValueChange={(val) => handleInputChange("landOwnership", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select ownership" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="owned">Self Owned (स्वतःची मालकी / वडिलोपार्जित)</SelectItem>
												<SelectItem value="leased">Leased (भाडेतत्त्वावर / खंड)</SelectItem>
												<SelectItem value="shared">Sharecropper (बटाईदार)</SelectItem>
												<SelectItem value="government">Government Allotted (शासकीय पट्टा)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Soil Type */}
									<div className="space-y-2">
										<Label className="font-semibold">Soil Type (मातीचा प्रकार)</Label>
										<Select
											value={profileData.soilType || ""}
											onValueChange={(val) => handleInputChange("soilType", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select soil type" />
											</SelectTrigger>
											<SelectContent>
												{SOIL_TYPES.map((st) => (
													<SelectItem key={st.value} value={st.value}>
														{st.label}
													</SelectItem>
												))}
											</SelectContent></Select>
									</div>

									{/* Soil Health Card */}
									<div className="space-y-2">
										<Label className="font-semibold">
											Soil Health Card (मृदा आरोग्य पत्रिका)
										</Label>
										<Select
											value={
												profileData.soilHealthCard === true
													? "yes"
													: profileData.soilHealthCard === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"soilHealthCard",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Soil tested & card issued?" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Tested & Card Issued (होय, पत्रिका उपलब्ध)</SelectItem>
												<SelectItem value="no">No - Not Tested (नाही)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* GPS Coordinates preview */}
									<div className="space-y-2">
										<Label className="font-semibold">GPS Farm Coordinates</Label>
										<div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-3 font-mono text-xs text-slate-700">
											<span>
												Lat: {profileData.latitude || "0.000000"}, Lon: {profileData.longitude || "0.000000"}
											</span>
											<MapPin className="h-4 w-4 text-emerald-600" />
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* -------------------------------------------------
					    TAB 3: CROPS, IRRIGATION & LIVESTOCK
					------------------------------------------------- */}
					<TabsContent value="cultivation" className="space-y-6">
						<Card className="border-slate-200 bg-white shadow-sm">
							<CardHeader>
								<CardTitle className="text-xl flex items-center gap-2">
									<Wheat className="h-5 w-5 text-emerald-600" />
									Cultivation, Irrigation & Farm Machinery
								</CardTitle>
								<CardDescription>
									Registered crops, water management, agricultural implements, and dairy livestock.
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* Farming Style / Practice */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
									<div className="space-y-2">
										<Label className="font-semibold">
											Farming Practice (शेती पद्धती)
										</Label>
										<Select
											value={profileData.farmingType || "traditional"}
											onValueChange={(val) => handleInputChange("farmingType", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select farming type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="traditional">Traditional / Conventional (पारंपारिक रासायनिक शेती)</SelectItem>
												<SelectItem value="organic">Organic Certified (सेंद्रिय शेती)</SelectItem>
												<SelectItem value="natural">Natural Farming - ZBNF (नैसर्गिक शेती - झिरो बजेट)</SelectItem>
												<SelectItem value="modern">Modern Precision / Polyhouse (आधुनिक हरितगृह)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Irrigation System */}
									<div className="space-y-2">
										<Label className="font-semibold">
											Primary Irrigation System (मुख्य सिंचन पद्धत)
										</Label>
										<Select
											value={profileData.irrigationType || ""}
											onValueChange={(val) => handleInputChange("irrigationType", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="border-slate-200 bg-white text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select primary irrigation" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="drip">Drip Irrigation (ठिबक सिंचन - Water Saving)</SelectItem>
												<SelectItem value="sprinkler">Sprinkler (तुषार सिंचन)</SelectItem>
												<SelectItem value="canal">Canal / Flood (पाटपाणी / पूर पद्धत)</SelectItem>
												<SelectItem value="well">Well / Borewell Flood</SelectItem>
												<SelectItem value="rainfed">Rainfed / Dryland (केवळ पावसावर आधारित - जिरायती)</SelectItem>
												<SelectItem value="mixed">Mixed System (मिश्र पद्धत)</SelectItem>
											</SelectContent></Select>
									</div>
								</div>

								<Separator />

								{/* Water & Irrigation Sources Multi-Select */}
								<div className="space-y-2.5">
									<Label className="font-semibold flex items-center gap-1.5">
										<Droplets className="h-4 w-4 text-blue-600" />
										Water & Irrigation Sources (पाण्याचे स्रोत)
									</Label>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
										{IRRIGATION_SOURCES.map((src) => {
											const selected = (profileData.irrigationSource || []).includes(src.id)
											return (
												<button
													key={src.id}
													type="button"
													disabled={!isEditing}
													onClick={() => toggleArrayItem("irrigationSource", src.id)}
													className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
														selected
															? "bg-blue-50 border-blue-500 text-blue-900 shadow-sm"
															: "bg-card border-gray-200 text-muted-foreground hover:border-gray-300"
													} ${!isEditing ? "cursor-default" : "cursor-pointer"}`}
												>
													<span>{src.label}</span>
													{selected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
												</button>
											)
										})}
									</div>
								</div>

								<Separator />

								{/* Registered Crops with Visual Selector */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label className="font-semibold text-base">
											Registered Crops (नोंदवलेली मुख्य पिके)
										</Label>
										<Badge variant="outline" className="text-emerald-700 bg-emerald-50">
											{profileData.crops?.length || 0} Crops Added
										</Badge>
									</div>

									{/* Active Crop Pills */}
									<div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-xl border">
										{profileData.crops && profileData.crops.length > 0 ? (
											profileData.crops.map((crop) => (
												<Badge
													key={crop}
													variant="secondary"
													className="bg-emerald-100 text-emerald-800 border-emerald-300 px-3 py-1 text-sm flex items-center gap-1.5"
												>
													🌾 {crop}
													{isEditing && (
														<button
															type="button"
															onClick={() => toggleCrop(crop)}
															className="hover:text-red-600 ml-1"
														>
															×
														</button>
													)}
												</Badge>
											))
										) : (
											<p className="text-sm text-muted-foreground py-1">
												No crops selected yet. Choose from below or type custom crop.
											</p>
										)}
									</div>

									{/* Custom Crop Input when Editing */}
									{isEditing && (
										<div className="flex gap-2 max-w-md pt-1">
											<Input
												value={customCropInput}
												onChange={(e) => setCustomCropInput(e.target.value)}
												placeholder="Add other crop (e.g. Soybean, Onion, Cotton)"
												className="border-slate-200 bg-white text-sm text-slate-800 focus-visible:ring-emerald-500"
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault()
														handleAddCustomCrop()
													}
												}}
											/>
											<Button
												type="button"
												variant="secondary"
												onClick={handleAddCustomCrop}
												className="shrink-0 bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
											>
												+ Add
											</Button>
										</div>
									)}

									{/* Visual Crop Grid */}
									{isEditing && (
										<div className="pt-2">
											<p className="text-xs text-muted-foreground mb-2">
												Quick Select Common Staples:
											</p>
											<CropSelector
												selected={profileData.crops || []}
												toggleCrop={toggleCrop}
												lang={profileData.preferredLanguage || "en-US"}
											/>
										</div>
									)}
								</div>

								<Separator />

								{/* Livestock & Dairy Farming */}
								<div className="space-y-2.5">
									<Label className="font-semibold flex items-center gap-1.5">
										<Sprout className="h-4 w-4 text-emerald-600" />
										Livestock & Allied Activities (पशुपालन व जोडधंदे)
									</Label>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
										{LIVESTOCK_OPTIONS.map((ls) => {
											const selected = (profileData.livestock || []).includes(ls.id)
											return (
												<button
													key={ls.id}
													type="button"
													disabled={!isEditing}
													onClick={() => toggleArrayItem("livestock", ls.id)}
													className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
														selected
															? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
															: "bg-card border-gray-200 text-muted-foreground hover:border-gray-300"
													} ${!isEditing ? "cursor-default" : "cursor-pointer"}`}
												>
													<span>{ls.label}</span>
													{selected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
												</button>
											)
										})}
									</div>
								</div>

								<Separator />

								{/* Farm Machinery & Equipment */}
								<div className="space-y-2.5">
									<Label className="font-semibold flex items-center gap-1.5">
										<Tractor className="h-4 w-4 text-emerald-600" />
										Farm Machinery & Equipment (कृषी यंत्रे व अवजारे)
									</Label>
									<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
										{MACHINERY_OPTIONS.map((mach) => {
											const selected = (profileData.machinery || []).includes(mach.id)
											return (
												<button
													key={mach.id}
													type="button"
													disabled={!isEditing}
													onClick={() => toggleArrayItem("machinery", mach.id)}
													className={`p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all ${
														selected
															? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm"
															: "bg-card border-gray-200 text-muted-foreground hover:border-gray-300"
													} ${!isEditing ? "cursor-default" : "cursor-pointer"}`}
												>
													<span>{mach.label}</span>
													{selected && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
												</button>
											)
										})}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* -------------------------------------------------
					    TAB 4: GOVERNMENT SCHEMES & BANKING
					------------------------------------------------- */}
					<TabsContent value="schemes" className="space-y-6">
						<Card className="min-w-0 overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm">
							<CardHeader className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-6">
								<CardTitle className="flex items-center gap-2 text-lg font-bold leading-snug text-slate-900 sm:text-xl">
									<Landmark className="h-5 w-5 shrink-0 text-emerald-700" />
									Government Schemes, Subsidies & Banking Records
								</CardTitle>
								<CardDescription>
									Official farmer category, DBT account status, and scheme registrations for instant eligibility evaluation.
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-6 px-5 py-6 sm:px-6">
								<div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
									{/* Farmer Category */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											Farmer Holding Category (शेतकरी वर्ग)
										</Label>
										<Select
											value={profileData.farmerCategory || ""}
											onValueChange={(val) => handleInputChange("farmerCategory", val)}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select farmer category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="marginal">Marginal Farmer (&lt; 1 Hectare / 2.5 Acres)</SelectItem>
												<SelectItem value="small">Small Farmer (1 - 2 Hectares / 2.5 - 5 Acres)</SelectItem>
												<SelectItem value="medium">Semi-Medium / Medium (2 - 10 Hectares)</SelectItem>
												<SelectItem value="large">Large Farmer (&gt; 10 Hectares)</SelectItem>
												<SelectItem value="landless">Landless Agricultural Laborer (भूमिहीन)</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Annual Family Income */}
									<div className="min-w-0 space-y-2">
										<Label htmlFor="annualFamilyIncome" className="block text-sm font-semibold leading-5 text-slate-700">
											Annual Family Income (वार्षिक उत्पन्न ₹)
										</Label>
										<Input
											id="annualFamilyIncome"
											type="number"
											min="0"
											step="5000"
											value={profileData.annualFamilyIncome ?? ""}
											onChange={(e) =>
												handleInputChange(
													"annualFamilyIncome",
													e.target.value === "" ? null : Number(e.target.value)
												)
											}
											disabled={!isEditing}
											placeholder="₹ e.g. 150000"
											className="h-11 w-full min-w-0 border-slate-200 bg-white font-mono text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200"
										/>
									</div>

									{/* PM-KISAN Registered */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											PM-KISAN Samman Nidhi (पीएम किसान लाभार्थी?)
										</Label>
										<Select
											value={
												profileData.pmKisanRegistered === true
													? "yes"
													: profileData.pmKisanRegistered === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"pmKisanRegistered",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Select status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Registered & Active (पात्र शेतकरी)</SelectItem>
												<SelectItem value="no">No - Not Registered</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Aadhaar Linked for DBT */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											Aadhaar Linked to Bank (DBT खाते सक्रिय?)
										</Label>
										<Select
											value={
												profileData.aadhaarLinked === true
													? "yes"
													: profileData.aadhaarLinked === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"aadhaarLinked",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Aadhaar linked to bank?" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Linked & DBT Active (आधार बँक खात्याशी जोडलेले)</SelectItem>
												<SelectItem value="no">No - Not Linked</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Bank Account Available */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											Dedicated Bank Account (बँक खाते उपलब्ध?)
										</Label>
										<Select
											value={
												profileData.bankAccountAvailable === true
													? "yes"
													: profileData.bankAccountAvailable === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"bankAccountAvailable",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Bank account available?" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Active Bank Account (होय)</SelectItem>
												<SelectItem value="no">No</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Kisan Credit Card (KCC) */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											Kisan Credit Card (KCC धारक?)
										</Label>
										<Select
											value={
												profileData.kccHolder === true
													? "yes"
													: profileData.kccHolder === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"kccHolder",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="KCC Cardholder?" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Have Kisan Credit Card (होय, KCC कार्ड आहे)</SelectItem>
												<SelectItem value="no">No</SelectItem>
											</SelectContent></Select>
									</div>

									{/* Crop Insurance (PMFBY) */}
									<div className="min-w-0 space-y-2">
										<Label className="block text-sm font-semibold leading-5 text-slate-700">
											Crop Insurance - PMFBY (पंतप्रधान पीक विमा?)
										</Label>
										<Select
											value={
												profileData.cropInsuranceActive === true
													? "yes"
													: profileData.cropInsuranceActive === false
														? "no"
														: ""
											}
											onValueChange={(val) =>
												handleInputChange(
													"cropInsuranceActive",
													val === "yes" ? true : val === "no" ? false : null
												)
											}
											disabled={!isEditing}
										>
											<SelectTrigger className="h-auto min-h-11 w-full min-w-0 border-slate-200 bg-white py-2.5 text-left text-sm text-slate-800 shadow-none focus-visible:ring-emerald-500 disabled:cursor-default disabled:opacity-100 disabled:bg-slate-50 disabled:text-slate-700 disabled:border-slate-200">
												<SelectValue placeholder="Crop insurance status" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="yes">Yes - Crops Insured under PMFBY (पीक विमा उतरवला आहे)</SelectItem>
												<SelectItem value="no">No - Not Insured</SelectItem>
											</SelectContent></Select>
									</div>
								</div>

								{/* Scheme Eligibility Banner */}
								<div className="mt-2 flex gap-3.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 sm:p-5">
									<FileCheck2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
									<div className="min-w-0 space-y-1 text-sm leading-6 text-emerald-950">
										<p className="font-bold">
											Automated Scheme Eligibility Engine Active
										</p>
										<p className="text-sm leading-6 text-emerald-800">
											These details are matched in real-time with over 35 state and central agricultural schemes (including MahaDBT, PMKSY Drip Subsidies, Soil Health Mission, and Kisan Samman Nidhi). Ensure accurate landholdings to prevent subsidy application rejection.
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* -------------------------------------------------
				    FOOTER REGISTRATION METADATA
				------------------------------------------------- */}
				{profileData.createdAt && (
					<div className="text-center text-xs text-muted-foreground pt-4">
						Verified FarmAI Digital Kisan Profile • Registered since{" "}
						{new Date(profileData.createdAt).toLocaleDateString("en-IN", {
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</div>
				)}
			</div>
		</DashboardLayout>
	)
}