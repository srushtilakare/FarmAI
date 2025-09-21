"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUp, TrendingDown, Search, MapPin, Calendar, RefreshCw } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function MarketPricesPage() {
  const [selectedState, setSelectedState] = useState("all")
  const [selectedCrop, setSelectedCrop] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const marketData = [
    {
      crop: "Rice",
      variety: "Basmati",
      currentPrice: 2800,
      previousPrice: 2650,
      change: 5.7,
      market: "Delhi",
      date: "2024-01-15",
      unit: "per quintal",
    },
    {
      crop: "Wheat",
      variety: "HD-2967",
      currentPrice: 2200,
      previousPrice: 2300,
      change: -4.3,
      market: "Punjab",
      date: "2024-01-15",
      unit: "per quintal",
    },
    {
      crop: "Cotton",
      variety: "Medium Staple",
      currentPrice: 5800,
      previousPrice: 5600,
      change: 3.6,
      market: "Gujarat",
      date: "2024-01-15",
      unit: "per quintal",
    },
    {
      crop: "Sugarcane",
      variety: "Co-86032",
      currentPrice: 350,
      previousPrice: 340,
      change: 2.9,
      market: "Maharashtra",
      date: "2024-01-15",
      unit: "per quintal",
    },
    {
      crop: "Tomato",
      variety: "Hybrid",
      currentPrice: 1200,
      previousPrice: 1500,
      change: -20.0,
      market: "Karnataka",
      date: "2024-01-15",
      unit: "per quintal",
    },
    {
      crop: "Onion",
      variety: "Red",
      currentPrice: 800,
      previousPrice: 750,
      change: 6.7,
      market: "Maharashtra",
      date: "2024-01-15",
      unit: "per quintal",
    },
  ]

  const filteredData = marketData.filter((item) => {
    const matchesSearch =
      item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.variety.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesState = selectedState === "all" || item.market.toLowerCase().includes(selectedState.toLowerCase())
    const matchesCrop = selectedCrop === "all" || item.crop.toLowerCase() === selectedCrop.toLowerCase()

    return matchesSearch && matchesState && matchesCrop
  })

  const getPriceChangeColor = (change: number) => {
    if (change > 0) return "text-green-600"
    if (change < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getPriceChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Market Price Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Stay updated with real-time market prices and trends for better selling decisions
          </p>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Search Crop</label>
                <Input
                  placeholder="Search by crop name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-border focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">State/Market</label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    <SelectItem value="punjab">Punjab</SelectItem>
                    <SelectItem value="maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="gujarat">Gujarat</SelectItem>
                    <SelectItem value="karnataka">Karnataka</SelectItem>
                    <SelectItem value="delhi">Delhi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Crop Type</label>
                <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="All crops" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Crops</SelectItem>
                    <SelectItem value="rice">Rice</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="cotton">Cotton</SelectItem>
                    <SelectItem value="sugarcane">Sugarcane</SelectItem>
                    <SelectItem value="tomato">Tomato</SelectItem>
                    <SelectItem value="onion">Onion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Actions</label>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Prices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Prices Grid */}
        <div className="grid gap-4">
          {filteredData.map((item, index) => (
            <Card key={index} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground">{item.crop}</h3>
                      <Badge variant="outline">{item.variety}</Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{item.market}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">₹{item.currentPrice.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">{item.unit}</div>

                    <div className={`flex items-center justify-end gap-1 mt-1 ${getPriceChangeColor(item.change)}`}>
                      {getPriceChangeIcon(item.change)}
                      <span className="text-sm font-medium">
                        {item.change > 0 ? "+" : ""}
                        {item.change.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground mt-1">
                      Previous: ₹{item.previousPrice.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredData.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No market data found for the selected filters.</p>
              <Button
                variant="outline"
                className="mt-4 border-border bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setSelectedState("all")
                  setSelectedCrop("all")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Market Insights */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Market Insights</CardTitle>
            <CardDescription>Key trends and recommendations for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-card-foreground mb-3">Price Gainers</h4>
                <div className="space-y-2">
                  {filteredData
                    .filter((item) => item.change > 0)
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 3)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-green-800">{item.crop}</span>
                        <span className="text-sm text-green-600">+{item.change.toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-card-foreground mb-3">Price Decliners</h4>
                <div className="space-y-2">
                  {filteredData
                    .filter((item) => item.change < 0)
                    .sort((a, b) => a.change - b.change)
                    .slice(0, 3)
                    .map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium text-red-800">{item.crop}</span>
                        <span className="text-sm text-red-600">{item.change.toFixed(1)}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
