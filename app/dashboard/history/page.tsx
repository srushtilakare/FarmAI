"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Camera, MapPin, TrendingUp, MessageSquare, Search, Filter, Download, Building2, Beaker, CloudRain, Newspaper, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface HistoryItem {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: string;
  result?: string;
  metadata?: any;
}

export default function HistoryPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [filterType, setFilterType] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [historyData, setHistoryData] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedActivity, setSelectedActivity] = useState<HistoryItem | null>(null)
  const [stats, setStats] = useState({
    diseaseDetections: 0,
    cropAdvisories: 0,
    communityForums: 0,
    soilReports: 0,
    chatSessions: 0,
    cropCalendar: 0
  })

  useEffect(() => {
    fetchHistory()
  }, [filterType])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        console.warn('⚠️ No token found, cannot fetch history')
        setHistoryData([])
        setLoading(false)
        return
      }
      
      const typeParam = filterType !== 'all' ? `&type=${filterType}` : ''
      console.log('📡 Fetching activities from:', `http://localhost:5000/api/activities?limit=100${typeParam}`)
      
      const response = await fetch(`http://localhost:5000/api/activities?limit=100${typeParam}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Activities response:', { 
          count: data.activities?.length || 0, 
          total: data.total,
          activities: data.activities 
        })
        setHistoryData(data.activities || [])
        
        // Fetch stats
        const statsResponse = await fetch('http://localhost:5000/api/activities/stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          console.log('📊 Stats response:', statsData)
          setStats({
            diseaseDetections: statsData.stats['disease-detection'] || 0,
            cropAdvisories: statsData.stats['crop-advisory'] || 0,
            communityForums: statsData.stats['community-forum'] || 0,
            soilReports: statsData.stats['soil-report'] || 0,
            chatSessions: statsData.stats['chat'] || 0,
            cropCalendar: statsData.stats['crop-calendar'] || 0
          })
        } else {
          const errorData = await statsResponse.json().catch(() => ({}))
          console.error('❌ Failed to fetch stats:', statsResponse.status, errorData)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Failed to fetch history:', response.status, errorData)
        // Fallback to empty array
        setHistoryData([])
      }
    } catch (error) {
      console.error('❌ Error fetching history:', error)
      setHistoryData([])
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "disease-detection":
        return <Camera className="h-4 w-4" />
      case "crop-advisory":
        return <MapPin className="h-4 w-4" />
      case "crop-calendar":
        return <Calendar className="h-4 w-4" />
      case "community-forum":
        return <MessageSquare className="h-4 w-4" />
      case "government-scheme":
        return <Building2 className="h-4 w-4" />
      case "soil-report":
        return <Beaker className="h-4 w-4" />
      case "weather-alert":
        return <CloudRain className="h-4 w-4" />
      case "market-prices":
        return <TrendingUp className="h-4 w-4" />
      case "agri-news":
        return <Newspaper className="h-4 w-4" />
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
      case "crop-calendar":
        return "bg-teal-500"
      case "community-forum":
        return "bg-indigo-500"
      case "government-scheme":
        return "bg-orange-500"
      case "soil-report":
        return "bg-amber-500"
      case "weather-alert":
        return "bg-blue-500"
      case "market-prices":
        return "bg-purple-500"
      case "agri-news":
        return "bg-cyan-500"
      case "chat":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">{t("completed")}</Badge>
      case "active":
        return <Badge variant="secondary">{t("active")}</Badge>
      case "viewed":
        return <Badge variant="outline">{t("viewed")}</Badge>
      default:
        return <Badge variant="outline">{t("unknown")}</Badge>
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
            <h1 className="text-3xl font-bold text-foreground">{t("activityHistory")}</h1>
            <p className="text-muted-foreground mt-2">{t("viewPastActivities")}</p>
          </div>
          <Button variant="outline" className="border-border bg-transparent">
            <Download className="h-4 w-4 mr-2" />
            {t("exportHistory")}
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              {t("filterActivities")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("search")}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("searchActivities")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("activityType")}</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue placeholder={t("allActivities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allActivities")}</SelectItem>
                    <SelectItem value="disease-detection">{t("diseaseDetection")}</SelectItem>
                    <SelectItem value="crop-advisory">{t("cropAdvisory")}</SelectItem>
                    <SelectItem value="crop-calendar">{t("cropCalendar")}</SelectItem>
                    <SelectItem value="community-forum">{t("communityForum")}</SelectItem>
                    <SelectItem value="government-scheme">{t("governmentScheme")}</SelectItem>
                    <SelectItem value="soil-report">{t("soilReport")}</SelectItem>
                    <SelectItem value="weather-alert">{t("weatherAlert")}</SelectItem>
                    <SelectItem value="market-prices">{t("marketPrices")}</SelectItem>
                    <SelectItem value="agri-news">{t("agriNews")}</SelectItem>
                    <SelectItem value="chat">{t("chatSessions")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("dateRange")}</label>
                <Select defaultValue="week">
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{t("today")}</SelectItem>
                    <SelectItem value="week">{t("thisWeek")}</SelectItem>
                    <SelectItem value="month">{t("thisMonth")}</SelectItem>
                    <SelectItem value="all">{t("allTime")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History List */}
        {loading ? (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-muted-foreground mt-4">{t("loadingHistory")}</p>
            </CardContent>
          </Card>
        ) : (
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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-border bg-transparent"
                          onClick={() => setSelectedActivity(item)}
                        >
                          {t("viewDetails")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {filteredHistory.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">{t("noActivitiesFound")}</p>
              <Button
                variant="outline"
                className="border-border bg-transparent"
                onClick={() => {
                  setSearchTerm("")
                  setFilterType("all")
                }}
              >
                {t("clearFilters")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.diseaseDetections}</div>
              <div className="text-sm text-muted-foreground">{t("cropDiseaseDetections")}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.cropAdvisories}</div>
              <div className="text-sm text-muted-foreground">{t("cropAdvisory")}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.communityForums}</div>
              <div className="text-sm text-muted-foreground">{t("communityForum")}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.soilReports}</div>
              <div className="text-sm text-muted-foreground">{t("soilReports")}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.chatSessions}</div>
              <div className="text-sm text-muted-foreground">{t("chatSessions")}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.cropCalendar}</div>
              <div className="text-sm text-muted-foreground">{t("cropCalendar")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Details Dialog */}
        <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedActivity && getTypeIcon(selectedActivity.type)}
                {selectedActivity?.title}
              </DialogTitle>
              <DialogDescription>
                {t("activityDetails")}
              </DialogDescription>
            </DialogHeader>
            
            {selectedActivity && (
              <div className="space-y-4 mt-4">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">{t("description")}</h4>
                  <p className="text-sm text-muted-foreground">{selectedActivity.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t("status")}</h4>
                    {getStatusBadge(selectedActivity.status)}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t("result")}</h4>
                    <p className="text-sm text-muted-foreground">{selectedActivity.result || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t("date")}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedActivity.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t("time")}</h4>
                    <p className="text-sm text-muted-foreground">{selectedActivity.time}</p>
                  </div>
                </div>

                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">{t("additionalInformation")}</h4>
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      {Object.entries(selectedActivity.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-foreground font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Navigate to related page based on activity type
                      const typeRoutes: { [key: string]: string } = {
                        'disease-detection': '/dashboard/disease-detection',
                        'crop-advisory': '/dashboard/crop-advisory',
                        'crop-calendar': '/dashboard/crop-calendar',
                        'community-forum': '/dashboard/community',
                        'government-scheme': '/dashboard/schemes',
                        'soil-report': '/dashboard/soil-report',
                        'weather-alert': '/dashboard/weather-alerts',
                        'market-prices': '/dashboard/market-prices',
                        'agri-news': '/dashboard/news',
                        'chat': '/dashboard/chat'
                      }
                      const route = typeRoutes[selectedActivity.type]
                      if (route) {
                        router.push(route)
                        setSelectedActivity(null)
                      }
                    }}
                    className="flex-1"
                  >
                    {t("goTo")} {selectedActivity.type.replace('-', ' ')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedActivity(null)}
                  >
                    {t("close")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
