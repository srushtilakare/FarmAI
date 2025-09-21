"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Camera, MapPin, TrendingUp, MessageSquare, Search, Filter, Download } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function HistoryPage() {
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const historyData = [
    {
      id: "1",
      type: "disease-detection",
      title: "Tomato Disease Analysis",
      description: "Late Blight detected in tomato crop with 92% confidence",
      date: "2024-01-15",
      time: "14:30",
      status: "completed",
      result: "Treatment recommended",
    },
    {
      id: "2",
      type: "crop-advisory",
      title: "Crop Recommendation",
      description: "Rice cultivation recommended for Kharif season",
      date: "2024-01-14",
      time: "10:15",
      status: "completed",
      result: "3 crops suggested",
    },
    {
      id: "3",
      type: "market-prices",
      title: "Price Alert",
      description: "Wheat prices increased by 5.7% in Delhi market",
      date: "2024-01-13",
      time: "09:45",
      status: "viewed",
      result: "Price update",
    },
    {
      id: "4",
      type: "chat",
      title: "Chat with Farmii",
      description: "Discussion about soil health and fertilizer recommendations",
      date: "2024-01-12",
      time: "16:20",
      status: "completed",
      result: "Guidance provided",
    },
    {
      id: "5",
      type: "weather-alerts",
      title: "Weather Alert",
      description: "Heavy rainfall warning for next 3 days",
      date: "2024-01-11",
      time: "08:00",
      status: "active",
      result: "Alert active",
    },
  ]

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "disease-detection":
        return <Camera className="h-4 w-4" />
      case "crop-advisory":
        return <MapPin className="h-4 w-4" />
      case "market-prices":
        return <TrendingUp className="h-4 w-4" />
      case "chat":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "disease-detection":
        return "bg-red-500"
      case "crop-advisory":
        return "bg-green-500"
      case "market-prices":
        return "bg-purple-500"
      case "chat":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>
      case "active":
        return <Badge variant="secondary">Active</Badge>
      case "viewed":
        return <Badge variant="outline">Viewed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredHistory = historyData.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activity History</h1>
            <p className="text-muted-foreground mt-2">View your past activities and interactions with Farm AI</p>
          </div>
          <Button variant="outline" className="border-border bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            Export History
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filter Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Activity Type</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder="All activities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activities</SelectItem>
                    <SelectItem value="disease-detection">Disease Detection</SelectItem>
                    <SelectItem value="crop-advisory">Crop Advisory</SelectItem>
                    <SelectItem value="market-prices">Market Prices</SelectItem>
                    <SelectItem value="chat">Chat Sessions</SelectItem>
                    <SelectItem value="weather-alerts">Weather Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Date Range</label>
                <Select defaultValue="week">
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <Card key={item.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${getTypeColor(item.type)} text-white flex-shrink-0`}>
                    {getTypeIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-card-foreground truncate">{item.title}</h3>
                      {getStatusBadge(item.status)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <span>{item.time}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.result}</span>
                        <Button variant="outline" size="sm" className="border-border bg-transparent">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredHistory.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No activities found for the selected filters.</p>
              <Button
                variant="outline"
                className="border-border bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setFilterType("all")
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">12</div>
              <div className="text-sm text-muted-foreground">Disease Scans</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">8</div>
              <div className="text-sm text-muted-foreground">Crop Advisories</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">25</div>
              <div className="text-sm text-muted-foreground">Chat Sessions</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">15</div>
              <div className="text-sm text-muted-foreground">Price Alerts</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
