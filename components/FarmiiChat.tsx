"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles } from "lucide-react";

interface FarmiiChatProps {
  initialOpen?: boolean;
}

const FarmiiChat: React.FC<FarmiiChatProps> = () => {
  const [messages, setMessages] = useState<{ sender: string; text: string; suggestions?: string[] }[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [farmer, setFarmer] = useState<any>(null);

  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Initialize profile & speech recognition
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setFarmer(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "auto";
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };
      recognitionRef.current.onerror = () => setListening(false);
      recognitionRef.current.onend = () => setListening(false);
    }

    setMessages([
      {
        sender: "farmii",
        text: "Namaste! I'm Farmii 🌱. How can I help your farm today?",
        suggestions: ["Tomato disease control", "Best fertilizer dose", "Weather advisory"],
      },
    ]);

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Send message to backend
  const sendMessage = async (msg?: string) => {
    const message = msg || input;
    if (!message.trim() || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        content: m.text,
      }));

      const res = await axios.post(
        `${apiBase}/api/chatbot`,
        {
          message,
          history: historyPayload,
          farmerProfile: farmer
            ? {
                fullName: farmer.fullName,
                farmLocation: farmer.farmLocation,
                state: farmer.state,
                district: farmer.district,
                crops: farmer.crops || [],
                farmingType: farmer.farmingType || "traditional",
              }
            : null,
        },
        { headers }
      );

      const reply = res.data.reply || "Advice recorded.";
      const suggestions = res.data.suggestedQuestions || [];

      setMessages((prev) => [...prev, { sender: "farmii", text: reply, suggestions }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "farmii", text: "I'm having trouble connecting to AI. Please try asking again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setListening(true);
      recognitionRef.current.start();
    }
  };

  const toggleSpeak = (idx: number, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 overflow-hidden w-full max-w-lg mx-auto flex flex-col h-[520px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-green-600 text-white p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Sparkles className="h-4 w-4 text-emerald-100" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Farmii Assistant</h3>
            <p className="text-2xs text-emerald-100">Personalized for {farmer?.fullName || "your farm"}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-white rounded-br-none"
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {msg.sender === "farmii" && (
                <div className="mt-1 pt-1 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => toggleSpeak(idx, msg.text)}
                    className="text-slate-400 hover:text-emerald-700 transition-colors"
                  >
                    {speakingIdx === idx ? (
                      <VolumeX className="h-3 w-3 text-red-500 animate-pulse" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {msg.suggestions.map((s, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => sendMessage(s)}
                    className="text-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full px-2.5 py-0.5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 w-fit">
            <span>Farmii is typing</span>
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} />
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
          </div>
        )}

        <div ref={chatScrollRef} />
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask Farmii anything..."
            className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={toggleListening}
            className={`p-2 rounded-xl transition-colors ${
              listening ? "bg-red-50 text-red-600 animate-pulse" : "text-slate-400 hover:text-emerald-700 bg-slate-50"
            }`}
            title="Voice input"
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shadow-2xs disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmiiChat;
