"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation" // ✅ Import useRouter for redirection
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Camera, Save, Edit } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

interface UserProfile {
	fullName: string;
	farmName?: string;
	farmLocation?: string;
	email: string;
	phone?: string;
	profilePhoto?: string;
	[key: string]: any; 
}

export default function ProfilePage() {
	const [isEditing, setIsEditing] = useState(false)
	const [profileData, setProfileData] = useState<UserProfile | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	
	const router = useRouter() // ✅ Initialize router

	// Fetch user on mount
	useEffect(() => {
		const fetchUser = async () => {
			setLoading(true);
			setError(null);

			try {
				const token = localStorage.getItem("token")
				if (!token) {
					// If no token exists, immediately redirect
					router.push("/login") 
					return
				}

				const res = await fetch("/api/user", {
					headers: { Authorization: `Bearer ${token}` },
				})
				
				if (res.status === 401) {
					// ✅ CRITICAL FIX: Handle 401 by clearing token and redirecting
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
				localStorage.setItem("user", JSON.stringify(data)); 

			} catch (err: any) {
				console.error("Error fetching user:", err)
				setError(err.message || "Could not load profile data.")
			} finally {
				setLoading(false)
			}
		}

		fetchUser()
	}, [router]) // ✅ Add router to dependencies

	const handleInputChange = (field: keyof UserProfile, value: string) => {
		setProfileData((prev) => (prev ? { ...prev, [field]: value } : null))
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

	const handleSave = async () => {
		if (!profileData) return;

		try {
			const token = localStorage.getItem("token")
			if (!token) {
				// Redirect if token is missing
				router.push("/login")
				return
			}
			
			const formData = new FormData()
			
			Object.entries(profileData).forEach(([key, value]) => {
				// Skip profilePhoto if we are not uploading a new file
				if (key === 'profilePhoto' && !selectedFile) {
					return;
				}
				
				if (value !== null && value !== undefined) {
					if (typeof value === 'string' || typeof value === 'number') {
						formData.append(key, String(value));
					}
				}
			})
			
			if (selectedFile) {
				formData.append("profilePhoto", selectedFile, selectedFile.name)
			}

			const res = await fetch("/api/user", {
				method: "PUT",
				headers: { 
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			})

			if (res.status === 401) {
				// ✅ CRITICAL FIX: Handle 401 on save by clearing token and redirecting
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
			setIsEditing(false)
			setSelectedFile(null)
			setError(null)
			
			localStorage.setItem("user", JSON.stringify(updated));

		} catch (err: any) {
			console.error("Error saving profile:", err)
			setError(err.message || "Failed to save profile.")
		}
	}

	// --- RENDER LOGIC ---

	// Display Loading state
	if (loading) return (
		<DashboardLayout>
			<div className="flex justify-center items-center h-[50vh]">
				<p className="text-xl font-medium">Loading profile data... ⏳</p>
			</div>
		</DashboardLayout>
	)
	
	// Display Error state 
	if (error || !profileData) return (
		<DashboardLayout>
			<Card className="border-red-500/50 bg-red-500/10">
				<CardHeader>
					<CardTitle className="text-red-600">Profile Load Error 🛑</CardTitle>
					<CardDescription className="text-red-700">
						{error || "No profile data found. This might be due to a login issue."}
					</CardDescription>
				</CardHeader>
			</Card>
		</DashboardLayout>
	)
	
	// Display Profile Page Content
	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold text-foreground">Profile</h1>
						<p className="text-muted-foreground mt-2">Manage your personal information and farming details</p>
					</div>
					<Button
						onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
						className="bg-primary text-primary-foreground hover:bg-primary/90"
						disabled={isEditing && !profileData.fullName} 
					>
						{isEditing ? (
							<>
								<Save className="h-4 w-4 mr-2" />
								Save Changes
							</>
						) : (
							<>
								<Edit className="h-4 w-4 mr-2" />
								Edit Profile
							</>
						)}
					</Button>
				</div>
				
				{/* Global Error Message */}
				{error && (
					<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
						{error}
					</div>
				)}

				{/* Profile Card */}
				<Card className="border-border">
					<CardContent className="p-6 flex items-center gap-6">
						<div className="relative">
							<Avatar className="h-24 w-24">
								{profileData.profilePhoto ? (
									<AvatarImage src={profileData.profilePhoto} alt={`${profileData.fullName}'s profile`} />
								) : (
									<AvatarFallback className="bg-primary text-primary-foreground text-2xl">
										{profileData.fullName
											.split(" ")
											.map((n: string) => n[0])
											.join("")}
									</AvatarFallback>
								)}
							</Avatar>
							{isEditing && (
								<label className="absolute bottom-0 right-0 cursor-pointer p-1 bg-white rounded-full border border-border hover:bg-gray-100 transition-colors">
									<Camera className="h-4 w-4 text-muted-foreground" />
									<input type="file" className="hidden" onChange={handleFileChange} />
								</label>
							)}
						</div>
						<div className="flex-1">
							<h2 className="text-2xl font-bold">{profileData.fullName}</h2>
							<p className="text-muted-foreground">{profileData.farmName || "No Farm Name"}</p>
							<div className="flex gap-2 mt-2 items-center">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="text-sm text-muted-foreground">{profileData.farmLocation || "N/A"}</span>
							</div>
							<div className="flex gap-2 mt-3">
								<Badge variant="secondary">Verified Farmer</Badge>
								<Badge variant="outline">Premium Member</Badge>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Personal Info */}
				<Card className="border-border">
					<CardHeader>
						<CardTitle>Personal Information</CardTitle>
						<CardDescription>Your basic contact info</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="fullName">Full Name</Label>
							<Input
								id="fullName"
								value={profileData.fullName}
								onChange={(e) => handleInputChange("fullName", e.target.value)}
								disabled={!isEditing}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								value={profileData.email}
								onChange={(e) => handleInputChange("email", e.target.value)}
								disabled={!isEditing}
								type="email"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input
								id="phone"
								value={profileData.phone || ""}
								onChange={(e) => handleInputChange("phone", e.target.value)}
								disabled={!isEditing}
								type="tel"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="farmName">Farm Name</Label>
							<Input
								id="farmName"
								value={profileData.farmName || ""}
								onChange={(e) => handleInputChange("farmName", e.target.value)}
								disabled={!isEditing}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="farmLocation">Farm Location</Label>
							<Input
								id="farmLocation"
								value={profileData.farmLocation || ""}
								onChange={(e) => handleInputChange("farmLocation", e.target.value)}
								disabled={!isEditing}
							/>
						</div>
					</CardContent>
				</Card>
			</div>
		</DashboardLayout>
	)
}