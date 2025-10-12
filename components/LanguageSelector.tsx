"use client";
import React from "react";

interface LanguageSelectorProps {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  language,
  setLanguage,
}) => {
  return (
    <div className="language-selector">
      <label>Select Language:</label>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en-US">English</option>
        <option value="hi-IN">Hindi</option>
        <option value="mr-IN">Marathi</option>
      </select>
    </div>
  );
};

export default LanguageSelector;
