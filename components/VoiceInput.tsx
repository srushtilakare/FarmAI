"use client";
import React, { useState } from "react";

interface VoiceInputProps {
  labelKey: string; // key to fetch translated label
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  language: string; // 'en-US', 'hi-IN', 'mr-IN'
  translations: { [key: string]: { [key: string]: string } }; // {labelKey: {lang: translation}}
  placeholder?: string;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  labelKey,
  name,
  value,
  onChange,
  language,
  translations,
  placeholder,
}) => {
  const [listening, setListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setListening(true);

    recognition.onresult = (event: any) => {
      const spokenText = event.results[0][0].transcript;
      onChange({ target: { name, value: spokenText } } as any);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  // Get label in selected language
  const labelText = translations[labelKey]?.[language] || labelKey;

  return (
    <div className="voice-input">
      <label>{labelText}</label>
      <div className="input-wrapper">
        <input
          type="text"
          name={name}
          value={value}
          placeholder={placeholder || labelText}
          onChange={onChange}
        />
        <button
          type="button"
          className={`voice-btn ${listening ? "listening" : ""}`}
          onClick={startListening}
        >
          {listening ? "🎙️" : "🎤"}
        </button>
      </div>
    </div>
  );
};

export default VoiceInput;
