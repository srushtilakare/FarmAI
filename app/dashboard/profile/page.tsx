"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, MapPin, Phone, Mail, Camera, Save, Edit } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    fullName: "Rajesh Kumar Farmer",
    email: "rajesh.farmer@gmail.com",
    phone: "+91 9876543210",
    farmName: "Green Valley Farm",
    farmSize: "3.5",
    location: "Pune, Maharashtra",
    state: "maharashtra",
    district: "Pune",
    pincode: "411001",
    primaryCrops: "Rice, Wheat, Cotton",
    farmingExperience: "11-20",
    farmingType: "mixed",
    irrigationType: "drip",
    soilType: "black",
    preferredLanguage: "english",
  })

  const handleSave = () => {
    setIsEditing(false)
    // Here you would typically save to backend
    console.log("Profile updated:", profileData)
  }

  const handleInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }))
  }

  const farmingStats = [
    { label: "Farm Size", value: "3.5 acres", icon: MapPin },
    { label: "Experience", value: "15+ years", icon: User },
    { label: "Primary Crops", value: "3 types", icon: User },
    { label: "Farming Type", value: "Mixed", icon: User },
  ]

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

        {/* Profile Overview */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg?key=profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profileData.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 border-border bg-transparent"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{profileData.fullName}</h2>
                <p className="text-muted-foreground">{profileData.farmName}</p>
                <div className="flex items-center gap-2 mt-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{profileData.location}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Badge variant="secondary">Verified Farmer</Badge>
                  <Badge variant="outline">Premium Member</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farming Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          {farmingStats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="border-border">
                <CardContent className="p-4 text-center">
                  <IconComponent className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-foreground">{stat.value}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Personal Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic contact and identification details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    disabled={!isEditing}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    disabled={!isEditing}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={!isEditing}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferredLanguage" className="text-foreground">
                  Preferred Language
                </Label>
                <Select
                  value={profileData.preferredLanguage}
                  onValueChange={(value) => handleInputChange("preferredLanguage", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="marathi">Marathi</SelectItem>
                    <SelectItem value="gujarati">Gujarati</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                    <SelectItem value="telugu">Telugu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farm Information */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Farm Information</CardTitle>
            <CardDescription>Details about your farming operation and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmName" className="text-foreground">
                  Farm Name
                </Label>
                <Input
                  id="farmName"
                  value={profileData.farmName}
                  onChange={(e) => handleInputChange("farmName", e.target.value)}
                  disabled={!isEditing}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize" className="text-foreground">
                  Farm Size (acres)
                </Label>
                <Input
                  id="farmSize"
                  type="number"
                  value={profileData.farmSize}
                  onChange={(e) => handleInputChange("farmSize", e.target.value)}
                  disabled={!isEditing}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground">
                  State
                </Label>
                <Select
                  value={profileData.state}
                  onValueChange={(value) => handleInputChange("state", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="punjab">Punjab</SelectItem>
                    <SelectItem value="gujarat">Gujarat</SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                    <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-foreground">
                  District
                </Label>
                <Input
                  id="district"
                  value={profileData.district}
                  onChange={(e) => handleInputChange("district", e.target.value)}
                  disabled={!isEditing}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode" className="text-foreground">
                  PIN Code
                </Label>
                <Input
                  id="pincode"
                  value={profileData.pincode}
                  onChange={(e) => handleInputChange("pincode", e.target.value)}
                  disabled={!isEditing}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilType" className="text-foreground">
                  Soil Type
                </Label>
                <Select
                  value={profileData.soilType}
                  onValueChange={(value) => handleInputChange("soilType", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="black">Black Soil</SelectItem>
                    <SelectItem value="red">Red Soil</SelectItem>
                    <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                    <SelectItem value="clay">Clay Soil</SelectItem>
                    <SelectItem value="sandy">Sandy Soil</SelectItem>
                    <SelectItem value="loamy">Loamy Soil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryCrops" className="text-foreground">
                Primary Crops
              </Label>
              <Textarea
                id="primaryCrops"
                value={profileData.primaryCrops}
                onChange={(e) => handleInputChange("primaryCrops", e.target.value)}
                disabled={!isEditing}
                className="border-border focus:ring-primary"
                placeholder="List your main crops (e.g., Rice, Wheat, Cotton)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Farming Practices */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Farming Practices</CardTitle>
            <CardDescription>Information about your farming methods and experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="farmingExperience" className="text-foreground">
                  Farming Experience
                </Label>
                <Select
                  value={profileData.farmingExperience}
                  onValueChange={(value) => handleInputChange("farmingExperience", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="11-20">11-20 years</SelectItem>
                    <SelectItem value="20+">20+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmingType" className="text-foreground">
                  Farming Type
                </Label>
                <Select
                  value={profileData.farmingType}
                  onValueChange={(value) => handleInputChange("farmingType", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organic">Organic</SelectItem>
                    <SelectItem value="conventional">Conventional</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="sustainable">Sustainable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="irrigationType" className="text-foreground">
                  Irrigation Type
                </Label>
                <Select
                  value={profileData.irrigationType}
                  onValueChange={(value) => handleInputChange("irrigationType", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="flood">Flood Irrigation</SelectItem>
                    <SelectItem value="rainfed">Rain-fed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
