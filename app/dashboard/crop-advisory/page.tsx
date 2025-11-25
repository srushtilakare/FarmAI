//ui for crop advisory

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Thermometer, Droplets, Calendar, TrendingUp, Leaf, Sun } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function CropAdvisoryPage() {
  const { t } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<any>(null)
  const [formData, setFormData] = useState({
    location: "",
    soilType: "",
    season: "",
    farmSize: "",
    irrigationType: "",
    budget: "",
  })

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // Log activity for crop advisory (don't await - fire and forget)
    const logActivity = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          console.warn('⚠️ No token found, skipping crop advisory activity log')
          return
        }
        
        // Build description - ensure it's always non-empty
        const locationPart = formData.location ? ` for ${formData.location}` : ''
        const soilPart = formData.soilType ? ` with ${formData.soilType} soil` : ''
        const seasonPart = formData.season ? ` in ${formData.season} season` : ''
        const description = `Requested crop advisory${locationPart}${soilPart}${seasonPart}`.trim() || 'Requested crop advisory recommendations'
        
        // Build title
        const title = formData.location 
          ? `Crop Advisory Request - ${formData.location}`
          : 'Crop Advisory Request'
        
        console.log('📊 Logging crop advisory activity...', {
          location: formData.location,
          soilType: formData.soilType,
          season: formData.season,
          title,
          description
        })
        
        const response = await fetch('http://localhost:5000/api/activities/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            activityType: 'crop-advisory',
            title: title,
            description: description,
            status: 'completed',
            result: 'Recommendations generated',
            metadata: {
              location: formData.location || '',
              soilType: formData.soilType || '',
              season: formData.season || '',
              farmSize: formData.farmSize || '',
              irrigationType: formData.irrigationType || '',
              budget: formData.budget || ''
            }
          })
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }
          console.error('❌ Failed to log crop advisory activity:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          })
          return
        }
        
        const data = await response.json()
        console.log('✅ Crop advisory activity logged successfully:', data)
      } catch (err) {
        console.error('❌ Error logging crop advisory activity:', err)
      }
    }
    
    // Start logging (don't block UI)
    logActivity()
    
    // Simulate analysis
    setTimeout(() => {
      setRecommendations({
        primaryCrops: [
          {
            name: "Rice",
            suitability: 95,
            expectedYield: "4-5 tons/hectare",
            profitability: "High",
            season: "Kharif",
            waterRequirement: "High",
            marketDemand: "Excellent",
          },
          {
            name: "Wheat",
            suitability: 88,
            expectedYield: "3-4 tons/hectare",
            profitability: "Medium",
            season: "Rabi",
            waterRequirement: "Medium",
            marketDemand: "Good",
          },
          {
            name: "Sugarcane",
            suitability: 82,
            expectedYield: "60-80 tons/hectare",
            profitability: "High",
            season: "Annual",
            waterRequirement: "Very High",
            marketDemand: "Stable",
          },
        ],
        weatherInsights: {
          temperature: "25-32°C",
          rainfall: "Expected 800-1200mm",
          humidity: "65-75%",
          recommendation: "Ideal conditions for rice cultivation",
        },
        soilRecommendations: [
          "Apply 2-3 tons of organic manure per hectare",
          "Maintain soil pH between 6.0-7.0",
          "Ensure proper drainage during monsoon",
          "Consider crop rotation with legumes",
        ],
      })
      setIsAnalyzing(false)
    }, 3000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("locationSpecificCropAdvisory")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("getPersonalizedRecommendations")}
          </p>
        </div>

        {/* Input Form */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("farmInformation")}</CardTitle>
            <CardDescription>{t("provideDetailsForRecommendations")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">
                  {t("locationDistrictState")}
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder={t("locationPlaceholder")}
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilType" className="text-foreground">
                  {t("soilType")}
                </Label>
                <Select
                  value={formData.soilType}
                  onValueChange={(value) => setFormData({ ...formData, soilType: value })}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder={t("selectSoilType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">{t("claySoil")}</SelectItem>
                    <SelectItem value="loamy">{t("loamySoil")}</SelectItem>
                    <SelectItem value="sandy">{t("sandySoil")}</SelectItem>
                    <SelectItem value="black">{t("blackSoil")}</SelectItem>
                    <SelectItem value="red">{t("redSoil")}</SelectItem>
                    <SelectItem value="alluvial">{t("alluvialSoil")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="text-foreground">
                  {t("plantingSeason")}
                </Label>
                <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder={t("selectSeason")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kharif">{t("kharifMonsoon")}</SelectItem>
                    <SelectItem value="rabi">{t("rabiWinter")}</SelectItem>
                    <SelectItem value="zaid">{t("zaidSummer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize" className="text-foreground">
                  {t("farmSizeAcres")}
                </Label>
                <Input
                  id="farmSize"
                  type="number"
                  placeholder={t("farmSizePlaceholder")}
                  value={formData.farmSize}
                  onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="irrigationType" className="text-foreground">
                  {t("irrigationType")}
                </Label>
                <Select
                  value={formData.irrigationType}
                  onValueChange={(value) => setFormData({ ...formData, irrigationType: value })}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder={t("selectIrrigationType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">{t("dripIrrigation")}</SelectItem>
                    <SelectItem value="sprinkler">{t("sprinkler")}</SelectItem>
                    <SelectItem value="flood">{t("floodIrrigation")}</SelectItem>
                    <SelectItem value="rainfed">{t("rainfed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-foreground">
                  {t("budgetRange")}
                </Label>
                <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder={t("selectBudgetRange")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("budgetLow")}</SelectItem>
                    <SelectItem value="medium">{t("budgetMedium")}</SelectItem>
                    <SelectItem value="high">{t("budgetHigh")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                onClick={handleAnalyze}
                disabled={!formData.location || !formData.soilType || isAnalyzing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
              >
                {isAnalyzing ? t("analyzing") : t("getRecommendations")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {recommendations && (
          <div className="space-y-6">
            {/* Weather Insights */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  {t("weatherInsights")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("temperature")}</p>
                      <p className="font-medium">{recommendations.weatherInsights.temperature}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("rainfall")}</p>
                      <p className="font-medium">{recommendations.weatherInsights.rainfall}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("humidity")}</p>
                      <p className="font-medium">{recommendations.weatherInsights.humidity}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("bestSeason")}</p>
                      <p className="font-medium">Kharif</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">{recommendations.weatherInsights.recommendation}</p>
                </div>
              </CardContent>
            </Card>

            {/* Crop Recommendations */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  {t("recommendedCrops")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recommendations.primaryCrops.map((crop: any, index: number) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-card-foreground">{crop.name}</h3>
                        <Badge variant="secondary">{crop.suitability}% {t("suitable")}</Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{t("expectedYield")}</p>
                          <p className="font-medium text-foreground">{crop.expectedYield}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("profitability")}</p>
                          <Badge variant={crop.profitability === "High" ? "default" : "secondary"}>
                            {crop.profitability}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("waterRequirement")}</p>
                          <p className="font-medium text-foreground">{crop.waterRequirement}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("season")}</p>
                          <p className="font-medium text-foreground">{crop.season}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t("marketDemand")}</p>
                          <Badge variant="outline">{crop.marketDemand}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Soil Recommendations */}
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  {t("soilManagementTips")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recommendations.soilRecommendations.map((tip: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="bg-primary/10 rounded-full p-1 mt-1">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      </div>
                      <span className="text-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
