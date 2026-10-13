"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  MapPin,
  Sprout,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  suggestedQuestions?: string[];
  modelUsed?: string;
}

export default function ChatPage() {
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [farmer, setFarmer] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({
    lat: 19.07,
    lon: 72.88,
  });

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Load user profile & initial welcome message
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let parsedUser: any = null;
    if (storedUser) {
      try {
        parsedUser = JSON.parse(storedUser);
        setFarmer(parsedUser);
      } catch (e) {
        console.error("Failed to parse user profile:", e);
      }
    }

    // Geolocation
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        () => {
          if (parsedUser?.latitude && parsedUser?.longitude) {
            setLocation({
              lat: parsedUser.latitude,
              lon: parsedUser.longitude,
            });
          }
        }
      );
    }

    // Initial greeting customized to language & farmer name
    const name = parsedUser?.fullName ? ` ${parsedUser.fullName} ji` : "";
    const crops = parsedUser?.crops?.length
      ? ` for your ${parsedUser.crops.join(", ")} crops`
      : "";

    let welcomeText = `Namaste${name}! I'm Farmii 🌱 — your personal AI agricultural expert. I'm ready to assist you${crops}. Ask me about plant diseases, fertilizer dosages, weather alerts, or mandi rates!`;

    if (language === "hi") {
      welcomeText = `नमस्ते${name}! मैं फार्मी (Farmii) हूँ 🌱 — आपका निजी डिजिटल कृषि मित्र। मैं आपकी ${
        parsedUser?.crops?.length ? parsedUser.crops.join(", ") : "फसलों"
      } की देखभाल, खाद, रोग नियंत्रण और मंडी भाव में मदद के लिए तैयार हूँ। अपना सवाल पूछें!`;
    } else if (language === "mr") {
      welcomeText = `नमस्कार${name}! मी फार्मी (Farmii) 🌱 — तुमचा वैयक्तिक कृषी सल्लागार. तुमच्या ${
        parsedUser?.crops?.length ? parsedUser.crops.join(", ") : "शेती"
      } पिकांचे रोग, खतांचे प्रमाण, हवामान किंवा बाजारभावाबाबत काहीही विचारा!`;
    }

    setMessages([
      {
        id: "welcome-1",
        content: welcomeText,
        sender: "bot",
        timestamp: new Date(),
        suggestedQuestions: getInitialQuestions(parsedUser, language),
      },
    ]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function getInitialQuestions(user: any, lang: string): string[] {
    const crop = user?.crops?.[0] || (lang === "mr" ? "टोमॅटो" : lang === "hi" ? "टमाटर" : "Tomato");
    if (lang === "mr") {
      return [
        `🌿 ${crop} पिकावरील रोगांवर कोणती फवारणी करावी?`,
        `💧 आज शेताला पाणी द्यावे का?`,
        `🧪 ${crop} पिकासाठी योग्य खताचे प्रमाण काय?`,
      ];
    }
    if (lang === "hi") {
      return [
        `🌿 ${crop} में कीट व रोग के लिए कौन सी दवा डालें?`,
        `💧 क्या आज मेरी फसल में सिंचाई करनी चाहिए?`,
        `🧪 ${crop} के लिए खाद की सही खुराक क्या है?`,
      ];
    }
    return [
      `🌿 Recommended pesticide & dosage for ${crop}?`,
      `💧 Should I irrigate my crops today based on weather?`,
      `🧪 Balanced fertilizer schedule for ${crop}?`,
    ];
  }

  // Handle Voice Recognition (Web Speech API)
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser does not support voice input. Please type your query.",
        variant: "destructive",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Set voice recognition language
      if (language === "mr") {
        recognition.lang = "mr-IN";
      } else if (language === "hi") {
        recognition.lang = "hi-IN";
      } else {
        recognition.lang = "en-IN";
      }

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech init error:", err);
      setIsRecording(false);
    }
  };

  // Text-to-Speech Playback
  const speakMessage = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast({
        title: "Voice Output Unsupported",
        description: "Your browser does not support speech playback.",
      });
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean markdown characters (*, #, _, `) for cleaner speech
    const cleanText = text
      .replace(/[*#_`]/g, "")
      .replace(/\n+/g, ". ");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (language === "mr") {
      utterance.lang = "mr-IN";
    } else if (language === "hi") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 0.95; // slightly slower for rural clarity
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const copyMessage = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Clear chat
  const clearChat = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeakingMsgId(null);
    setMessages([]);
    setTimeout(() => {
      setMessages([
        {
          id: Date.now().toString(),
          content:
            language === "mr"
              ? "नमस्कार! मी फार्मी, तुमचा शेती मित्र. नवीन प्रश्न विचारा!"
              : language === "hi"
              ? "नमस्ते! मैं फार्मी, आपका कृषि मित्र। नया प्रश्न पूछें!"
              : "Hello! Farmii is ready for your next farming question.",
          sender: "bot",
          timestamp: new Date(),
          suggestedQuestions: getInitialQuestions(farmer, language),
        },
      ]);
    }, 100);
  };

  // Send message
  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputMessage;
    if (!textToSend.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: textToSend.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Build conversation history for multi-turn reasoning
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        content: m.content,
      }));

      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const res = await fetch(`${apiBase}/api/chatbot`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: textToSend.trim(),
          history: historyPayload,
          language: language || "en",
          location,
          farmerProfile: farmer
            ? {
                fullName: farmer.fullName,
                farmLocation: farmer.farmLocation,
                state: farmer.state,
                district: farmer.district,
                village: farmer.village,
                crops: farmer.crops || [],
                farmingType: farmer.farmingType || "traditional",
                farmerCategory: farmer.farmerCategory || "small",
              }
            : null,
        }),
      });

      const data = await res.json();

      const botReply =
        data.reply ||
        data.error ||
        "I’m here to help with your farming. Please ask again!";

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: botReply,
        sender: "bot",
        timestamp: new Date(),
        suggestedQuestions: data.suggestedQuestions || [],
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chatbot request error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content:
            language === "mr"
              ? "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा."
              : language === "hi"
              ? "सर्वर से संपर्क नहीं हो पाया। कृपया कुछ समय बाद पुनः प्रयास करें।"
              : "Unable to connect to Farmii service. Please try again shortly.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to format message paragraphs, bullets, bold text
  const renderFormattedMessage = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-2" />;
      }

      // Headers (### or ##)
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-bold text-sm text-emerald-900 mt-2 mb-1">
            {trimmed.replace(/^###\s+/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-extrabold text-base text-emerald-950 mt-3 mb-1">
            {trimmed.replace(/^##\s+/, "")}
          </h3>
        );
      }

      // Bullet points
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const bulletText = trimmed.replace(/^[*\-]\s+/, "");
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className="text-emerald-600 mt-1 text-xs">•</span>
            <span className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBold(bulletText) }} />
          </div>
        );
      }

      return (
        <p key={idx} className="text-sm leading-relaxed my-1" dangerouslySetInnerHTML={{ __html: formatBold(trimmed) }} />
      );
    });
  };

  function formatBold(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        
        {/* FARMER PROFILE CONTEXT BANNER */}
        <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200/80 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2 rounded-lg shadow-sm">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {farmer?.fullName ? `${farmer.fullName}` : "Farmer Partner"}
                </span>
                <Badge variant="outline" className="bg-emerald-100/80 text-emerald-800 border-emerald-300 text-xs">
                  {farmer?.farmingType === "organic" ? "🌱 Organic" : "🚜 Traditional"}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-emerald-600" />
                  {farmer?.farmLocation || farmer?.district || "India"}
                </span>
                {farmer?.crops && farmer.crops.length > 0 && (
                  <span className="hidden sm:inline">
                    🌾 Crops: <strong className="text-slate-700">{farmer.crops.join(", ")}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              className="text-xs h-8 text-slate-600 hover:text-red-600 border-slate-200"
              title="Clear Conversation"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset Chat
            </Button>
          </div>
        </div>

        {/* CHAT CONTAINER */}
        <Card className="border-border shadow-md flex flex-col h-[650px] overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/80 border-b border-slate-200/80 py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <div className="relative">
                <Avatar className="h-8 w-8 bg-emerald-600 border border-emerald-500 shadow-sm">
                  <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                    🌾
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              <div>
                <span>Farmii AI</span>
                <span className="block text-xs font-normal text-emerald-700">
                  Online • Personalized for your farm
                </span>
              </div>
            </CardTitle>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Agri Guidance</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50/30">
            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-emerald-600 border border-emerald-500">
                      <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                        🌱
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[85%] md:max-w-[75%] space-y-2`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        msg.sender === "user"
                          ? "bg-emerald-600 text-white rounded-br-none"
                          : "bg-white text-slate-800 border border-slate-200/90 rounded-bl-none"
                      }`}
                    >
                      {msg.sender === "bot" ? (
                        <div className="prose prose-sm max-w-none text-slate-800">
                          {renderFormattedMessage(msg.content)}
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}

                      {/* MESSAGE FOOTER ACTIONS */}
                      <div
                        className={`flex items-center justify-between gap-2 mt-2 pt-1 border-t text-xs ${
                          msg.sender === "user"
                            ? "border-emerald-500/50 text-emerald-100"
                            : "border-slate-100 text-slate-400"
                        }`}
                      >
                        <span>
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>

                        {msg.sender === "bot" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => speakMessage(msg.id, msg.content)}
                              className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                                speakingMsgId === msg.id ? "text-emerald-600" : "text-slate-400"
                              }`}
                              title={speakingMsgId === msg.id ? "Stop voice" : "Read aloud (Listen)"}
                            >
                              {speakingMsgId === msg.id ? (
                                <VolumeX className="h-3.5 w-3.5 text-red-500 animate-pulse" />
                              ) : (
                                <Volume2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => copyMessage(msg.id, msg.content)}
                              className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-400"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SUGGESTED FOLLOW-UP QUESTION CHIPS */}
                    {msg.sender === "bot" && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {msg.suggestedQuestions.map((q, qIdx) => (
                          <button
                            key={qIdx}
                            onClick={() => handleSendMessage(q)}
                            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/90 rounded-full px-3 py-1 font-medium transition-colors shadow-2xs hover:shadow-xs active:scale-95 text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {msg.sender === "user" && (
                    <Avatar className="h-8 w-8 mt-0.5 shrink-0 bg-slate-700">
                      <AvatarFallback className="bg-slate-700 text-white text-xs">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* TYPING INDICATOR */}
              {isTyping && (
                <div className="flex gap-2.5 justify-start items-center">
                  <Avatar className="h-8 w-8 bg-emerald-600 border border-emerald-500">
                    <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                      🌱
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-xs">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs text-emerald-700 font-medium mr-1.5">Farmii is thinking</span>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                      <div
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.15s" }}
                      />
                      <div
                        className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.3s" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* INPUT SECTION */}
            <div className="border-t border-slate-200 bg-white p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      language === "mr"
                        ? "शेतीबद्दल काहीही विचारा (उदा. खताचे प्रमाण, फवारणी)..."
                        : language === "hi"
                        ? "खेती के बारे में पूछें (जैसे खाद की मात्रा, कीटनाशक)..."
                        : "Ask Farmii anything (e.g. fertilizer dose, spray timing)..."
                    }
                    disabled={isTyping}
                    className="border-slate-300 focus:border-emerald-600 focus:ring-emerald-600 pr-11 py-5 text-sm rounded-xl shadow-xs"
                  />
                  
                  {/* MICROPHONE BUTTON */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleRecording}
                    className={`absolute right-1.5 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg ${
                      isRecording
                        ? "bg-red-50 text-red-600 animate-pulse hover:bg-red-100"
                        : "text-slate-400 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                    title={isRecording ? "Listening... Click to stop" : "Speak your query (Mic)"}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>

                {/* SEND BUTTON */}
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-5 rounded-xl shadow-sm transition-transform active:scale-95"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* VOICE STATUS ALERT */}
              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium px-1 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-red-600" />
                  <span>
                    {language === "mr"
                      ? "माईक चालू आहे... कृपया स्पष्ट बोला"
                      : language === "hi"
                      ? "माइक चालू है... कृपया स्पष्ट बोलें"
                      : "Listening... Speak clearly into your microphone"}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
