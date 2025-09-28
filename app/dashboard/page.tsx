 "use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Camera,
  MapPin,
  Beaker,
  CloudRain,
  TrendingUp,
  Mic,
  MessageSquare,
  Thermometer,
  Droplets,
  Sun,
  Wind,
} from "lucide-react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function DashboardPage() {
  const [weatherData] = useState({
    temperature: "28°C",
    humidity: "65%",
    rainfall: "12mm",
    windSpeed: "8 km/h",
  })

  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    // Fetch user from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const services = [
    {
      id: "disease-detection",
      title: "Crop Disease Detection",
      description: "AI-powered disease identification with instant treatment recommendations",
      icon: Camera,
      color: "bg-red-500",
      href: "/dashboard/disease-detection",
    },
    {
      id: "crop-advisory",
      title: "Location Specific Crop Advisory",
      description: "Get personalized crop recommendations based on your location and soil",
      icon: MapPin,
      color: "bg-green-500",
      href: "/dashboard/crop-advisory",
    },
    {
      id: "soil-health",
      title: "Soil Health & Fertilizer Guidance",
      description: "Comprehensive soil analysis and fertilizer recommendations",
      icon: Beaker,
      color: "bg-amber-500",
      href: "/dashboard/soil-health",
    },
    {
      id: "weather-alerts",
      title: "Weather-based Alerts",
      description: "Real-time weather updates and predictive insights for farming",
      icon: CloudRain,
      color: "bg-blue-500",
      href: "/dashboard/weather-alerts",
    },
    {
      id: "market-prices",
      title: "Market Price Tracking",
      description: "Live market prices and trends for better selling decisions",
      icon: TrendingUp,
      color: "bg-purple-500",
      href: "/dashboard/market-prices",
    },
    {
      id: "voice-support",
      title: "Voice Support",
      description: "Voice-enabled assistance for low-literate users",
      icon: Mic,
      color: "bg-indigo-500",
      href: "/dashboard/voice-support",
    },
  ]

  const recentActivities = [
    { action: "Disease detected in tomato crop", time: "2 hours ago", status: "warning" },
    { action: "Weather alert: Heavy rain expected", time: "4 hours ago", status: "info" },
    { action: "Market price update for wheat", time: "6 hours ago", status: "success" },
    { action: "Soil test results available", time: "1 day ago", status: "info" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {user ? `Welcome back, ${user.fullName}!` : "Welcome back, Farmer!"}
            </h1>
            <p className="text-muted-foreground">
              {"Here's what's happening with your farm today"}
            </p>
          </div>

          {/* Weather Widget */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sun className="h-5 w-5 text-yellow-500" />
                Today's Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">{weatherData.temperature}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{weatherData.humidity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CloudRain className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{weatherData.rainfall}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{weatherData.windSpeed}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = service.icon
              return (
                <Link key={service.id} href={service.href}>
                  <Card className="border-border hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4 h-full">
                      <div
                        className={`p-4 rounded-full ${service.color} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <div className="space-y-2 flex-1">
                        <h3 className="text-lg font-semibold text-card-foreground group-hover:text-primary transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border group-hover:border-primary group-hover:text-primary transition-colors bg-transparent"
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Recent Activities</h2>
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.status === "warning"
                            ? "bg-yellow-500"
                            : activity.status === "success"
                              ? "bg-green-500"
                              : "bg-blue-500"
                        }`}
                      />
                      <span className="text-sm text-foreground">{activity.action}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/chat">
              <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-card-foreground">Talk with Farmii</h3>
                    <p className="text-sm text-muted-foreground">Get instant AI assistance</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/voice-support">
              <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center space-x-3">
                  <Mic className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-card-foreground">Voice Assistant</h3>
                    <p className="text-sm text-muted-foreground">Speak your queries</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/dashboard/history">
              <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center space-x-3">
                  <TrendingUp className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium text-card-foreground">View History</h3>
                    <p className="text-sm text-muted-foreground">Check past activities</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
