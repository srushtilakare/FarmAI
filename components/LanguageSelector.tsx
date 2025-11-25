"use client";
import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface LanguageSelectorProps {
  language?: string;
  setLanguage?: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language: propLanguage,
  setLanguage: propSetLanguage,
}) => {
  const { language: contextLanguage, setLanguage: contextSetLanguage, t } = useLanguage();
  const language = propLanguage || contextLanguage;
  const setLanguage = propSetLanguage || contextSetLanguage;

  return (
    <div className="language-selector">
      <label>{t("selectLanguage")}:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="english">English</option>
        <option value="hindi">हिंदी (Hindi)</option>
        <option value="marathi">मराठी (Marathi)</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
