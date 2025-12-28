"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Leaf, 
  Users, 
  Shield, 
  TrendingUp, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  Globe, 
  PlayCircle 
} from "lucide-react";

// Images from old code
const heroImages = [
  "/hero/1.png",
  "/hero/2.png",
  "/hero/3.png",
  "/hero/4.png",
  "/hero/5.png",
];

export default function LandingPage() {
  const [index, setIndex] = useState(0);

  // Carousel Logic restored from old code
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* TOP BAR - INDIAN CONTEXT (Restored) */}
      <div className="bg-emerald-900 text-emerald-50 py-2 px-4 text-sm font-medium">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>Available in: English, हिंदी, मराठी</span>
          </div>
          <div className="hidden md:block">
            <span>Kisan Helpline: 1800-180-1551</span>
          </div>
        </div>
      </div>

      {/* NAVBAR (Restored Style) */}
      <header className="sticky top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
              Farm<span className="text-emerald-600">AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden md:block">
              <Button variant="ghost" className="text-lg font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-bold rounded-full px-8 py-6 shadow-md shadow-emerald-200 transition-transform active:scale-95">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO SECTION (Restored Carousel & Layout) */}
        <section className="relative pt-10 pb-20 lg:pt-16 lg:pb-32 overflow-hidden bg-gradient-to-b from-emerald-50/50 to-white">
          <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT Content */}
            <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0 z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
                Technology that understands <br className="hidden md:block" />
                <span className="text-emerald-600">Your Harvest.</span>
              </h1>

              <p className="text-xl text-slate-600 mb-8 leading-relaxed font-medium">
                Increase your yield with instant disease detection, real-time market prices, and voice-guided farming advice. 
                <span className="block mt-2 font-bold text-slate-800">Simple. Accurate. Free for Farmers.</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200/50">
                    Start Farming Smarter
                    <ChevronRight className="ml-2 h-6 w-6" />
                  </Button>
                </Link>
                <Link href="#about">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl bg-transparent">
                    <PlayCircle className="mr-2 h-6 w-6 text-emerald-600" />
                    Watch Demo
                  </Button>
                </Link>
              </div>
            </div>

            {/* RIGHT Slideshow (Restored) */}
            <div className="relative mx-auto w-full max-w-[600px] lg:max-w-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-emerald-100/50 rounded-full blur-3xl -z-10" />
              <div className="relative w-full aspect-[4/3] md:aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
                {heroImages.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt="Farm technology demonstration"
                    fill
                    priority={i === 0}
                    className={`object-cover transition-all duration-1000 ease-in-out ${
                      index === i ? "opacity-100 scale-100" : "opacity-0 scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION (Restored Card Styling) */}
        <section id="about" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything a Farmer Needs</h2>
              <p className="text-lg text-slate-600">We combined complex AI technology with a simple interface so you can focus on what matters—your farm.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature Cards with restored icons and hover effects */}
              {[
                { title: "Crop Advisory", desc: "Scientific advice on when to sow, irrigate, and harvest based on real-time soil data.", icon: Leaf, color: "bg-green-100", text: "text-green-700" },
                { title: "Disease Check", desc: "Simply take a photo of a sick leaf. Our AI identifies the disease and suggests medicine instantly.", icon: Shield, color: "bg-red-100", text: "text-red-600" },
                { title: "Mandi Prices", desc: "Check live market rates in your nearby Mandis to ensure you get the best profit.", icon: TrendingUp, color: "bg-amber-100", text: "text-amber-600" },
                { title: "Community", desc: "Connect with experts and other farmers. Voice support available in local languages.", icon: Users, color: "bg-blue-100", text: "text-blue-600" }
              ].map((f, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-14 h-14 ${f.color} rounded-xl flex items-center justify-center mb-6`}>
                    <f.icon className={`h-7 w-7 ${f.text}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CALL TO ACTION (Restored Emerald Dark Theme) */}
        <section className="py-20 bg-emerald-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to upgrade your farm?</h2>
            <p className="text-emerald-100 text-lg mb-8 max-w-2xl mx-auto">
              Join Indian farmers using AI to protect their crops and increase their income. Registration is free.
            </p>
            <Link href="/register">
              <Button className="bg-white text-emerald-900 hover:bg-emerald-50 text-xl px-10 py-8 rounded-full font-bold shadow-lg">
                Register Now - It's Free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* FOOTER (Restored Old Layout) */}
      <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="h-6 w-6 text-emerald-500" />
                <span className="text-2xl font-bold text-white">Farm AI</span>
              </div>
              <p className="text-slate-400 max-w-sm">
                Dedicated to the prosperity of Indian agriculture through technology, innovation, and accessible tools.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-emerald-400">Login</Link></li>
                <li><Link href="/register" className="hover:text-emerald-400">Register</Link></li>
                <li><Link href="#" className="hover:text-emerald-400">About Us</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2"><Phone className="h-4 w-4"/> +91 1800-180-1551</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4"/> help@farmai.in</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4"/> Pune, Maharashtra</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Farm AI. Made with ❤️ for Indian Farmers.
          </div>
        </div>
      </footer>
    </div>
  );
}