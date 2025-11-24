"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Mic, MicOff } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function ChatPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm Farmii 🌱 — your AI farming assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lon: number }>({ lat: 19.07, lon: 72.88 });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setLocation({ lat: 19.07, lon: 72.88 })
      );
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = { "Content-Type": "application/json" }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: inputMessage, location }),
      });

      const data = await res.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        content: data.reply || data.error || "⚠️ Something went wrong.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: t("serverError"),
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInputMessage("My tomato plants have yellow leaves, what should I do?");
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <Card className="border-border h-[600px] flex flex-col">
          <CardHeader className="border-b border-border">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              {t("chatWithFarmii")}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.sender === "bot" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {msg.sender === "user" && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={t("askFarmiiAnything")}
                    className="border-border focus:ring-primary pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleRecording}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 ${
                      isRecording ? "text-red-500" : "text-muted-foreground"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isRecording && <p className="text-sm text-red-500 mt-2 animate-pulse">🎙 {t("recording")}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
