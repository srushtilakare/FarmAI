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

export default function CropAdvisoryPage() {
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

  const handleAnalyze = () => {
    setIsAnalyzing(true)
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
          <h1 className="text-3xl font-bold text-foreground">Location Specific Crop Advisory</h1>
          <p className="text-muted-foreground mt-2">
            Get personalized crop recommendations based on your location, soil type, and farming conditions
          </p>
        </div>

        {/* Input Form */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Farm Information</CardTitle>
            <CardDescription>Provide details about your farm for personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">
                  Location (District, State)
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g., Pune, Maharashtra"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="soilType" className="text-foreground">
                  Soil Type
                </Label>
                <Select
                  value={formData.soilType}
                  onValueChange={(value) => setFormData({ ...formData, soilType: value })}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clay">Clay Soil</SelectItem>
                    <SelectItem value="loamy">Loamy Soil</SelectItem>
                    <SelectItem value="sandy">Sandy Soil</SelectItem>
                    <SelectItem value="black">Black Soil</SelectItem>
                    <SelectItem value="red">Red Soil</SelectItem>
                    <SelectItem value="alluvial">Alluvial Soil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="season" className="text-foreground">
                  Planting Season
                </Label>
                <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="Select season" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kharif">Kharif (Monsoon)</SelectItem>
                    <SelectItem value="rabi">Rabi (Winter)</SelectItem>
                    <SelectItem value="zaid">Zaid (Summer)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="farmSize" className="text-foreground">
                  Farm Size (acres)
                </Label>
                <Input
                  id="farmSize"
                  type="number"
                  placeholder="e.g., 2.5"
                  value={formData.farmSize}
                  onChange={(e) => setFormData({ ...formData, farmSize: e.target.value })}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="irrigationType" className="text-foreground">
                  Irrigation Type
                </Label>
                <Select
                  value={formData.irrigationType}
                  onValueChange={(value) => setFormData({ ...formData, irrigationType: value })}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="Select irrigation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drip">Drip Irrigation</SelectItem>
                    <SelectItem value="sprinkler">Sprinkler</SelectItem>
                    <SelectItem value="flood">Flood Irrigation</SelectItem>
                    <SelectItem value="rainfed">Rain-fed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget" className="text-foreground">
                  Budget Range (₹)
                </Label>
                <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="Select budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">₹10,000 - ₹50,000</SelectItem>
                    <SelectItem value="medium">₹50,000 - ₹1,00,000</SelectItem>
                    <SelectItem value="high">₹1,00,000+</SelectItem>
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
                {isAnalyzing ? "Analyzing..." : "Get Recommendations"}
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
                  Weather Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="font-medium">{recommendations.weatherInsights.temperature}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rainfall</p>
                      <p className="font-medium">{recommendations.weatherInsights.rainfall}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-cyan-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="font-medium">{recommendations.weatherInsights.humidity}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Best Season</p>
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
                  Recommended Crops
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {recommendations.primaryCrops.map((crop: any, index: number) => (
                    <div key={index} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-card-foreground">{crop.name}</h3>
                        <Badge variant="secondary">{crop.suitability}% suitable</Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Yield</p>
                          <p className="font-medium text-foreground">{crop.expectedYield}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Profitability</p>
                          <Badge variant={crop.profitability === "High" ? "default" : "secondary"}>
                            {crop.profitability}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Water Requirement</p>
                          <p className="font-medium text-foreground">{crop.waterRequirement}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Season</p>
                          <p className="font-medium text-foreground">{crop.season}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Market Demand</p>
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
                  Soil Management Tips
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
