import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Users, Shield, TrendingUp, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">Farm AI</span>
          </div>
          <div className="flex space-x-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/indian-farmer-hero.jpg')",
            filter: "brightness(0.7)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent" />

        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-balance">Farm AI</h1>
          <p className="text-xl md:text-2xl mb-8 text-balance opacity-90">
            {"Empowering Small & Marginal Farmers with Smart Agricultural Solutions"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3">
                Get Started Today
              </Button>
            </Link>
            <Link href="#about">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-3 bg-transparent"
              >
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-6">About Farm AI</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-balance">
              Farm AI is a comprehensive Smart Crop Advisory System designed specifically for small and marginal farmers
              in India. Our platform combines cutting-edge AI technology with local agricultural expertise to provide
              personalized, actionable insights that help farmers increase productivity, reduce costs, and make informed
              decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Leaf className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Crop Advisory</h3>
                <p className="text-muted-foreground">
                  Get location-specific crop recommendations based on soil, weather, and market conditions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Disease Detection</h3>
                <p className="text-muted-foreground">
                  AI-powered crop disease identification with instant treatment recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Market Insights</h3>
                <p className="text-muted-foreground">
                  Real-time market price tracking and predictive analytics for better selling decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-border hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-3 text-card-foreground">Voice Support</h3>
                <p className="text-muted-foreground">
                  Multilingual voice support for farmers with varying levels of digital literacy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Leaf className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Farm AI</span>
              </div>
              <p className="text-sm opacity-80">
                Empowering farmers with intelligent agricultural solutions for a sustainable future.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Crop Disease Detection</li>
                <li>Soil Health Analysis</li>
                <li>Weather Predictions</li>
                <li>Market Price Tracking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm opacity-80">
                <li>Help Center</li>
                <li>Voice Support</li>
                <li>Training Videos</li>
                <li>Community Forum</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-sm opacity-80">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>+91 1800-XXX-XXXX</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>support@farmai.in</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>New Delhi, India</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/20 mt-8 pt-8 text-center text-sm opacity-60">
            <p>&copy; 2024 Farm AI. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
