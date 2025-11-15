"use client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Check, Volume2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function LanguagePage() {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);

  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  const languages = [
    { code: "english", name: "English", nativeName: "English", flag: "🇺🇸", speakers: "Global" },
    { code: "hindi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳", speakers: "500M+ speakers" },
    { code: "marathi", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", speakers: "83M+ speakers" }
  ];

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setLanguage(languageCode);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t("languageSettings")}</h1>
          <p className="text-muted-foreground mt-2">{t("selectLanguage")}</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t("currentLanguage")}
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

        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t("availableLanguages")}</CardTitle>
            <CardDescription>{t("selectLanguage")}</CardDescription>
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
                      <h3 className="font-medium text-foreground">{language.name}</h3>
                      <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                      <p className="text-xs text-muted-foreground">{language.speakers}</p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && <Check className="h-5 w-5 text-primary" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3"
            onClick={() => setLanguage(selectedLanguage)}
          >
            {t("savePreference")}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
