"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  Users,
  Building2,
  Newspaper,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import GamificationWidget from "@/components/GamificationWidget";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DashboardPage() {
  const { t } = useLanguage();

  const [weatherData, setWeatherData] = useState({
    temperature: "--°C",
    humidity: "--%",
    rainfall: "--mm",
    windSpeed: "-- km/h",
  });
  const [user, setUser] = useState<any>(null);
  const [city, setCity] = useState<string>("Pune");
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "ebfcc89daac4187ada714518e13a3375";

  // fetch weather by city
  const fetchWeather = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          cityName
        )}&appid=${apiKey}&units=metric`
      );
      const data = await response.json();
      if (data.cod === 200) {
        setWeatherData({
          temperature: `${Math.round(data.main.temp)}°C`,
          humidity: `${data.main.humidity}%`,
          rainfall: data.rain ? `${data.rain["1h"] || data.rain["3h"] || 0} mm` : "0 mm",
          windSpeed: `${data.wind.speed} km/h`,
        });
        setCity(data.name);
      } else {
        // fallback quietly
        console.warn("Weather not found for city:", cityName);
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  };

  // init: load user & weather
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.farmLocation && parsedUser.farmLocation.trim() !== "") {
        fetchWeather(parsedUser.farmLocation);
        return;
      }
    }

    // if no farmLocation, try geolocation -> fallback to Pune
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
            );
            const data = await res.json();
            if (data.name) {
              setCity(data.name);
              setWeatherData({
                temperature: `${Math.round(data.main.temp)}°C`,
                humidity: `${data.main.humidity}%`,
                rainfall: data.rain ? `${data.rain["1h"] || data.rain["3h"] || 0} mm` : "0 mm",
                windSpeed: `${data.wind.speed} km/h`,
              });
            } else {
              fetchWeather("Pune");
            }
          } catch {
            fetchWeather("Pune");
          } finally {
            setLoading(false);
          }
        },
        () => {
          fetchWeather("Pune");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      fetchWeather("Pune");
    }
  }, []);

  // fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        setActivitiesLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setRecentActivities([]);
          setActivitiesLoading(false);
          return;
        }
        const response = await fetch("http://localhost:5000/api/activities?limit=6", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRecentActivities(data.activities || []);
        } else {
          console.error("Failed to fetch recent activities:", response.status);
          setRecentActivities([]);
        }
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        setRecentActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchRecentActivities();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "disease-detection":
        return <Camera className="h-5 w-5 text-white" />;
      case "crop-advisory":
        return <MapPin className="h-5 w-5 text-white" />;
      case "crop-calendar":
        return <Calendar className="h-5 w-5 text-white" />;
      case "community-forum":
        return <MessageSquare className="h-5 w-5 text-white" />;
      case "government-scheme":
        return <Building2 className="h-5 w-5 text-white" />;
      case "soil-report":
        return <Beaker className="h-5 w-5 text-white" />;
      case "weather-alert":
        return <CloudRain className="h-5 w-5 text-white" />;
      case "market-prices":
        return <TrendingUp className="h-5 w-5 text-white" />;
      case "agri-news":
        return <Newspaper className="h-5 w-5 text-white" />;
      default:
        return <Calendar className="h-5 w-5 text-white" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "disease-detection":
        return "bg-red-500";
      case "crop-advisory":
        return "bg-green-500";
      case "crop-calendar":
        return "bg-teal-500";
      case "community-forum":
        return "bg-indigo-500";
      case "government-scheme":
        return "bg-orange-500";
      case "soil-report":
        return "bg-amber-500";
      case "weather-alert":
        return "bg-blue-500";
      case "market-prices":
        return "bg-purple-500";
      case "agri-news":
        return "bg-cyan-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">{t("completed")}</Badge>;
      case "active":
        return <Badge variant="secondary">{t("active")}</Badge>;
      case "viewed":
        return <Badge variant="outline">{t("viewed")}</Badge>;
      default:
        return <Badge variant="outline">{t("unknown")}</Badge>;
    }
  };

  const formatTimeAgo = (dateString: string, timeString?: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return t("justNow") ?? "just now";
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? t("minuteAgo") : t("minutesAgo")}`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? t("hourAgo") : t("hoursAgo")}`;
      if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? t("dayAgo") : t("daysAgo")}`;
      return new Date(dateString).toLocaleDateString();
    } catch {
      return timeString || t("recently") || "recently";
    }
  };

  const services = [
    {
      id: "disease-detection",
      titleKey: "serviceDiseaseDetection",
      descriptionKey: "serviceDiseaseDetectionDesc",
      icon: Camera,
      color: "bg-red-50",
      circle: "bg-red-500",
      href: "/dashboard/disease-detection",
    },
    {
      id: "crop-advisory",
      titleKey: "serviceCropAdvisory",
      descriptionKey: "serviceCropAdvisoryDesc",
      icon: MapPin,
      color: "bg-green-50",
      circle: "bg-green-500",
      href: "/dashboard/crop-advisory",
    },
    {
      id: "crop-calendar",
      titleKey: "serviceCropCalendar",
      descriptionKey: "serviceCropCalendarDesc",
      icon: Calendar,
      color: "bg-teal-50",
      circle: "bg-teal-500",
      href: "/dashboard/crop-calendar",
    },
    {
      id: "community-forum",
      titleKey: "serviceCommunityForum",
      descriptionKey: "serviceCommunityForumDesc",
      icon: Users,
      color: "bg-indigo-50",
      circle: "bg-indigo-500",
      href: "/dashboard/community",
    },
    {
      id: "government-schemes",
      titleKey: "serviceGovernmentSchemes",
      descriptionKey: "serviceGovernmentSchemesDesc",
      icon: Building2,
      color: "bg-orange-50",
      circle: "bg-orange-500",
      href: "/dashboard/schemes",
    },
    {
      id: "soil-health",
      titleKey: "serviceSoilHealth",
      descriptionKey: "serviceSoilHealthDesc",
      icon: Beaker,
      color: "bg-amber-50",
      circle: "bg-amber-500",
      href: "/dashboard/soil-report",
    },
    {
      id: "weather-alerts",
      titleKey: "serviceWeatherAlerts",
      descriptionKey: "serviceWeatherAlertsDesc",
      icon: CloudRain,
      color: "bg-blue-50",
      circle: "bg-blue-500",
      href: "/dashboard/weather-alerts",
    },
    {
      id: "market-prices",
      titleKey: "serviceMarketPrices",
      descriptionKey: "serviceMarketPricesDesc",
      icon: TrendingUp,
      color: "bg-purple-50",
      circle: "bg-purple-500",
      href: "/dashboard/market-prices",
    },
    {
      id: "agri-news",
      titleKey: "serviceAgriNews",
      descriptionKey: "serviceAgriNewsDesc",
      icon: Newspaper,
      color: "bg-cyan-50",
      circle: "bg-cyan-500",
      href: "/dashboard/news",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">
              {user ? `${t("welcomeBack")}, ${user.fullName}!` : t("welcomeBackFarmer")}
            </h1>
            <p className="text-muted-foreground mt-1">{t("whatsHappening")}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground hidden sm:block">
              {t("lastUpdated")}: <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              {t("export")}
            </Button>
          </div>
        </div>

        {/* Weather + Gamification Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Weather Card */}
          <Card className="col-span-1 md:col-span-1 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-yellow-50">
                  <Sun className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{t("todaysWeather")}</CardTitle>
                  <p className="text-xs text-muted-foreground">{city}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{loading ? t("fetchingWeather") : ""}</div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-red-50">
                    <Thermometer className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{weatherData.temperature}</div>
                    <div className="text-xs text-muted-foreground">{t("temperature")}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-blue-50">
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{weatherData.humidity}</div>
                    <div className="text-xs text-muted-foreground">{t("humidity")}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-indigo-50">
                    <CloudRain className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{weatherData.rainfall}</div>
                    <div className="text-xs text-muted-foreground">{t("rainfall")}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-green-50">
                    <Wind className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{weatherData.windSpeed}</div>
                    <div className="text-xs text-muted-foreground">{t("windSpeed")}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gamification */}
          <div className="md:col-span-2">
            <GamificationWidget />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">{t("quickActions")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/dashboard/chat" className="block">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="rounded-lg p-3 bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-card-foreground">{t("talkWithFarmii")}</div>
                  <div className="text-sm text-muted-foreground">{t("getInstantAIAssistance")}</div>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="ghost">{t("open")}</Button>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/voice-support" className="block">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="rounded-lg p-3 bg-primary/10">
                  <Mic className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-card-foreground">{t("voiceAssistant")}</div>
                  <div className="text-sm text-muted-foreground">{t("speakYourQueries")}</div>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="ghost">{t("open")}</Button>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/history" className="block">
              <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="rounded-lg p-3 bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-card-foreground">{t("viewHistory")}</div>
                  <div className="text-sm text-muted-foreground">{t("checkPastActivities")}</div>
                </div>
                <div className="ml-auto">
                  <Button size="sm" variant="ghost">{t("open")}</Button>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">{t("ourServices")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => {
              const IconComponent = s.icon;
              return (
                <Link key={s.id} href={s.href} className="block">
                  <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                    <div className="flex items-start gap-4">
                      <div className={`rounded-full p-3 ${s.circle}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg text-card-foreground">{t(s.titleKey)}</div>
                        <div className="text-sm text-muted-foreground mt-1">{t(s.descriptionKey)}</div>
                      </div>
                    </div>
                    <div className="mt-4 ml-auto">
                      <Button size="sm" variant="outline">{t("getStarted")}</Button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">{t("recentActivities")}</h2>
            <Link href="/dashboard/history">
              <Button variant="outline" size="sm">{t("viewAll")}</Button>
            </Link>
          </div>

          <Card className="rounded-xl shadow-sm">
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto" />
                  <p className="text-muted-foreground mt-3">{t("loadingActivities")}</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t("noRecentActivities")}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t("startUsingFarmAI")}</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <div className={`flex-shrink-0 p-3 rounded-lg ${getTypeColor(activity.type)}`}>
                        {getTypeIcon(activity.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate text-card-foreground">{activity.title}</div>
                            <div className="text-xs text-muted-foreground truncate mt-1">{activity.description}</div>
                          </div>
                          <div className="ml-4">{getStatusBadge(activity.status)}</div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(activity.date).toLocaleDateString()}</span>
                          </div>
                          <div>{formatTimeAgo(activity.date, activity.time)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
