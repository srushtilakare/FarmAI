"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Settings, Bell, Globe, Shield, Smartphone, Mail, MessageSquare, Save } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

// 🧩 Import language context
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()

  const [settings, setSettings] = useState({
    language: language || "english",
    notifications: {
      email: true,
      sms: true,
      push: true,
      weatherAlerts: true,
      priceAlerts: true,
      diseaseAlerts: true,
      marketUpdates: false,
    },
    privacy: {
      shareData: false,
      publicProfile: false,
      locationTracking: true,
    },
    communication: {
      voiceEnabled: true,
      autoTranslate: true,
      offlineMode: false,
    },
  })

  // Sync with global language
  useEffect(() => {
    setSettings((prev) => ({ ...prev, language }))
  }, [language])

  const handleSave = () => {
    console.log("Settings saved:", settings)
    setLanguage(settings.language) // 🔁 Update global language context
  }

  const updateNotificationSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }))
  }

  const updatePrivacySetting = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }))
  }

  const updateCommunicationSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      communication: {
        ...prev.communication,
        [key]: value,
      },
    }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t("settings")}</h1>
            <p className="text-muted-foreground mt-2">{t("customizeExperience")}</p>
          </div>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4 mr-2" />
            {t("saveChanges")}
          </Button>
        </div>

        {/* Language & Region */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("languageRegion")}
            </CardTitle>
            <CardDescription>{t("selectLanguage")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language" className="text-foreground">
                  {t("displayLanguage")}
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => setSettings((prev) => ({ ...prev, language: value }))}
                >
                  <SelectTrigger className="border-border focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">हिंदी (Hindi)</SelectItem>
                    <SelectItem value="marathi">मराठी (Marathi)</SelectItem>
                    <SelectItem value="gujarati">ગુજરાતી (Gujarati)</SelectItem>
                    <SelectItem value="tamil">தமிழ் (Tamil)</SelectItem>
                    <SelectItem value="telugu">తెలుగు (Telugu)</SelectItem>
                    <SelectItem value="kannada">ಕನ್ನಡ (Kannada)</SelectItem>
                    <SelectItem value="bengali">বাংলা (Bengali)</SelectItem>
                    <SelectItem value="punjabi">ਪੰਜਾਬੀ (Punjabi)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Choose how you want to receive updates and alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-foreground mb-4">Notification Channels</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateNotificationSetting("email", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">SMS Notifications</p>
                      <p className="text-xs text-muted-foreground">Get alerts via text messages</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.sms}
                    onCheckedChange={(checked) => updateNotificationSetting("sms", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive notifications on your device</p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateNotificationSetting("push", checked)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium text-foreground mb-4">Alert Types</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weather Alerts</p>
                    <p className="text-xs text-muted-foreground">Severe weather warnings and forecasts</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weatherAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("weatherAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Price Alerts</p>
                    <p className="text-xs text-muted-foreground">Market price changes for your crops</p>
                  </div>
                  <Switch
                    checked={settings.notifications.priceAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("priceAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Disease Alerts</p>
                    <p className="text-xs text-muted-foreground">Crop disease outbreaks in your area</p>
                  </div>
                  <Switch
                    checked={settings.notifications.diseaseAlerts}
                    onCheckedChange={(checked) => updateNotificationSetting("diseaseAlerts", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Market Updates</p>
                    <p className="text-xs text-muted-foreground">Weekly market trends and insights</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketUpdates}
                    onCheckedChange={(checked) => updateNotificationSetting("marketUpdates", checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Control your data sharing and privacy preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Share Anonymous Data</p>
                <p className="text-xs text-muted-foreground">
                  Help improve our services by sharing anonymous usage data
                </p>
              </div>
              <Switch
                checked={settings.privacy.shareData}
                onCheckedChange={(checked) => updatePrivacySetting("shareData", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Public Profile</p>
                <p className="text-xs text-muted-foreground">
                  Make your farming achievements visible to other farmers
                </p>
              </div>
              <Switch
                checked={settings.privacy.publicProfile}
                onCheckedChange={(checked) => updatePrivacySetting("publicProfile", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Location Tracking</p>
                <p className="text-xs text-muted-foreground">
                  Allow location-based recommendations and weather alerts
                </p>
              </div>
              <Switch
                checked={settings.privacy.locationTracking}
                onCheckedChange={(checked) => updatePrivacySetting("locationTracking", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Communication Preferences */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Communication Preferences
            </CardTitle>
            <CardDescription>Customize how you interact with Farm AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Voice Input</p>
                <p className="text-xs text-muted-foreground">Enable voice commands and speech recognition</p>
              </div>
              <Switch
                checked={settings.communication.voiceEnabled}
                onCheckedChange={(checked) => updateCommunicationSetting("voiceEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-translate</p>
                <p className="text-xs text-muted-foreground">
                  Automatically translate content to your preferred language
                </p>
              </div>
              <Switch
                checked={settings.communication.autoTranslate}
                onCheckedChange={(checked) => updateCommunicationSetting("autoTranslate", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Offline Mode</p>
                <p className="text-xs text-muted-foreground">
                  Download content for offline access (requires more storage)
                </p>
              </div>
              <Switch
                checked={settings.communication.offlineMode}
                onCheckedChange={(checked) => updateCommunicationSetting("offlineMode", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account and data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" className="border-border bg-transparent">
                Export My Data
              </Button>
              <Button variant="outline" className="border-border bg-transparent">
                Reset Preferences
              </Button>
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
