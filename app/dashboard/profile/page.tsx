"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MapPin, Camera, Save, Edit, Lock, AlertTriangle, CheckCircle2, Globe } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import CropSelector from "@/components/CropSelector"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface UserProfile {
	_id?: string;
	fullName: string;
	email?: string;
	phone?: string;
	farmName?: string;
	farmLocation?: string;
	state?: string;
	district?: string;
	pincode?: string;
	village?: string;
	latitude?: number;
	longitude?: number;
	crops?: string[];
	farmingType?: string;
	preferredLanguage?: string;
	profilePhoto?: string;
	createdAt?: string;
	[key: string]: any; 
}

export default function ProfilePage() {
	const { t } = useLanguage()
	const [isEditing, setIsEditing] = useState(false)
	const [profileData, setProfileData] = useState<UserProfile | null>(null)
	const [originalData, setOriginalData] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [showSensitiveWarning, setShowSensitiveWarning] = useState(false)
	
	const router = useRouter()

	// Fetch user on mount
	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			setError(null);

			try {
				const token = localStorage.getItem("token")
				if (!token) {
					router.push("/login") 
					return
				}

				const res = await fetch("/api/user", {
					headers: { Authorization: `Bearer ${token}` },
				})
				
				if (res.status === 401) {
					localStorage.removeItem("token")
					localStorage.removeItem("user")
					router.push("/login")
					return 
				}
				
				if (!res.ok) {
					const errorText = await res.text()
					throw new Error(`Failed to fetch user: ${res.status} ${errorText}`)
				}

				const data: UserProfile = await res.json()
				setProfileData(data)
				setOriginalData(JSON.parse(JSON.stringify(data))) // Deep copy
				localStorage.setItem("user", JSON.stringify(data)); 

			} catch (err: any) {
				console.error("Error fetching user:", err)
				setError(err.message || "Could not load profile data.")
			} finally {
				setLoading(false)
			}
		}

		fetchUser()
	}, [router])

	const handleInputChange = (field: keyof UserProfile, value: string | string[]) => {
		setProfileData((prev) => (prev ? { ...prev, [field]: value } : null))
		
		// Check if sensitive field is being changed
		if ((field === 'phone' || field === 'email') && value !== originalData?.[field]) {
			setShowSensitiveWarning(true)
		}
	}

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			setSelectedFile(e.target.files[0])
			
			const reader = new FileReader()
			reader.onload = () => {
				setProfileData((prev) => (prev ? { ...prev, profilePhoto: reader.result as string } : null))
			}
			reader.readAsDataURL(e.target.files[0])
		}
	}

	const toggleCrop = (crop: string) => {
		if (!profileData) return;
		const currentCrops = profileData.crops || [];
		const newCrops = currentCrops.includes(crop)
			? currentCrops.filter((c) => c !== crop)
			: [...currentCrops, crop];
		handleInputChange("crops", newCrops);
	};

	const handleCancel = () => {
		setProfileData(JSON.parse(JSON.stringify(originalData)))
		setIsEditing(false)
		setSelectedFile(null)
		setShowSensitiveWarning(false)
		setError(null)
		setSuccess(null)
	}

	const handleSave = async () => {
		if (!profileData) return;
		
		// Check if phone or email changed
		const phoneChanged = profileData.phone !== originalData?.phone;
		const emailChanged = profileData.email !== originalData?.email;
		
		if (phoneChanged || emailChanged) {
			const confirmMessage = phoneChanged && emailChanged
				? "You're changing both phone number and email. This will require re-verification. Continue?"
				: phoneChanged
				? "Changing phone number will require OTP verification. Continue?"
				: "Changing email will require verification. Continue?";
			
			if (!window.confirm(confirmMessage)) {
				return;
			}
		}

		setSaving(true);
		setError(null);
		setSuccess(null);

		try {
			const token = localStorage.getItem("token")
			if (!token) {
				router.push("/login")
				return
			}
			
			// Prepare update payload
			const updatePayload: any = {
				fullName: profileData.fullName,
				email: profileData.email,
				phone: profileData.phone,
				farmName: profileData.farmName,
				farmLocation: profileData.farmLocation,
				state: profileData.state,
				district: profileData.district,
				pincode: profileData.pincode,
				village: profileData.village,
				crops: profileData.crops,
				farmingType: profileData.farmingType,
				preferredLanguage: profileData.preferredLanguage,
			};

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
			
			const updated: UserProfile = await res.json()
			setProfileData(updated)
			setOriginalData(JSON.parse(JSON.stringify(updated)))
			setIsEditing(false)
			setSelectedFile(null)
			setShowSensitiveWarning(false)
			setSuccess(t("profileUpdatedSuccessfully"))
			
			localStorage.setItem("user", JSON.stringify(updated));

			// Clear success message after 3 seconds
			setTimeout(() => setSuccess(null), 3000);

		} catch (err: any) {
			console.error("Error saving profile:", err)
			setError(err.message || "Failed to save profile.")
		} finally {
			setSaving(false);
		}
	}

	// --- RENDER LOGIC ---

	if (loading) return (
		<DashboardLayout>
			<div className="flex justify-center items-center h-[50vh]">
				<p className="text-xl font-medium">{t("loadingProfileData")}</p>
			</div>
		</DashboardLayout>
	)
	
	if (error && !profileData) return (
		<DashboardLayout>
			<Card className="border-red-500/50 bg-red-500/10">
				<CardHeader>
					<CardTitle className="text-red-600">{t("profileLoadError")}</CardTitle>
					<CardDescription className="text-red-700">
						{error || t("noProfileDataFound")}
					</CardDescription>
				</CardHeader>
			</Card>
		</DashboardLayout>
	)
	
	if (!profileData) return null;
	
	// Display Profile Page Content
	return (
		<DashboardLayout>
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">{t("myProfile")}</h1>
						<p className="text-muted-foreground mt-2">{t("managePersonalInfo")}</p>
					</div>
					<div className="flex gap-2">
						{isEditing && (
							<Button
								variant="outline"
								onClick={handleCancel}
								disabled={saving}
							>
								{t("cancel")}
							</Button>
						)}
					<Button
						onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
							disabled={saving || (isEditing && !profileData.fullName)} 
					>
							{saving ? (
								<>{t("saving")}</>
							) : isEditing ? (
							<>
								<Save className="h-4 w-4 mr-2" />
								{t("saveChanges")}
							</>
						) : (
							<>
								<Edit className="h-4 w-4 mr-2" />
								{t("editProfile")}
							</>
						)}
					</Button>
					</div>
				</div>
				
				{/* Success Message */}
				{success && (
					<Alert className="border-green-500 bg-green-50">
						<CheckCircle2 className="h-4 w-4 text-green-600" />
						<AlertDescription className="text-green-700">
							{success}
						</AlertDescription>
					</Alert>
				)}

				{/* Error Message */}
				{error && (
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>
						{error}
						</AlertDescription>
					</Alert>
				)}

				{/* Sensitive Field Warning */}
				{showSensitiveWarning && isEditing && (
					<Alert className="border-orange-500 bg-orange-50">
						<Lock className="h-4 w-4 text-orange-600" />
						<AlertDescription className="text-orange-700">
							⚠️ You're changing sensitive information (phone/email). This may require additional verification.
						</AlertDescription>
					</Alert>
				)}

				{/* Profile Card */}
				<Card className="border-border">
					<CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
						<div className="relative">
							<Avatar className="h-28 w-28 border-4 border-primary/10">
								{profileData.profilePhoto ? (
									<AvatarImage src={profileData.profilePhoto} alt={`${profileData.fullName}'s profile`} />
								) : (
									<AvatarFallback className="bg-primary text-primary-foreground text-3xl">
										{profileData.fullName
											.split(" ")
											.map((n: string) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								)}
							</Avatar>
							{isEditing && (
								<label className="absolute bottom-0 right-0 cursor-pointer p-2 bg-primary rounded-full border-2 border-white hover:bg-primary/90 transition-colors shadow-lg">
									<Camera className="h-4 w-4 text-white" />
									<input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
								</label>
							)}
						</div>
						<div className="flex-1 text-center md:text-left">
							<h2 className="text-3xl font-bold">{profileData.fullName}</h2>
							<p className="text-muted-foreground text-lg mt-1">{profileData.farmName || "Farmer"}</p>
							<div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start items-center">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">
									{[profileData.village, profileData.district, profileData.state]
										.filter(Boolean)
										.join(", ") || t("locationNotSet")}
								</span>
							</div>
							<div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
								<Badge variant="secondary" className="bg-green-100 text-green-700">{t("verifiedFarmer")}</Badge>
								<Badge variant="outline">{profileData.farmingType || t("traditionalFarming")} {t("farming")}</Badge>
								{profileData.crops && profileData.crops.length > 0 && (
									<Badge variant="outline">{profileData.crops.length} {t("crops")}</Badge>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Personal Information */}
				<Card className="border-border">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<span>{t("personalInformation")}</span>
							{isEditing && <Lock className="h-4 w-4 text-orange-500" />}
						</CardTitle>
						<CardDescription>{t("basicContactDetails")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
								<Label htmlFor="fullName">{t("fullName")}</Label>
							<Input
								id="fullName"
								value={profileData.fullName}
								onChange={(e) => handleInputChange("fullName", e.target.value)}
								disabled={!isEditing}
									required
							/>
						</div>
						<div className="space-y-2">
								<Label htmlFor="phone" className="flex items-center gap-2">
									{t("phoneNumber")}
									{isEditing && <Lock className="h-3 w-3 text-orange-500" />}
								</Label>
							<Input
								id="phone"
								value={profileData.phone || ""}
								onChange={(e) => handleInputChange("phone", e.target.value)}
								disabled={!isEditing}
								type="tel"
									placeholder="10-digit mobile number"
								/>
								{isEditing && (
									<p className="text-xs text-orange-600">{t("changingPhoneRequiresVerification")}</p>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email" className="flex items-center gap-2">
									{t("emailOptional")}
									{isEditing && <Lock className="h-3 w-3 text-orange-500" />}
								</Label>
								<Input
									id="email"
									value={profileData.email || ""}
									onChange={(e) => handleInputChange("email", e.target.value)}
									disabled={!isEditing}
									type="email"
									placeholder="your@email.com"
								/>
								{isEditing && profileData.email && (
									<p className="text-xs text-orange-600">{t("changingEmailRequiresVerification")}</p>
								)}
						</div>
						<div className="space-y-2">
								<Label htmlFor="farmName">{t("farmNameOptional")}</Label>
							<Input
								id="farmName"
								value={profileData.farmName || ""}
								onChange={(e) => handleInputChange("farmName", e.target.value)}
								disabled={!isEditing}
									placeholder={t("farmNamePlaceholder")}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Separator />

				{/* Location Details */}
				<Card className="border-border">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<MapPin className="h-5 w-5" />
							{t("locationDetails")}
						</CardTitle>
						<CardDescription>{t("farmLocationInfo")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="state">{t("stateRequired")}</Label>
								<Input
									id="state"
									value={profileData.state || ""}
									onChange={(e) => handleInputChange("state", e.target.value)}
									disabled={!isEditing}
									placeholder={t("statePlaceholder")}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="district">{t("districtRequired")}</Label>
								<Input
									id="district"
									value={profileData.district || ""}
									onChange={(e) => handleInputChange("district", e.target.value)}
									disabled={!isEditing}
									placeholder={t("districtPlaceholder")}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="village">{t("villageTown")}</Label>
								<Input
									id="village"
									value={profileData.village || ""}
									onChange={(e) => handleInputChange("village", e.target.value)}
									disabled={!isEditing}
									placeholder={t("villagePlaceholder")}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="pincode">{t("pincode")}</Label>
								<Input
									id="pincode"
									value={profileData.pincode || ""}
									onChange={(e) => handleInputChange("pincode", e.target.value)}
									disabled={!isEditing}
									placeholder={t("pincodePlaceholder")}
									maxLength={6}
								/>
							</div>
						</div>
						
						{/* Full Address Display */}
						<div className="p-4 bg-muted rounded-lg">
							<Label className="text-xs text-muted-foreground">{t("fullFarmAddress")}</Label>
							<p className="mt-1 text-sm">
								{profileData.farmLocation || [
									profileData.village,
									profileData.district,
									profileData.state,
									profileData.pincode
								].filter(Boolean).join(", ") || t("addressNotComplete")}
							</p>
						</div>

						{/* Coordinates Display */}
						{(profileData.latitude && profileData.longitude) && (
							<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<Label className="text-xs text-blue-700 flex items-center gap-2">
									{t("gpsCoordinates")}
								</Label>
								<p className="mt-1 text-sm text-blue-900 font-mono">
									Lat: {profileData.latitude.toFixed(6)}, Lon: {profileData.longitude.toFixed(6)}
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				<Separator />

				{/* Farming Details */}
				<Card className="border-border">
					<CardHeader>
						<CardTitle>{t("farmingDetails")}</CardTitle>
						<CardDescription>{t("cropsAndPractices")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Farming Type */}
						<div className="space-y-2">
							<Label htmlFor="farmingType">{t("farmingType")}</Label>
							<Select
								value={profileData.farmingType || "traditional"}
								onValueChange={(value) => handleInputChange("farmingType", value)}
								disabled={!isEditing}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("selectFarmingType")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="traditional">{t("traditionalFarming")}</SelectItem>
									<SelectItem value="organic">{t("organicFarming")}</SelectItem>
									<SelectItem value="modern">{t("modernFarming")}</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Crop Selection */}
						<div className="space-y-2">
							<Label>{t("selectedCrops")} ({profileData.crops?.length || 0})</Label>
							{!isEditing && (
								<div className="flex flex-wrap gap-2">
									{profileData.crops && profileData.crops.length > 0 ? (
										profileData.crops.map((crop) => (
											<Badge key={crop} variant="secondary" className="text-sm">
												{crop}
											</Badge>
										))
									) : (
										<p className="text-sm text-muted-foreground">{t("noCropsSelected")}</p>
									)}
								</div>
							)}
							{isEditing && (
								<div className="p-4 border rounded-lg">
									<CropSelector
										selected={profileData.crops || []}
										toggleCrop={toggleCrop}
										lang={profileData.preferredLanguage as "en-US" | "hi-IN" | "mr-IN" || "en-US"}
									/>
								</div>
							)}
						</div>
					</CardContent>
				</Card>

				<Separator />

				{/* Preferences */}
				<Card className="border-border">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />
							{t("preferences")}
						</CardTitle>
						<CardDescription>{t("languageAndCommunication")}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="preferredLanguage">{t("preferredLanguage")}</Label>
							<Select
								value={profileData.preferredLanguage || "en-US"}
								onValueChange={(value) => handleInputChange("preferredLanguage", value)}
								disabled={!isEditing}
							>
								<SelectTrigger>
									<SelectValue placeholder={t("selectLanguage")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="en-US">{t("english")}</SelectItem>
									<SelectItem value="hi-IN">{t("hindi")}</SelectItem>
									<SelectItem value="mr-IN">{t("marathi")}</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{t("languageUsedForCommunication")}
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Account Info */}
				{profileData.createdAt && (
					<div className="text-center text-sm text-muted-foreground">
						{t("memberSince")} {new Date(profileData.createdAt).toLocaleDateString('en-IN', { 
							year: 'numeric', 
							month: 'long', 
							day: 'numeric' 
						})}
					</div>
				)}
			</div>
		</DashboardLayout>
	)
}
