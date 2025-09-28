"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Phone, Mail, Camera, Save, Edit } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) throw new Error("No token found")

        const res = await fetch("/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to fetch user")

        const data = await res.json()
        setProfileData(data)
        setLoading(false)
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    }

    fetchUser()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      // Show preview
      const reader = new FileReader()
      reader.onload = () => {
        setProfileData((prev: any) => ({ ...prev, profilePhoto: reader.result }))
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) throw new Error("No token found")

      const formData = new FormData()
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== null && profileData[key] !== undefined) {
          formData.append(key, profileData[key])
        }
      })
      if (selectedFile) {
        formData.append("profilePhoto", selectedFile)
      }

      const res = await fetch("/api/user", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!res.ok) throw new Error("Failed to save profile")
      const updated = await res.json()
      setProfileData(updated)
      setIsEditing(false)
      setSelectedFile(null)
    } catch (err) {
      console.error("Error saving profile:", err)
    }
  }

  if (loading || !profileData) return <p>Loading...</p>

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

        {/* Profile Card */}
        <Card className="border-border">
          <CardContent className="p-6 flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {profileData.profilePhoto ? (
                  <AvatarImage src={profileData.profilePhoto} />
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
                <label className="absolute bottom-0 right-0 cursor-pointer p-1 bg-white rounded-full border border-border">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profileData.fullName}</h2>
              <p className="text-muted-foreground">{profileData.farmName}</p>
              <div className="flex gap-2 mt-2 items-center">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{profileData.farmLocation || profileData.state}</span>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
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

        {/* Optional: Add more farming details like farmSize, primaryCrops etc. */}
      </div>
    </DashboardLayout>
  )
}
