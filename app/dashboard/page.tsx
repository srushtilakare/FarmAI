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
	const [city, setCity] = useState<string>("Pune"); // ✅ Default fallback city
	const [loading, setLoading] = useState(true);
	const [recentActivities, setRecentActivities] = useState<any[]>([]);
	const [activitiesLoading, setActivitiesLoading] = useState(true);

	const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY || "ebfcc89daac4187ada714518e13a3375";

	// ✅ Function to fetch weather
	const fetchWeather = async (cityName: string) => {
		try {
			const response = await fetch(
				`https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&units=metric`
			);
			const data = await response.json();

			if (data.cod === 200) {
				setWeatherData({
					temperature: `${data.main.temp}°C`,
					humidity: `${data.main.humidity}%`,
					rainfall: data.rain ? `${data.rain["1h"] || data.rain["3h"] || 0} mm` : "0 mm",
					windSpeed: `${data.wind.speed} km/h`,
				});
				setCity(data.name);
			} else {
				console.warn("Weather not found for city:", cityName);
			}
		} catch (error) {
			console.error("Error fetching weather:", error);
		} finally {
			setLoading(false);
		}
	};

	// ✅ On mount
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

		// ✅ If user not found or no farmLocation → Try geolocation
		if ("geolocation" in navigator) {
			navigator.geolocation.getCurrentPosition(
				async (pos) => {
					const { latitude, longitude } = pos.coords;
					try {
						const response = await fetch(
							`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`
						);
						const data = await response.json();
						if (data.name) {
							setCity(data.name);
							setWeatherData({
								temperature: `${data.main.temp}°C`,
								humidity: `${data.main.humidity}%`,
								rainfall: data.rain ? `${data.rain["1h"] || data.rain["3h"] || 0} mm` : "0 mm",
								windSpeed: `${data.wind.speed} km/h`,
							});
						} else {
							fetchWeather("Pune");
						}
					} catch {
						fetchWeather("Pune");
					}
				},
				() => fetchWeather("Pune")
			);
		} else {
			fetchWeather("Pune");
		}
	}, []); // Removed setUser from dependencies as it's not needed here

	// ✅ Fetch recent activities
	useEffect(() => {
		const fetchRecentActivities = async () => {
			try {
				setActivitiesLoading(true);
				const token = localStorage.getItem('token');
				
				if (!token) {
					console.warn('⚠️ No token found, cannot fetch recent activities');
					setRecentActivities([]);
					setActivitiesLoading(false);
					return;
				}
				
				const response = await fetch('http://localhost:5000/api/activities?limit=4', {
					headers: {
						Authorization: `Bearer ${token}`
					}
				});

				if (response.ok) {
					const data = await response.json();
					setRecentActivities(data.activities || []);
				} else {
					console.error('❌ Failed to fetch recent activities:', response.status);
					setRecentActivities([]);
				}
			} catch (error) {
				console.error('❌ Error fetching recent activities:', error);
				setRecentActivities([]);
			} finally {
				setActivitiesLoading(false);
			}
		};

		fetchRecentActivities();
	}, []);

	// ✅ Helper functions for activity display (similar to History section)
	const getTypeIcon = (type: string) => {
		switch (type) {
			case "disease-detection":
				return <Camera className="h-4 w-4" />;
			case "crop-advisory":
				return <MapPin className="h-4 w-4" />;
			case "crop-calendar":
				return <Calendar className="h-4 w-4" />;
			case "community-forum":
				return <MessageSquare className="h-4 w-4" />;
			case "government-scheme":
				return <Building2 className="h-4 w-4" />;
			case "soil-report":
				return <Beaker className="h-4 w-4" />;
			case "weather-alert":
				return <CloudRain className="h-4 w-4" />;
			case "market-prices":
				return <TrendingUp className="h-4 w-4" />;
			case "agri-news":
				return <Newspaper className="h-4 w-4" />;
			case "chat":
				return <MessageSquare className="h-4 w-4" />;
			default:
				return <Calendar className="h-4 w-4" />;
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
			case "chat":
				return "bg-blue-500";
			default:
				return "bg-gray-500";
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

	const formatTimeAgo = (dateString: string, timeString: string) => {
		try {
			const date = new Date(dateString);
			const now = new Date();
			const diffMs = now.getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 60000);
			const diffHours = Math.floor(diffMs / 3600000);
			const diffDays = Math.floor(diffMs / 86400000);

			if (diffMins < 1) return t("justNow");
			if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? t("minuteAgo") : t("minutesAgo")}`;
			if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? t("hourAgo") : t("hoursAgo")}`;
			if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? t("dayAgo") : t("daysAgo")}`;
			return new Date(dateString).toLocaleDateString();
		} catch {
			return timeString || t("recently");
		}
	};

	// ✅ Services data - All features matching sidebar navigation
	const services = [
		{
			id: "disease-detection",
			titleKey: "serviceDiseaseDetection",
			descriptionKey: "serviceDiseaseDetectionDesc",
			icon: Camera,
			color: "bg-red-500",
			href: "/dashboard/disease-detection",
		},
		{
			id: "crop-advisory",
			titleKey: "serviceCropAdvisory",
			descriptionKey: "serviceCropAdvisoryDesc",
			icon: MapPin,
			color: "bg-green-500",
			href: "/dashboard/crop-advisory",
		},
		{
			id: "crop-calendar",
			titleKey: "serviceCropCalendar",
			descriptionKey: "serviceCropCalendarDesc",
			icon: Calendar,
			color: "bg-teal-500",
			href: "/dashboard/crop-calendar",
		},
		{
			id: "community-forum",
			titleKey: "serviceCommunityForum",
			descriptionKey: "serviceCommunityForumDesc",
			icon: Users,
			color: "bg-indigo-500",
			href: "/dashboard/community",
		},
		{
			id: "government-schemes",
			titleKey: "serviceGovernmentSchemes",
			descriptionKey: "serviceGovernmentSchemesDesc",
			icon: Building2,
			color: "bg-orange-500",
			href: "/dashboard/schemes",
		},
		{
			id: "soil-health",
			titleKey: "serviceSoilHealth",
			descriptionKey: "serviceSoilHealthDesc",
			icon: Beaker,
			color: "bg-amber-500",
			href: "/dashboard/soil-report",
		},
		{
			id: "weather-alerts",
			titleKey: "serviceWeatherAlerts",
			descriptionKey: "serviceWeatherAlertsDesc",
			icon: CloudRain,
			color: "bg-blue-500",
			href: "/dashboard/weather-alerts",
		},
		{
			id: "market-prices",
			titleKey: "serviceMarketPrices",
			descriptionKey: "serviceMarketPricesDesc",
			icon: TrendingUp,
			color: "bg-purple-500",
			href: "/dashboard/market-prices",
		},
		{
			id: "agri-news",
			titleKey: "serviceAgriNews",
			descriptionKey: "serviceAgriNewsDesc",
			icon: Newspaper,
			color: "bg-cyan-500",
			href: "/dashboard/news",
		},
	];


	// ✅ JSX UI
	return (
		<DashboardLayout>
			<div className="space-y-8">
				{/* Welcome Section */}
				<div className="flex flex-col space-y-4">
					<div>
						<h1 className="text-3xl font-bold text-foreground">
							{user ? `${t("welcomeBack")}, ${user.fullName}!` : t("welcomeBackFarmer")}
						</h1>
						<p className="text-muted-foreground">
							{t("whatsHappening")}
						</p>
					</div>

					{/* Weather & Gamification Widgets */}
					<div className="grid md:grid-cols-2 gap-6">
					<Card className="border-border">
						<CardHeader className="pb-3">
							<CardTitle className="text-lg flex items-center gap-2">
								<Sun className="h-5 w-5 text-yellow-500" />
								{loading
									? t("fetchingWeather")
									: `${t("todaysWeather")} ${city ? t("inYourArea").replace("your area", city) : t("inYourArea")}`}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<p className="text-muted-foreground text-sm">{t("loadingWeatherData")}</p>
							) : (
									<div className="grid grid-cols-2 gap-4">
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
							)}
						</CardContent>
					</Card>
						
						{/* Gamification Widget */}
						<GamificationWidget />
					</div>
				</div>

				{/* Services Grid */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">{t("ourServices")}</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{services.map((service) => {
							const IconComponent = service.icon;
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
													{t(service.titleKey)}
												</h3>
												<p className="text-sm text-muted-foreground">{t(service.descriptionKey)}</p>
											</div>
											<Button
												variant="outline"
												size="sm"
												className="border-border group-hover:border-primary group-hover:text-primary transition-colors bg-transparent"
											>
												{t("getStarted")}
											</Button>
										</CardContent>
									</Card>
								</Link>
							);
						})}
					</div>
				</div>

				{/* Recent Activities */}
				<div>
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-semibold text-foreground">{t("recentActivities")}</h2>
						<Link href="/dashboard/history">
							<Button variant="outline" size="sm" className="border-border bg-transparent">
								{t("viewAll")}
							</Button>
						</Link>
					</div>
					<Card className="border-border">
						<CardContent className="p-6">
							{activitiesLoading ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
									<p className="text-muted-foreground mt-4 text-sm">{t("loadingActivities")}</p>
								</div>
							) : recentActivities.length === 0 ? (
								<div className="text-center py-8">
									<p className="text-muted-foreground">{t("noRecentActivities")}</p>
									<p className="text-muted-foreground text-sm mt-2">{t("startUsingFarmAI")}</p>
								</div>
							) : (
								<div className="space-y-4">
									{recentActivities.map((activity) => (
										<div
											key={activity.id}
											className="flex items-start gap-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
										>
											<div className={`p-2 rounded-full ${getTypeColor(activity.type)} text-white flex-shrink-0`}>
												{getTypeIcon(activity.type)}
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
													<h3 className="text-sm font-semibold text-card-foreground truncate">{activity.title}</h3>
													{getStatusBadge(activity.status)}
												</div>
												<p className="text-xs text-muted-foreground mb-2 line-clamp-1">{activity.description}</p>
												<div className="flex items-center gap-4 text-xs text-muted-foreground">
													<div className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														<span>{new Date(activity.date).toLocaleDateString()}</span>
													</div>
													<span>{formatTimeAgo(activity.date, activity.time)}</span>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Quick Actions */}
				<div>
					<h2 className="text-2xl font-semibold text-foreground mb-6">{t("quickActions")}</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Link href="/dashboard/chat">
							<Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
								<CardContent className="p-4 flex items-center space-x-3">
									<MessageSquare className="h-8 w-8 text-primary" />
									<div>
										<h3 className="font-medium text-card-foreground">{t("talkWithFarmii")}</h3>
										<p className="text-sm text-muted-foreground">{t("getInstantAIAssistance")}</p>
									</div>
								</CardContent>
							</Card>
						</Link>

						<Link href="/dashboard/voice-support">
							<Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
								<CardContent className="p-4 flex items-center space-x-3">
									<Mic className="h-8 w-8 text-primary" />
									<div>
										<h3 className="font-medium text-card-foreground">{t("voiceAssistant")}</h3>
										<p className="text-sm text-muted-foreground">{t("speakYourQueries")}</p>
									</div>
								</CardContent>
							</Card>
						</Link>

						<Link href="/dashboard/history">
							<Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
								<CardContent className="p-4 flex items-center space-x-3">
									<TrendingUp className="h-8 w-8 text-primary" />
									<div>
										<h3 className="font-medium text-card-foreground">{t("viewHistory")}</h3>
										<p className="text-sm text-muted-foreground">{t("checkPastActivities")}</p>
									</div>
								</CardContent>
							</Card>
						</Link>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}