"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, Check, Volume2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"

export default function LanguagePage() {
  const [selectedLanguage, setSelectedLanguage] = useState("english")

  const languages = [
    {
      code: "english",
      name: "English",
      nativeName: "English",
      flag: "🇺🇸",
      speakers: "Global",
      status: "complete",
    },
    {
      code: "hindi",
      name: "Hindi",
      nativeName: "हिंदी",
      flag: "🇮🇳",
      speakers: "500M+ speakers",
      status: "complete",
    },
    {
      code: "marathi",
      name: "Marathi",
      nativeName: "मराठी",
      flag: "🇮🇳",
      speakers: "83M+ speakers",
      status: "complete",
    },
    {
      code: "gujarati",
      name: "Gujarati",
      nativeName: "ગુજરાતી",
      flag: "🇮🇳",
      speakers: "56M+ speakers",
      status: "complete",
    },
    {
      code: "tamil",
      name: "Tamil",
      nativeName: "தமிழ்",
      flag: "🇮🇳",
      speakers: "75M+ speakers",
      status: "complete",
    },
    {
      code: "telugu",
      name: "Telugu",
      nativeName: "తెలుగు",
      flag: "🇮🇳",
      speakers: "82M+ speakers",
      status: "complete",
    },
    {
      code: "kannada",
      name: "Kannada",
      nativeName: "ಕನ್ನಡ",
      flag: "🇮🇳",
      speakers: "44M+ speakers",
      status: "complete",
    },
    {
      code: "bengali",
      name: "Bengali",
      nativeName: "বাংলা",
      flag: "🇮🇳",
      speakers: "230M+ speakers",
      status: "complete",
    },
    {
      code: "punjabi",
      name: "Punjabi",
      nativeName: "ਪੰਜਾਬੀ",
      flag: "🇮🇳",
      speakers: "113M+ speakers",
      status: "complete",
    },
  ]

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
    // Here you would typically update the app language
    console.log("Language changed to:", languageCode)
  }

  const playPronunciation = (languageCode: string) => {
    // Simulate playing pronunciation
    console.log("Playing pronunciation for:", languageCode)
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Language Settings</h1>
          <p className="text-muted-foreground mt-2">
            Choose your preferred language for the Farm AI interface and voice interactions
          </p>
        </div>

        {/* Current Language */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Current Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-4">
                <span className="text-2xl">{languages.find((lang) => lang.code === selectedLanguage)?.flag}</span>
                <div>
                  <h3 className="font-semibold text-foreground">
                    {languages.find((lang) => lang.code === selectedLanguage)?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {languages.find((lang) => lang.code === selectedLanguage)?.nativeName}
                  </p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Available Languages */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Available Languages</CardTitle>
            <CardDescription>Select your preferred language from the options below</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {languages.map((language) => (
                <div
                  key={language.code}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                    selectedLanguage === language.code
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleLanguageChange(language.code)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">{language.name}</h3>
                        {language.status === "complete" && (
                          <Badge variant="secondary" className="text-xs">
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                      <p className="text-xs text-muted-foreground">{language.speakers}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        playPronunciation(language.code)
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>

                    {selectedLanguage === language.code && <Check className="h-5 w-5 text-primary" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language Features */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Language Features</CardTitle>
            <CardDescription>What you get with multilingual support</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-card-foreground">Interface Translation</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Complete UI translation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Menu and navigation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Form labels and buttons
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Error messages and alerts
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-card-foreground">Voice & Content</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Voice commands in native language
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    AI responses in selected language
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Crop and disease names translation
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    Regional farming terminology
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-center">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
            onClick={() => {
              // Save language preference
              console.log("Language preference saved:", selectedLanguage)
            }}
          >
            Save Language Preference
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
