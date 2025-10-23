"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const FarmiiChat: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "auto";
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        sendMessage(transcript);
      };
    }
  }, []);

  // Send message to backend
  const sendMessage = async (msg?: string) => {
    const message = msg || input;
    if (!message.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInput("");

    try {
      const res = await axios.post("http://localhost:5000/farmii/chat", { message });
      const reply = res.data.reply || "Sorry, I didn’t get that.";

      setMessages((prev) => [...prev, { sender: "farmii", text: reply }]);

      // Speak the reply
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.lang = "hi-IN"; // You can change this dynamically
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "farmii", text: "Server error. Please try again." },
      ]);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      setListening(false);
      recognitionRef.current.stop();
    }
  };

  return (
    <div className="p-4 bg-green-50 rounded-2xl shadow-lg w-full max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-semibold text-green-800 text-center mb-4">
        🌾 Farmii - Your Smart Farming Assistant
      </h2>

      <div className="h-80 overflow-y-auto bg-white p-3 rounded-md mb-4 border border-green-200">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`my-2 ${
              msg.sender === "user" ? "text-right" : "text-left text-green-700"
            }`}
          >
            <strong>{msg.sender === "user" ? "You: " : "Farmii: "}</strong>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Farmii anything..."
          className="flex-1 border border-green-400 p-2 rounded-lg"
        />
        <button
          onClick={() => sendMessage()}
          className="bg-green-600 text-white px-4 rounded-lg"
        >
          Send
        </button>
      </div>

      <div className="mt-4 text-center">
        {!listening ? (
          <button
            onClick={startListening}
            className="bg-yellow-400 text-white px-4 py-2 rounded-lg"
          >
            🎤 Speak
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            🛑 Stop
          </button>
        )}
      </div>
    </div>
  );
};

export default FarmiiChat;
