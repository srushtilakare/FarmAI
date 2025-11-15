"use client";
import { createContext, useContext, useState, useEffect } from "react";
import en from "@/lib/i18n/locales/en.json";
import hi from "@/lib/i18n/locales/hi.json";
import mr from "@/lib/i18n/locales/mr.json";

const translations: any = { english: en, hindi: hi, marathi: mr };

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState("english");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") || "english";
    setLanguage(savedLang);
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
