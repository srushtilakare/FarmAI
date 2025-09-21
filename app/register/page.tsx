"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Leaf, User, Mail, Lock, Phone, MapPin, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",

    // Farm Information
    farmName: "",
    farmSize: "",
    farmLocation: "",
    state: "",
    district: "",
    pincode: "",

    // Agricultural Details
    primaryCrops: "",
    farmingExperience: "",
    farmingType: "",
    irrigationType: "",
    soilType: "",

    // Preferences
    preferredLanguage: "",
    communicationPreference: "",
  })

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      return
    }

    setIsLoading(true)
    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 2000)
  }

  const handleGoogleSignup = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      router.push("/dashboard")
    }, 1500)
  }

  const updateFormData = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-foreground">
          Full Name *
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => updateFormData("fullName", e.target.value)}
            className="pl-10 border-border focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-foreground">
          Email Address *
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="farmer@example.com"
            value={formData.email}
            onChange={(e) => updateFormData("email", e.target.value)}
            className="pl-10 border-border focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-foreground">
          Phone Number *
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+91 9876543210"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className="pl-10 border-border focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-foreground">
          Password *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a strong password"
            value={formData.password}
            onChange={(e) => updateFormData("password", e.target.value)}
            className="pl-10 pr-10 border-border focus:ring-primary"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-foreground">
          Confirm Password *
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
            className="pl-10 pr-10 border-border focus:ring-primary"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="farmName" className="text-foreground">
          Farm Name
        </Label>
        <Input
          id="farmName"
          placeholder="Enter your farm name"
          value={formData.farmName}
          onChange={(e) => updateFormData("farmName", e.target.value)}
          className="border-border focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="farmSize" className="text-foreground">
          Farm Size (in acres) *
        </Label>
        <Input
          id="farmSize"
          type="number"
          placeholder="e.g., 2.5"
          value={formData.farmSize}
          onChange={(e) => updateFormData("farmSize", e.target.value)}
          className="border-border focus:ring-primary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="state" className="text-foreground">
          State *
        </Label>
        <Select value={formData.state} onValueChange={(value) => updateFormData("state", value)}>
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select your state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
            <SelectItem value="bihar">Bihar</SelectItem>
            <SelectItem value="gujarat">Gujarat</SelectItem>
            <SelectItem value="haryana">Haryana</SelectItem>
            <SelectItem value="karnataka">Karnataka</SelectItem>
            <SelectItem value="madhya-pradesh">Madhya Pradesh</SelectItem>
            <SelectItem value="maharashtra">Maharashtra</SelectItem>
            <SelectItem value="punjab">Punjab</SelectItem>
            <SelectItem value="rajasthan">Rajasthan</SelectItem>
            <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
            <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
            <SelectItem value="west-bengal">West Bengal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="district" className="text-foreground">
          District *
        </Label>
        <Input
          id="district"
          placeholder="Enter your district"
          value={formData.district}
          onChange={(e) => updateFormData("district", e.target.value)}
          className="border-border focus:ring-primary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pincode" className="text-foreground">
          PIN Code *
        </Label>
        <Input
          id="pincode"
          placeholder="Enter 6-digit PIN code"
          value={formData.pincode}
          onChange={(e) => updateFormData("pincode", e.target.value)}
          className="border-border focus:ring-primary"
          maxLength={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="farmLocation" className="text-foreground">
          Farm Address
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Textarea
            id="farmLocation"
            placeholder="Enter your complete farm address"
            value={formData.farmLocation}
            onChange={(e) => updateFormData("farmLocation", e.target.value)}
            className="pl-10 border-border focus:ring-primary min-h-[80px]"
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="primaryCrops" className="text-foreground">
          Primary Crops *
        </Label>
        <Textarea
          id="primaryCrops"
          placeholder="e.g., Rice, Wheat, Cotton, Sugarcane"
          value={formData.primaryCrops}
          onChange={(e) => updateFormData("primaryCrops", e.target.value)}
          className="border-border focus:ring-primary"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="farmingExperience" className="text-foreground">
          Farming Experience *
        </Label>
        <Select
          value={formData.farmingExperience}
          onValueChange={(value) => updateFormData("farmingExperience", value)}
        >
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select your experience" />
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
          Farming Type *
        </Label>
        <Select value={formData.farmingType} onValueChange={(value) => updateFormData("farmingType", value)}>
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select farming type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="organic">Organic Farming</SelectItem>
            <SelectItem value="conventional">Conventional Farming</SelectItem>
            <SelectItem value="mixed">Mixed Farming</SelectItem>
            <SelectItem value="sustainable">Sustainable Farming</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="irrigationType" className="text-foreground">
          Irrigation Type
        </Label>
        <Select value={formData.irrigationType} onValueChange={(value) => updateFormData("irrigationType", value)}>
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select irrigation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="drip">Drip Irrigation</SelectItem>
            <SelectItem value="sprinkler">Sprinkler Irrigation</SelectItem>
            <SelectItem value="flood">Flood Irrigation</SelectItem>
            <SelectItem value="rainfed">Rain-fed</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredLanguage" className="text-foreground">
          Preferred Language *
        </Label>
        <Select
          value={formData.preferredLanguage}
          onValueChange={(value) => updateFormData("preferredLanguage", value)}
        >
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select preferred language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="hindi">Hindi</SelectItem>
            <SelectItem value="bengali">Bengali</SelectItem>
            <SelectItem value="tamil">Tamil</SelectItem>
            <SelectItem value="telugu">Telugu</SelectItem>
            <SelectItem value="marathi">Marathi</SelectItem>
            <SelectItem value="gujarati">Gujarati</SelectItem>
            <SelectItem value="kannada">Kannada</SelectItem>
            <SelectItem value="punjabi">Punjabi</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Farm AI</span>
          </div>
          <CardTitle className="text-2xl text-foreground">Create Your Account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Step {currentStep} of 3:{" "}
            {currentStep === 1
              ? "Personal Information"
              : currentStep === 2
                ? "Farm Details"
                : "Agricultural Preferences"}
          </CardDescription>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            <div className="flex gap-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-border bg-transparent"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : currentStep === 3 ? "Create Account" : "Next"}
              </Button>
            </div>
          </form>

          {currentStep === 1 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full border-border hover:bg-muted bg-transparent"
                onClick={handleGoogleSignup}
                disabled={isLoading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
