"use client"

import { useState, useEffect, ChangeEvent } from "react"
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
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard-layout"
import CropSelector from "@/components/CropSelector"
import { useLanguage } from "@/lib/i18n/LanguageContext"

// =========================================================
// USER PROFILE INTERFACE
// =========================================================

interface UserProfile {
	_id?: string

	// Basic information
	fullName: string
	email?: string
	phone?: string

	// Farm information
	farmName?: string
	farmLocation?: string
	state?: string
	district?: string
	pincode?: string
	village?: string
	latitude?: number
	longitude?: number

	// Farming
	crops?: string[]
	farmingType?: string

	// Language
	preferredLanguage?: string

	// Profile photo
	profilePhoto?: string

	// =====================================================
	// GOVERNMENT SCHEME ELIGIBILITY INFORMATION
	// =====================================================

	dateOfBirth?: string | null
	gender?: string
	socialCategory?: string
	farmerCategory?: string
	annualFamilyIncome?: number | null
	landHolding?: number | null
	landUnit?: string
	landOwnership?: string
	irrigationType?: string
	aadhaarLinked?: boolean | null
	bankAccountAvailable?: boolean | null
	pmKisanRegistered?: boolean | null

	// Account
	createdAt?: string

	// Allow existing/unknown fields
	[key: string]: any
}

// =========================================================
// ELIGIBILITY FIELDS
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

	// Boolean false is a valid answer
	if (typeof value === "boolean") {
		return true
	}

	if (typeof value === "number") {
		return !isNaN(value)
	}

	return true
}

// =========================================================
// PROFILE COMPLETION
// =========================================================

const calculateEligibilityCompletion = (profile: UserProfile) => {
	const completed = eligibilityFields.filter((field) =>
		isEligibilityFieldComplete(profile, field)
	).length

	return Math.round((completed / eligibilityFields.length) * 100)
}

// =========================================================
// FIELD LABELS
// =========================================================

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

// =========================================================
// COMPONENT
// =========================================================

