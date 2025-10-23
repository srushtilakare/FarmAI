"use client";
import React, { useState } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

interface MySpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript }) => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);

    recognition.onresult = (e: MySpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      onTranscript(text); // send to chatbot
    };

    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <button
      type="button"
      onClick={startListening}
      className={`px-3 py-2 rounded-lg text-white ${
        listening ? "bg-red-500" : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {listening ? "Listening..." : "🎤 Speak"}
    </button>
  );
};

export default VoiceInput;