export default function ProfilePage() {
	const { t } = useLanguage()
	const router = useRouter()

	// =====================================================
	// STATE
	// =====================================================

	const [isEditing, setIsEditing] = useState(false)

	const [profileData, setProfileData] =
		useState<UserProfile | null>(null)

	const [originalData, setOriginalData] =
		useState<UserProfile | null>(null)

	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [selectedFile, setSelectedFile] =
		useState<File | null>(null)

	const [showSensitiveWarning, setShowSensitiveWarning] =
		useState(false)

	// =====================================================
	// FETCH USER
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

				/*
				 * The updated backend profile route returns
				 * the user object directly.
				 *
				 * This small compatibility check also supports
				 * the older { user: ... } response format.
				 */
				const userData: UserProfile =
					data?.user && data?.user?._id
						? data.user
						: data

				setProfileData(userData)

				setOriginalData(
					JSON.parse(JSON.stringify(userData))
				)

				localStorage.setItem(
					"user",
					JSON.stringify(userData)
				)
			} catch (err: any) {
				console.error("Error fetching user:", err)

				setError(
					err.message ||
						"Could not load profile data."
				)
			} finally {
				setLoading(false)
			}
		}

		fetchUser()
	}, [router])

	// =====================================================
	// HANDLE NORMAL INPUT CHANGE
	// =====================================================

	const handleInputChange = (
		field: keyof UserProfile,
		value: any
	) => {
		setProfileData((prev) =>
			prev
				? {
						...prev,
						[field]: value,
					}
				: null
		)

		// Sensitive fields
		if (
			(field === "phone" || field === "email") &&
			value !== originalData?.[field]
		) {
			setShowSensitiveWarning(true)
		}
	}

	// =====================================================
	// PROFILE PHOTO
	// =====================================================

	const handleFileChange = (
		e: ChangeEvent<HTMLInputElement>
	) => {
		if (
			e.target.files &&
			e.target.files.length > 0
		) {
			const file = e.target.files[0]

			setSelectedFile(file)

			const reader = new FileReader()

			reader.onload = () => {
				setProfileData((prev) =>
					prev
						? {
								...prev,
								profilePhoto:
									reader.result as string,
							}
						: null
				)
			}

			reader.readAsDataURL(file)
		}
	}

	// =====================================================
	// CROP SELECTOR
	// =====================================================

	const toggleCrop = (crop: string) => {
		if (!profileData) return

		const currentCrops =
			profileData.crops || []

		const newCrops =
			currentCrops.includes(crop)
				? currentCrops.filter(
						(c) => c !== crop
					)
				: [...currentCrops, crop]

		handleInputChange(
			"crops",
			newCrops
		)
	}

	// =====================================================
	// CANCEL EDIT
	// =====================================================

	const handleCancel = () => {
		if (originalData) {
			setProfileData(
				JSON.parse(
					JSON.stringify(originalData)
				)
			)
		}

		setIsEditing(false)
		setSelectedFile(null)
		setShowSensitiveWarning(false)
		setError(null)
		setSuccess(null)
	}

	// =====================================================
	// SAVE PROFILE
	// =====================================================

	const handleSave = async () => {
		if (!profileData) return

		// ---------------------------------------------------
		// Sensitive information check
		// ---------------------------------------------------

		const phoneChanged =
			profileData.phone !==
			originalData?.phone

		const emailChanged =
			profileData.email !==
			originalData?.email

		if (phoneChanged || emailChanged) {
			const confirmMessage =
				phoneChanged && emailChanged
					? "You're changing both phone number and email. This will require re-verification. Continue?"
					: phoneChanged
						? "Changing phone number will require OTP verification. Continue?"
						: "Changing email will require verification. Continue?"

			if (!window.confirm(confirmMessage)) {
				return
			}
		}

		setSaving(true)
		setError(null)
		setSuccess(null)

		try {
			const token =
				localStorage.getItem("token")

			if (!token) {
				router.push("/login")
				return
			}

			// =================================================
			// UPDATE PAYLOAD
			// =================================================

			const updatePayload = {
				// Existing fields
				fullName: profileData.fullName,
				email: profileData.email || "",
				phone: profileData.phone || "",
				farmName: profileData.farmName || "",
				farmLocation:
					profileData.farmLocation || "",
				state: profileData.state || "",
				district:
					profileData.district || "",
				pincode:
					profileData.pincode || "",
				village:
					profileData.village || "",
				crops:
					profileData.crops || [],
				farmingType:
					profileData.farmingType ||
					"traditional",
				preferredLanguage:
					profileData.preferredLanguage ||
					"en-US",

				// =================================================
				// GOVERNMENT SCHEME ELIGIBILITY FIELDS
				// =================================================

				dateOfBirth:
					profileData.dateOfBirth ||
					null,

				gender:
					profileData.gender || "",

				socialCategory:
					profileData.socialCategory ||
					"",

				farmerCategory:
					profileData.farmerCategory ||
					"",

					annualFamilyIncome:
					profileData.annualFamilyIncome ??
					null,
				
				landHolding:
					profileData.landHolding ??
					null,

				landUnit:
					profileData.landUnit || "",

				landOwnership:
					profileData.landOwnership || "",

				irrigationType:
					profileData.irrigationType ||
					"",

				aadhaarLinked:
					profileData.aadhaarLinked ??
					null,

				bankAccountAvailable:
					profileData.bankAccountAvailable ??
					null,

				pmKisanRegistered:
					profileData.pmKisanRegistered ??
					null,
			}

			// =================================================
			// SEND TO BACKEND
			// =================================================

			const res = await fetch(
				"/api/user",
				{
					method: "PUT",

					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type":
							"application/json",
					},

					body: JSON.stringify(
						updatePayload
					),
				}
			)

			if (res.status === 401) {
				localStorage.removeItem(
					"token"
				)

				localStorage.removeItem(
					"user"
				)

				router.push("/login")
				return
			}

			if (!res.ok) {
				const errorText =
					await res.text()

				throw new Error(
					`Failed to save profile: ${res.status} ${errorText}`
				)
			}

			const responseData =
				await res.json()

			/*
			 * Compatibility with both:
			 *
			 * 1. New backend:
			 *    returns user directly
			 *
			 * 2. Old backend:
			 *    returns { user: ... }
			 */
			const updated: UserProfile =
				responseData?.user &&
				responseData?.user?._id
					? responseData.user
					: responseData

			setProfileData(updated)

			setOriginalData(
				JSON.parse(
					JSON.stringify(updated)
				)
			)

			setIsEditing(false)
			setSelectedFile(null)
			setShowSensitiveWarning(false)

			setSuccess(
				t("profileUpdatedSuccessfully")
			)

			// Keep local user data synchronized
			localStorage.setItem(
				"user",
				JSON.stringify(updated)
			)

			setTimeout(() => {
				setSuccess(null)
			}, 3000)
		} catch (err: any) {
			console.error(
				"Error saving profile:",
				err
			)

			setError(
				err.message ||
					"Failed to save profile."
			)
		} finally {
			setSaving(false)
		}
	}

	// =====================================================
	// PROFILE COMPLETION
	// =====================================================

	const eligibilityCompletion =
		profileData
			? calculateEligibilityCompletion(
					profileData
				)
			: 0

	const missingEligibilityFields =
		profileData
			? eligibilityFields.filter(
					(field) =>
						!isEligibilityFieldComplete(
							profileData,
							field
						)
				)
			: []

	const eligibilityProfileComplete =
		eligibilityCompletion === 100

	// =====================================================
	// LOADING
	// =====================================================

	if (loading) {
		return (
			<DashboardLayout>
				<div className="flex justify-center items-center h-[50vh]">
					<p className="text-xl font-medium">
						{t(
							"loadingProfileData"
						)}
					</p>
				</div>
			</DashboardLayout>
		)
	}

	// =====================================================
	// ERROR
	// =====================================================

	if (error && !profileData) {
		return (
			<DashboardLayout>
				<Card className="border-red-500/50 bg-red-500/10">
					<CardHeader>
						<CardTitle className="text-red-600">
							{t(
								"profileLoadError"
							)}
						</CardTitle>

						<CardDescription className="text-red-700">
							{error ||
								t(
									"noProfileDataFound"
								)}
						</CardDescription>
					</CardHeader>
				</Card>
			</DashboardLayout>
		)
	}

	if (!profileData) return null

	// =====================================================
	// RENDER
	// =====================================================

	return (
		<DashboardLayout>
			<div className="space-y-6">

				{/* =================================================
				    HEADER
				================================================= */}

				<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							{t("myProfile")}
						</h1>

						<p className="text-muted-foreground mt-2">
							{t(
								"managePersonalInfo"
							)}
						</p>
					</div>

					<div className="flex gap-2">
						{isEditing && (
							<Button
								variant="outline"
								onClick={
									handleCancel
								}
								disabled={saving}
							>
								{t("cancel")}
							</Button>
						)}

						<Button
							onClick={() =>
								isEditing
									? handleSave()
									: setIsEditing(
											true
										)
							}
							className="bg-primary text-primary-foreground hover:bg-primary/90"
							disabled={
								saving ||
								(isEditing &&
									!profileData.fullName)
							}
						>
							{saving ? (
								<>
									{t(
										"saving"
									)}
								</>
							) : isEditing ? (
								<>
									<Save className="h-4 w-4 mr-2" />
									{t(
										"saveChanges"
									)}
								</>
							) : (
								<>
									<Edit className="h-4 w-4 mr-2" />
									{t(
										"editProfile"
									)}
								</>
							)}
						</Button>
					</div>
				</div>

				{/* =================================================
				    SUCCESS MESSAGE
				================================================= */}

				{success && (
					<Alert className="border-green-500 bg-green-50">
						<CheckCircle2 className="h-4 w-4 text-green-600" />

						<AlertDescription className="text-green-700">
							{success}
						</AlertDescription>
					</Alert>
				)}

				{/* =================================================
				    ERROR MESSAGE
				================================================= */}

				{error && (
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />

						<AlertDescription>
							{error}
						</AlertDescription>
					</Alert>
				)}

				{/* =================================================
				    SENSITIVE WARNING
				================================================= */}

				{showSensitiveWarning &&
					isEditing && (
						<Alert className="border-orange-500 bg-orange-50">
							<Lock className="h-4 w-4 text-orange-600" />

							<AlertDescription className="text-orange-700">
								⚠️ You're changing
								sensitive information
								(phone/email). This
								may require additional
								verification.
							</AlertDescription>
						</Alert>
					)}

				{/* =================================================
				    PROFILE CARD
				================================================= */}

				<Card className="border-border">
					<CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">

						<div className="relative">
							<Avatar className="h-28 w-28 border-4 border-primary/10">

								{profileData.profilePhoto ? (
									<AvatarImage
										src={
											profileData.profilePhoto
										}
										alt={`${profileData.fullName}'s profile`}
									/>
								) : (
									<AvatarFallback className="bg-primary text-primary-foreground text-3xl">
										{profileData.fullName
											.split(" ")
											.map(
												(
													n: string
												) =>
													n[0]
											)
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								)}
							</Avatar>

							{isEditing && (
								<label className="absolute bottom-0 right-0 cursor-pointer p-2 bg-primary rounded-full border-2 border-white hover:bg-primary/90 transition-colors shadow-lg">
									<Camera className="h-4 w-4 text-white" />

									<input
										type="file"
										accept="image/*"
										className="hidden"
										onChange={
											handleFileChange
										}
									/>
								</label>
							)}
						</div>

						<div className="flex-1 text-center md:text-left">

							<h2 className="text-3xl font-bold">
								{profileData.fullName}
							</h2>

							<p className="text-muted-foreground text-lg mt-1">
								{profileData.farmName ||
									"Farmer"}
							</p>

							<div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start items-center">
								<MapPin className="h-4 w-4 text-muted-foreground" />

								<span className="text-sm text-muted-foreground">
									{[
										profileData.village,
										profileData.district,
										profileData.state,
									]
										.filter(
											Boolean
										)
										.join(
											", "
										) ||
										t(
											"locationNotSet"
										)}
								</span>
							</div>

							<div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">

								<Badge
									variant="secondary"
									className="bg-green-100 text-green-700"
								>
									{t(
										"verifiedFarmer"
									)}
								</Badge>

								<Badge variant="outline">
									{profileData.farmingType ||
										t(
											"traditionalFarming"
										)}{" "}
									{t(
										"farming"
									)}
								</Badge>

								{profileData.crops &&
									profileData
										.crops
										.length >
										0 && (
										<Badge variant="outline">
											{
												profileData
													.crops
													.length
											}{" "}
											{t(
												"crops"
											)}
										</Badge>
									)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* =================================================
				    GOVERNMENT SCHEME PROFILE COMPLETION
				================================================= */}

				<Card className="border-green-200 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">

					<CardHeader>

						<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

							<div className="flex gap-3">

								<div className="p-2.5 rounded-xl bg-green-100 text-green-700 h-fit">
									<ShieldCheck className="h-6 w-6" />
								</div>

								<div>
									<CardTitle className="text-xl">
										FarmAI Profile Completion Status
									</CardTitle>

									<CardDescription className="mt-1">
										Complete these details to get accurate eligibility results.
									</CardDescription>
								</div>

							</div>

							<Badge
								variant="outline"
								className={
									eligibilityProfileComplete
										? "border-green-500 text-green-700 bg-green-50"
										: "border-orange-400 text-orange-700 bg-orange-50"
								}
							>
								{eligibilityCompletion}% Complete
							</Badge>

						</div>
					</CardHeader>

					<CardContent className="space-y-5">

						{/* Progress */}

						<div>
							<div className="flex justify-between text-sm mb-2">
								<span className="font-medium">
									Eligibility profile completion
								</span>

								<span className="text-muted-foreground">
									{
										eligibilityFields.length -
										missingEligibilityFields.length
									}{" "}
									/{" "}
									{
										eligibilityFields.length
									} fields
								</span>
							</div>

							<div className="h-2.5 w-full rounded-full bg-green-100 overflow-hidden">
								<div
									className="h-full bg-green-600 rounded-full transition-all duration-500"
									style={{
										width: `${eligibilityCompletion}%`,
									}}
								/>
							</div>
						</div>

						{/* Explanation */}

						{eligibilityProfileComplete ? (
							<Alert className="border-green-300 bg-green-50">
								<CheckCircle2 className="h-4 w-4 text-green-600" />

								<AlertDescription className="text-green-800">
									Your eligibility profile is complete. FarmAI can now use your profile information to check scheme eligibility.
								</AlertDescription>
							</Alert>
						) : (
							<Alert className="border-orange-300 bg-orange-50">
								<CircleAlert className="h-4 w-4 text-orange-600" />

								<AlertDescription className="text-orange-800">
									<strong>
										Complete your profile
									</strong>{" "}
									to enable accurate government scheme eligibility checking.
									You can still browse available schemes while your profile is incomplete.
								</AlertDescription>
							</Alert>
						)}

						{/* Missing fields */}

						{missingEligibilityFields.length >
							0 && (
								<div className="p-4 rounded-lg border bg-white/70 dark:bg-background/50">

									<p className="text-sm font-medium mb-3">
										Information still needed:
									</p>

									<div className="flex flex-wrap gap-2">
										{missingEligibilityFields.map(
											(field) => (
												<Badge
													key={
														field
													}
													variant="outline"
													className="text-orange-700 border-orange-300"
												>
													{
														eligibilityFieldLabels[
															field
														]
													}
												</Badge>
											)
										)}
									</div>

								</div>
							)}

					</CardContent>
				</Card>

				{/* =================================================
				    PERSONAL INFORMATION
				================================================= */}

				<Card className="border-border">

					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<span>
								{t(
									"personalInformation"
								)}
							</span>

							{isEditing && (
								<Lock className="h-4 w-4 text-orange-500" />
							)}
						</CardTitle>

						<CardDescription>
							{t(
								"basicContactDetails"
							)}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

							{/* Full Name */}

							<div className="space-y-2">
								<Label htmlFor="fullName">
									{t(
										"fullName"
									)}
								</Label>

								<Input
									id="fullName"
									value={
										profileData.fullName
									}
									onChange={(e) =>
										handleInputChange(
											"fullName",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									required
								/>
							</div>

							{/* Phone */}

							<div className="space-y-2">

								<Label
									htmlFor="phone"
									className="flex items-center gap-2"
								>
									{t(
										"phoneNumber"
									)}

									{isEditing && (
										<Lock className="h-3 w-3 text-orange-500" />
									)}
								</Label>

								<Input
									id="phone"
									value={
										profileData.phone ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"phone",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									type="tel"
									placeholder="10-digit mobile number"
								/>

								{isEditing && (
									<p className="text-xs text-orange-600">
										{t(
											"changingPhoneRequiresVerification"
										)}
									</p>
								)}
							</div>

							{/* Email */}

							<div className="space-y-2">

								<Label
									htmlFor="email"
									className="flex items-center gap-2"
								>
									{t(
										"emailOptional"
									)}

									{isEditing && (
										<Lock className="h-3 w-3 text-orange-500" />
									)}
								</Label>

								<Input
									id="email"
									value={
										profileData.email ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"email",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									type="email"
									placeholder="your@email.com"
								/>

								{isEditing &&
									profileData.email && (
										<p className="text-xs text-orange-600">
											{t(
												"changingEmailRequiresVerification"
											)}
										</p>
									)}
							</div>

							{/* Farm Name */}

							<div className="space-y-2">

								<Label htmlFor="farmName">
									{t(
										"farmNameOptional"
									)}
								</Label>

								<Input
									id="farmName"
									value={
										profileData.farmName ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"farmName",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									placeholder={t(
										"farmNamePlaceholder"
									)}
								/>
							</div>

						</div>
					</CardContent>
				</Card>

				<Separator />

				{/* =================================================
				    FARMER ELIGIBILITY INFORMATION
				================================================= */}

				<Card className="border-border">

					<CardHeader>

						<CardTitle className="flex items-center gap-2">
							<UserRound className="h-5 w-5 text-green-600" />

							<span>
								Farmer Eligibility Information
							</span>

							{isEditing && (
								<Lock className="h-4 w-4 text-orange-500" />
							)}
						</CardTitle>

						<CardDescription>
							These details help FarmAI determine which government schemes may apply to you.
						</CardDescription>

					</CardHeader>

					<CardContent className="space-y-6">

						{/* =================================================
						    PERSONAL ELIGIBILITY
						================================================= */}

						<div>

							<div className="flex items-center gap-2 mb-4">
								<UserRound className="h-4 w-4 text-muted-foreground" />

								<h3 className="font-semibold">
									Personal Details
								</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">

								{/* DOB */}

								<div className="space-y-2">

									<Label htmlFor="dateOfBirth">
										Date of Birth
									</Label>

									<Input
										id="dateOfBirth"
										type="date"
										value={
											profileData.dateOfBirth
												? new Date(
														profileData.dateOfBirth
													)
														.toISOString()
														.split(
															"T"
														)[0]
												: ""
										}
										onChange={(e) =>
											handleInputChange(
												"dateOfBirth",
												e.target
													.value
											)
										}
										disabled={
											!isEditing
										}
									/>

									<p className="text-xs text-muted-foreground">
										Used for age-based scheme eligibility.
									</p>

								</div>

								{/* Gender */}

								<div className="space-y-2">

									<Label>
										Gender
									</Label>

									<Select
										value={
											profileData.gender ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"gender",
												value
											)
										}
										disabled={
											!isEditing
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select gender" />
										</SelectTrigger>

										<SelectContent>
											<SelectItem value="male">
												Male
											</SelectItem>

											<SelectItem value="female">
												Female
											</SelectItem>

											<SelectItem value="other">
												Other
											</SelectItem>
										</SelectContent>
									</Select>

								</div>

								{/* Social Category */}

								<div className="space-y-2">

									<Label>
										Social Category
									</Label>

									<Select
										value={
											profileData.socialCategory ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"socialCategory",
												value
											)
										}
										disabled={
											!isEditing
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>

										<SelectContent>
											<SelectItem value="general">
												General
											</SelectItem>

											<SelectItem value="obc">
												OBC
											</SelectItem>

											<SelectItem value="sc">
												SC
											</SelectItem>

											<SelectItem value="st">
												ST
											</SelectItem>

											<SelectItem value="other">
												Other
											</SelectItem>
										</SelectContent>
									</Select>

								</div>

							</div>
						</div>

						<Separator />

						{/* =================================================
						    LAND & FARM
						================================================= */}

						<div>

							<div className="flex items-center gap-2 mb-4">
								<Tractor className="h-4 w-4 text-muted-foreground" />

								<h3 className="font-semibold">
									Land & Farming Details
								</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

								{/* Farmer Category */}

								<div className="space-y-2">

									<Label>
										Farmer Category
									</Label>

									<Select
										value={
											profileData.farmerCategory ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"farmerCategory",
												value
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select category" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="small">
												Small
											</SelectItem>

											<SelectItem value="marginal">
												Marginal
											</SelectItem>

											<SelectItem value="medium">
												Medium
											</SelectItem>

											<SelectItem value="large">
												Large
											</SelectItem>

											<SelectItem value="landless">
												Landless
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

								{/* Land Holding */}

								<div className="space-y-2">

									<Label htmlFor="landHolding">
										Land Holding
									</Label>

									<Input
										id="landHolding"
										type="number"
										min="0"
										step="0.01"
										value={
											profileData.landHolding ??
											""
										}
										onChange={(e) =>
											handleInputChange(
												"landHolding",
												e.target
													.value ===
													""
													? null
													: Number(
															e
																.target
																.value
														)
											)
										}
										disabled={
											!isEditing
										}
										placeholder="e.g. 2.5"
									/>

								</div>

								{/* Land Unit */}

								<div className="space-y-2">

									<Label>
										Land Unit
									</Label>

									<Select
										value={
											profileData.landUnit ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"landUnit",
												value
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select unit" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="acre">
												Acre
											</SelectItem>

											<SelectItem value="hectare">
												Hectare
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

								{/* Land Ownership */}

								<div className="space-y-2">

									<Label>
										Land Ownership
									</Label>

									<Select
										value={
											profileData.landOwnership ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"landOwnership",
												value
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select ownership" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="owned">
												Owned
											</SelectItem>

											<SelectItem value="leased">
												Leased
											</SelectItem>

											<SelectItem value="shared">
												Shared
											</SelectItem>

											<SelectItem value="government">
												Government
											</SelectItem>

											<SelectItem value="other">
												Other
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

							</div>
						</div>

						<Separator />

						{/* =================================================
						    FINANCIAL
						================================================= */}

						<div>

							<div className="flex items-center gap-2 mb-4">
								<Landmark className="h-4 w-4 text-muted-foreground" />

								<h3 className="font-semibold">
									Financial & Government Details
								</h3>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

								{/* Annual Income */}

								<div className="space-y-2">

									<Label htmlFor="annualFamilyIncome">
										Annual Family Income
									</Label>

									<Input
										id="annualFamilyIncome"
										type="number"
										min="0"
										step="1000"
										value={
											profileData.annualFamilyIncome ??
											""
										}
										onChange={(e) =>
											handleInputChange(
												"annualFamilyIncome",
												e.target
													.value ===
													""
													? null
													: Number(
															e
																.target
																.value
														)
											)
										}
										disabled={
											!isEditing
										}
										placeholder="₹ Annual income"
									/>

								</div>

								{/* Aadhaar */}

								<div className="space-y-2">

									<Label>
										Aadhaar Linked
									</Label>

									<Select
										value={
											profileData.aadhaarLinked ===
											true
												? "yes"
												: profileData.aadhaarLinked ===
														false
													? "no"
													: ""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"aadhaarLinked",
												value ===
													"yes"
													? true
													: value ===
															"no"
														? false
														: null
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select answer" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="yes">
												Yes
											</SelectItem>

											<SelectItem value="no">
												No
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

								{/* Bank */}

								<div className="space-y-2">

									<Label>
										Bank Account Available
									</Label>

									<Select
										value={
											profileData.bankAccountAvailable ===
											true
												? "yes"
												: profileData.bankAccountAvailable ===
														false
													? "no"
													: ""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"bankAccountAvailable",
												value ===
													"yes"
													? true
													: value ===
															"no"
														? false
														: null
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select answer" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="yes">
												Yes
											</SelectItem>

											<SelectItem value="no">
												No
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

								{/* PM KISAN */}

								<div className="space-y-2">

									<Label>
										PM-KISAN Registered
									</Label>

									<Select
										value={
											profileData.pmKisanRegistered ===
											true
												? "yes"
												: profileData.pmKisanRegistered ===
														false
													? "no"
													: ""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"pmKisanRegistered",
												value ===
													"yes"
													? true
													: value ===
															"no"
														? false
														: null
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select answer" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="yes">
												Yes
											</SelectItem>

											<SelectItem value="no">
												No
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

							</div>
						</div>

						<Separator />

						{/* =================================================
						    IRRIGATION
						================================================= */}

						<div>

							<div className="flex items-center gap-2 mb-4">
								<Tractor className="h-4 w-4 text-muted-foreground" />

								<h3 className="font-semibold">
									Irrigation
								</h3>
							</div>

							<div className="max-w-md">

								<div className="space-y-2">

									<Label>
										Irrigation Type
									</Label>

									<Select
										value={
											profileData.irrigationType ||
											""
										}
										onValueChange={(
											value
										) =>
											handleInputChange(
												"irrigationType",
												value
											)
										}
										disabled={
											!isEditing
										}
									>

										<SelectTrigger>
											<SelectValue placeholder="Select irrigation type" />
										</SelectTrigger>

										<SelectContent>

											<SelectItem value="rainfed">
												Rainfed
											</SelectItem>

											<SelectItem value="canal">
												Canal
											</SelectItem>

											<SelectItem value="well">
												Well
											</SelectItem>

											<SelectItem value="borewell">
												Borewell
											</SelectItem>

											<SelectItem value="drip">
												Drip
											</SelectItem>

											<SelectItem value="sprinkler">
												Sprinkler
											</SelectItem>

											<SelectItem value="mixed">
												Mixed
											</SelectItem>

											<SelectItem value="other">
												Other
											</SelectItem>

										</SelectContent>

									</Select>

								</div>

							</div>
						</div>

						{/* Bottom explanation */}

						<div className="flex gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">

							<FileCheck2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />

							<div className="text-sm text-blue-800">

								<p className="font-medium">
									Why do we ask for this?
								</p>

								<p className="mt-1">
									FarmAI uses these details to compare your profile with the eligibility conditions of government schemes. Your information is stored in your FarmAI account and can be updated from this profile page.
								</p>

							</div>

						</div>

					</CardContent>
				</Card>

				<Separator />

				{/* =================================================
				    LOCATION DETAILS
				================================================= */}

				<Card className="border-border">

					<CardHeader>

						<CardTitle className="flex items-center gap-2">
							<MapPin className="h-5 w-5" />

							{t(
								"locationDetails"
							)}
						</CardTitle>

						<CardDescription>
							{t(
								"farmLocationInfo"
							)}
						</CardDescription>

					</CardHeader>

					<CardContent className="space-y-4">

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

							{/* State */}

							<div className="space-y-2">

								<Label htmlFor="state">
									{t(
										"stateRequired"
									)}
								</Label>

								<Input
									id="state"
									value={
										profileData.state ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"state",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									placeholder={t(
										"statePlaceholder"
									)}
								/>

							</div>

							{/* District */}

							<div className="space-y-2">

								<Label htmlFor="district">
									{t(
										"districtRequired"
									)}
								</Label>

								<Input
									id="district"
									value={
										profileData.district ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"district",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									placeholder={t(
										"districtPlaceholder"
									)}
								/>

							</div>

							{/* Village */}

							<div className="space-y-2">

								<Label htmlFor="village">
									{t(
										"villageTown"
									)}
								</Label>

								<Input
									id="village"
									value={
										profileData.village ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"village",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									placeholder={t(
										"villagePlaceholder"
									)}
								/>

							</div>

							{/* Pincode */}

							<div className="space-y-2">

								<Label htmlFor="pincode">
									{t(
										"pincode"
									)}
								</Label>

								<Input
									id="pincode"
									value={
										profileData.pincode ||
										""
									}
									onChange={(e) =>
										handleInputChange(
											"pincode",
											e.target
												.value
										)
									}
									disabled={
										!isEditing
									}
									placeholder={t(
										"pincodePlaceholder"
									)}
									maxLength={6}
								/>

							</div>

						</div>

						{/* Full Address */}

						<div className="p-4 bg-muted rounded-lg">

							<Label className="text-xs text-muted-foreground">
								{t(
									"fullFarmAddress"
								)}
							</Label>

							<p className="mt-1 text-sm">

								{profileData.farmLocation ||
									[
										profileData.village,
										profileData.district,
										profileData.state,
										profileData.pincode,
									]
										.filter(
											Boolean
										)
										.join(
											", "
										) ||
									t(
										"addressNotComplete"
									)}

							</p>

						</div>

						{/* Coordinates */}

						{profileData.latitude !==
							undefined &&
							profileData.latitude !==
								0 &&
							profileData.longitude !==
								undefined &&
							profileData.longitude !==
								0 && (
								<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">

									<Label className="text-xs text-blue-700 flex items-center gap-2">
										{t(
											"gpsCoordinates"
										)}
									</Label>

									<p className="mt-1 text-sm text-blue-900 font-mono">
										Lat:{" "}
										{profileData.latitude.toFixed(
											6
										)}
										, Lon:{" "}
										{profileData.longitude.toFixed(
											6
										)}
									</p>

								</div>
							)}

					</CardContent>
				</Card>

				<Separator />

				{/* =================================================
				    FARMING DETAILS
				================================================= */}

				<Card className="border-border">

					<CardHeader>
						<CardTitle>
							{t(
								"farmingDetails"
							)}
						</CardTitle>

						<CardDescription>
							{t(
								"cropsAndPractices"
							)}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-4">

						{/* Farming Type */}

						<div className="space-y-2">

							<Label htmlFor="farmingType">
								{t(
									"farmingType"
								)}
							</Label>

							<Select
								value={
									profileData.farmingType ||
									"traditional"
								}
								onValueChange={(
									value
								) =>
									handleInputChange(
										"farmingType",
										value
									)
								}
								disabled={
									!isEditing
								}
							>

								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"selectFarmingType"
										)}
									/>
								</SelectTrigger>

								<SelectContent>

									<SelectItem value="traditional">
										{t(
											"traditionalFarming"
										)}
									</SelectItem>

									<SelectItem value="organic">
										{t(
											"organicFarming"
										)}
									</SelectItem>

									<SelectItem value="modern">
										{t(
											"modernFarming"
										)}
									</SelectItem>

								</SelectContent>

							</Select>

						</div>

						{/* Crops */}

						<div className="space-y-2">

							<Label>
								{t(
									"selectedCrops"
								)}{" "}
								(
								{profileData.crops
									?.length ||
									0}
								)
							</Label>

							{!isEditing && (
								<div className="flex flex-wrap gap-2">

									{profileData.crops &&
									profileData
										.crops
										.length >
										0 ? (
										profileData.crops.map(
											(
												crop
											) => (
												<Badge
													key={
														crop
													}
													variant="secondary"
													className="text-sm"
												>
													{
														crop
													}
												</Badge>
											)
										)
									) : (
										<p className="text-sm text-muted-foreground">
											{t(
												"noCropsSelected"
											)}
										</p>
									)}

								</div>
							)}

							{isEditing && (
								<div className="p-4 border rounded-lg">

									<CropSelector
										selected={
											profileData.crops ||
											[]
										}
										toggleCrop={
											toggleCrop
										}
										lang={
											(profileData.preferredLanguage as
												| "en-US"
												| "hi-IN"
												| "mr-IN") ||
											"en-US"
										}
									/>

								</div>
							)}

						</div>

					</CardContent>
				</Card>

				<Separator />

				{/* =================================================
				    PREFERENCES
				================================================= */}

				<Card className="border-border">

					<CardHeader>

						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />

							{t(
								"preferences"
							)}
						</CardTitle>

						<CardDescription>
							{t(
								"languageAndCommunication"
							)}
						</CardDescription>

					</CardHeader>

					<CardContent className="space-y-4">

						<div className="space-y-2">

							<Label htmlFor="preferredLanguage">
								{t(
									"preferredLanguage"
								)}
							</Label>

							<Select
								value={
									profileData.preferredLanguage ||
									"en-US"
								}
								onValueChange={(
									value
								) =>
									handleInputChange(
										"preferredLanguage",
										value
									)
								}
								disabled={
									!isEditing
								}
							>

								<SelectTrigger>
									<SelectValue
										placeholder={t(
											"selectLanguage"
										)}
									/>
								</SelectTrigger>

								<SelectContent>

									<SelectItem value="en-US">
										{t(
											"english"
										)}
									</SelectItem>

									<SelectItem value="hi-IN">
										{t(
											"hindi"
										)}
									</SelectItem>

									<SelectItem value="mr-IN">
										{t(
											"marathi"
										)}
									</SelectItem>

								</SelectContent>

							</Select>

							<p className="text-xs text-muted-foreground">
								{t(
									"languageUsedForCommunication"
								)}
							</p>

						</div>

					</CardContent>
				</Card>

				{/* =================================================
				    ACCOUNT INFO
				================================================= */}

				{profileData.createdAt && (
					<div className="text-center text-sm text-muted-foreground">
						{t(
							"memberSince"
						)}{" "}
						{new Date(
							profileData.createdAt
						).toLocaleDateString(
							"en-IN",
							{
								year: "numeric",
								month: "long",
								day: "numeric",
							}
						)}
					</div>
				)}

			</div>
		</DashboardLayout>
	)
}